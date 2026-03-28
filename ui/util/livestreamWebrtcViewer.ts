/**
 * WebRTC viewer client for OvenMediaEngine (OME) signaling protocol.
 * OME uses a custom WebSocket signaling (not WHIP - that's for publishing).
 *
 * Signaling flow:
 * 1. Connect WebSocket to wss://host:port/live/{streamKey}
 * 2. Server sends { command: 'offer', sdp: '...' }
 * 3. Client responds with { command: 'answer', sdp: '...' }
 * 4. Server sends ICE candidates: { command: 'candidate', candidates: [...] }
 * 5. Media flows via RTCPeerConnection
 */

const VIEWER_DEBUG = process.env.NODE_ENV === 'development';

export type WebrtcViewerResult = {
  pc: RTCPeerConnection;
  ws: WebSocket;
  stream: MediaStream;
};

type ViewerCodecCapability = {
  mimeType: string;
};

function codecScore(c: ViewerCodecCapability): number {
  const mime = c.mimeType.toLowerCase();
  if (mime === 'video/h265' || mime === 'video/hevc') return 0;
  if (mime === 'video/h264') return 1;
  if (mime === 'video/vp9') return 2;
  if (mime === 'video/vp8') return 3;
  if (mime === 'video/av1') return 4;
  if (mime.includes('rtx') || mime.includes('red') || mime.includes('ulpfec')) return 100;
  return 50;
}

/**
 * Reorder receiver codec preferences to prefer H.265 > H.264 > VP9 > VP8.
 * H.265 gives ~50% better compression than H.264 at the same quality.
 * Chrome 119+ supports H.265 WebRTC decoding with hardware acceleration.
 */
function applyReceiverCodecPreferences(pc: RTCPeerConnection): void {
  if (typeof RTCRtpReceiver?.getCapabilities !== 'function') return;

  for (const transceiver of pc.getTransceivers()) {
    if (typeof transceiver.setCodecPreferences !== 'function') continue;

    // Only set preferences for video
    const mid = transceiver.mid;
    const receiver = transceiver.receiver;
    if (!receiver?.track || receiver.track.kind !== 'video') {
      // Before tracks are assigned, check the transceiver direction/kind from SDP
      // After setRemoteDescription, transceivers are created from the offer
      try {
        const caps = RTCRtpReceiver.getCapabilities('video');
        if (!caps?.codecs?.length) continue;

        const codecs = [...caps.codecs];

        codecs.sort((a, b) => codecScore(a) - codecScore(b));
        transceiver.setCodecPreferences(codecs);

        const preferred = codecs.filter((c) => codecScore(c) <= 4).map((c) => c.mimeType);
        if (VIEWER_DEBUG) console.log('[WebRTC Viewer] Codec preferences:', preferred.join(', ')); // eslint-disable-line no-console
      } catch {
        // Browser may reject; fall back to default
      }
    }
  }
}

export async function startWebrtcViewer(signalingUrl: string, signal?: AbortSignal): Promise<WebrtcViewerResult> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    const ws = new WebSocket(signalingUrl);
    let settled = false;
    const remoteStream = new MediaStream();

    // Debug ICE state
    pc.oniceconnectionstatechange = () => {
      if (VIEWER_DEBUG) console.log('[WebRTC Viewer] ICE state:', pc.iceConnectionState); // eslint-disable-line no-console
    };
    pc.onconnectionstatechange = () => {
      if (VIEWER_DEBUG) console.log('[WebRTC Viewer] Connection state:', pc.connectionState); // eslint-disable-line no-console
    };

    // Collect remote tracks
    pc.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
      // Resolve once we have at least one video track
      if (!settled && remoteStream.getVideoTracks().length > 0) {
        settled = true;
        resolve({ pc, ws, stream: remoteStream });

        // Log the negotiated codec after a short delay (stats need time to populate)
        setTimeout(() => {
          pc.getStats()
            .then((stats) => {
              stats.forEach((report: any) => {
                if (report.type === 'inbound-rtp' && report.kind === 'video') {
                  const codecId = report.codecId;
                  if (codecId) {
                    stats.forEach((r: any) => {
                      if (r.id === codecId) {
                        console.log(
                          `[WebRTC Viewer] Playing: ${r.mimeType}${r.sdpFmtpLine ? ' (' + r.sdpFmtpLine + ')' : ''}`
                        ); // eslint-disable-line no-console
                      }
                    });
                  }
                }
              });
            })
            .catch(() => {});
        }, 2000);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            command: 'candidate',
            candidates: [event.candidate],
          })
        );
      }
    };

    const onAbort = () => {
      if (!settled) {
        settled = true;
        cleanup();
        reject(new DOMException('Aborted', 'AbortError'));
      }
    };
    signal?.addEventListener('abort', onAbort);

    let cleanup = () => {
      signal?.removeEventListener('abort', onAbort);
    };

    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        cleanup();
        try {
          ws.close();
        } catch {} // eslint-disable-line no-empty
        try {
          pc.close();
        } catch {} // eslint-disable-line no-empty
        reject(new Error('WebRTC viewer signaling timeout'));
      }
    }, 10000);

    const handleOpen = () => {
      // OME expects the client to send a request_offer command
      ws.send(JSON.stringify({ command: 'request_offer' }));
    };

    const handleMessage = async (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.command === 'offer') {
          // OME sends sdp as either a string or an object {sdp: "...", type: "offer"}
          const sdpString = typeof msg.sdp === 'string' ? msg.sdp : msg.sdp?.sdp;
          if (!sdpString) {
            console.error('[WebRTC Viewer] No SDP in offer:', msg); // eslint-disable-line no-console
            return;
          }

          const offer: RTCSessionDescriptionInit = {
            type: 'offer',
            sdp: sdpString,
          };

          if (VIEWER_DEBUG) console.log('[WebRTC Viewer] Received offer'); // eslint-disable-line no-console
          await pc.setRemoteDescription(offer);

          // Set codec preferences before creating the answer.
          applyReceiverCodecPreferences(pc);

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          if (VIEWER_DEBUG) console.log('[WebRTC Viewer] Sending answer'); // eslint-disable-line no-console

          // OME expects the answer in the same format it sent the offer
          ws.send(
            JSON.stringify({
              command: 'answer',
              id: msg.id,
              peer_id: msg.peer_id,
              sdp: {
                type: 'answer',
                sdp: answer.sdp,
              },
            })
          );

          // Process any ICE candidates included in the offer message
          if (msg.candidates) {
            if (VIEWER_DEBUG) console.log(`[WebRTC Viewer] Processing ${msg.candidates.length} ICE candidates`); // eslint-disable-line no-console
            for (const candidate of msg.candidates) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
              } catch (e) {
                if (VIEWER_DEBUG) console.warn('[WebRTC Viewer] Failed to add candidate:', e); // eslint-disable-line no-console
              }
            }
          }
        }

        if (msg.command === 'candidate') {
          if (msg.candidates) {
            for (const candidate of msg.candidates) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
              } catch (e) {
                if (VIEWER_DEBUG) console.warn('[WebRTC Viewer] Failed to add trickle candidate:', e); // eslint-disable-line no-console
              }
            }
          }
        }
      } catch (e) {
        console.warn('[WebRTC Viewer] Signaling message error:', e); // eslint-disable-line no-console
      }
    };

    const handleError = () => {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        cleanup();
        try {
          pc.close();
        } catch {} // eslint-disable-line no-empty
        reject(new Error('WebRTC signaling connection failed'));
      }
    };

    const handleClose = () => {
      clearTimeout(timeout);
      if (!settled) {
        settled = true;
        cleanup();
        try {
          pc.close();
        } catch {} // eslint-disable-line no-empty
        reject(new Error('WebRTC signaling closed before stream started'));
      }
    };

    ws.addEventListener('open', handleOpen);
    ws.addEventListener('message', handleMessage);
    ws.addEventListener('error', handleError);
    ws.addEventListener('close', handleClose);

    const previousCleanup = cleanup;
    cleanup = () => {
      ws.removeEventListener('open', handleOpen);
      ws.removeEventListener('message', handleMessage);
      ws.removeEventListener('error', handleError);
      ws.removeEventListener('close', handleClose);
      previousCleanup();
    };
  });
}

export function stopWebrtcViewer(result: WebrtcViewerResult | null) {
  if (!result) return;
  try {
    result.ws.close();
  } catch {} // eslint-disable-line no-empty
  try {
    result.pc.close();
  } catch {} // eslint-disable-line no-empty
  result.stream.getTracks().forEach((t) => t.stop());
}
