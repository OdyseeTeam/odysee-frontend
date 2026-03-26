// WHIP (WebRTC-HTTP Ingestion) client helper for browser streaming.

import { getLivestreamTurnServer } from 'constants/livestream';
import type { WebrtcPublishVideoCodecPreference } from 'constants/webrtcPublish';

const DEFAULT_ICE_GATHER_TIMEOUT_MS = 4000;

/**
 * Wait until ICE gathering is done, or timeout, or end-of-candidates.
 * Some browsers never set iceGatheringState to "complete"; without a cap we never reach fetch().
 */
function waitForIceGatheringDone(
  pc: RTCPeerConnection,
  signal: AbortSignal | undefined,
  timeoutMs: number
): Promise<void> {
  if (pc.iceGatheringState === 'complete') return Promise.resolve();

  return new Promise((resolve, reject) => {
    let finished = false;
    let timer: ReturnType<typeof setTimeout>;

    const cleanup = () => {
      clearTimeout(timer);
      pc.removeEventListener('icegatheringstatechange', onIceGathering);
      pc.removeEventListener('icecandidate', onIceCandidate);
      signal?.removeEventListener('abort', onAbort);
    };

    const done = () => {
      if (finished) return;
      finished = true;
      cleanup();
      resolve();
    };

    const onAbort = () => {
      if (finished) return;
      finished = true;
      cleanup();
      reject(new DOMException('Aborted', 'AbortError'));
    };

    const onIceGathering = () => {
      if (pc.iceGatheringState === 'complete') done();
    };

    const onIceCandidate = (e: RTCPeerConnectionIceEvent) => {
      if (e.candidate === null) done();
    };

    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    signal?.addEventListener('abort', onAbort);
    pc.addEventListener('icegatheringstatechange', onIceGathering);
    pc.addEventListener('icecandidate', onIceCandidate);
    timer = setTimeout(() => done(), timeoutMs);
  });
}

export type WhipPublishResult = {
  pc: RTCPeerConnection;
  resourceUrl: string | null;
};

export type StartWhipPublishOptions = {
  signal?: AbortSignal;
  iceGatherTimeoutMs?: number;
  maxVideoBitrateBps?: number;
  maxVideoFramerate?: number;
  videoCodecPreference?: WebrtcPublishVideoCodecPreference;
  degradationPreference?: RTCDegradationPreference;
};

type WhipCodecCapability = {
  mimeType: string;
  sdpFmtpLine?: string;
};

function h264IngestPreferenceScore(sdpFmtpLine: string | undefined): number {
  if (!sdpFmtpLine) return 2;
  const f = sdpFmtpLine.toLowerCase();
  if (f.includes('profile-level-id=42e01f')) return 0;
  if (f.includes('profile-level-id=42001f')) return 1;
  return 2;
}

function matchesVideoCodecPreference(
  codec: WhipCodecCapability,
  preference: Exclude<WebrtcPublishVideoCodecPreference, 'auto'>
): boolean {
  const mime = codec.mimeType.toLowerCase();

  switch (preference) {
    case 'hevc':
      return mime === 'video/h265' || mime === 'video/hevc';
    case 'vp9':
      return mime === 'video/vp9';
    case 'av1':
      return mime === 'video/av1';
    case 'h264':
      return mime === 'video/h264';
    default:
      return false;
  }
}

function prioritizeVideoCodec(
  codecs: WhipCodecCapability[],
  preference: WebrtcPublishVideoCodecPreference | undefined
): WhipCodecCapability[] {
  const preferredOrder: Exclude<WebrtcPublishVideoCodecPreference, 'auto'>[] =
    !preference || preference === 'auto'
      ? ['hevc', 'h264', 'vp9', 'av1']
      : [preference];

  const preferred: WhipCodecCapability[] = [];
  const used = new Set<WhipCodecCapability>();

  preferredOrder.forEach((preferredCodec) => {
    codecs.forEach((codec) => {
      if (!used.has(codec) && matchesVideoCodecPreference(codec, preferredCodec)) {
        preferred.push(codec);
        used.add(codec);
      }
    });
  });

  const rest = codecs.filter((codec) => !used.has(codec));
  return [...preferred, ...rest];
}

function reorderVideoCodecsForIngest(
  codecs: WhipCodecCapability[],
  preference: WebrtcPublishVideoCodecPreference | undefined
): WhipCodecCapability[] {
  const prioritized = prioritizeVideoCodec(codecs, preference);
  const h264Preferred = preference === 'h264';

  return [...prioritized].sort((a, b) => {
    const aIsH264 = a.mimeType.toLowerCase() === 'video/h264';
    const bIsH264 = b.mimeType.toLowerCase() === 'video/h264';

    if (aIsH264 && bIsH264) {
      return h264IngestPreferenceScore(a.sdpFmtpLine) - h264IngestPreferenceScore(b.sdpFmtpLine);
    }

    if (h264Preferred && aIsH264 !== bIsH264) {
      return aIsH264 ? -1 : 1;
    }

    return 0;
  });
}

function isProbablyAacCodec(c: WhipCodecCapability): boolean {
  const m = c.mimeType.toLowerCase();
  return m.includes('aac') || m.includes('mp4a') || m.includes('latm');
}

function reorderAudioCodecsPreferOpusThenBrowserFallback(codecs: WhipCodecCapability[]): WhipCodecCapability[] {
  const opus = codecs.filter((c) => c.mimeType.toLowerCase() === 'audio/opus');
  const nonOpus = codecs.filter((c) => c.mimeType.toLowerCase() !== 'audio/opus');
  if (opus.length > 0) {
    return [...opus, ...nonOpus];
  }

  const aac = codecs.filter(isProbablyAacCodec);
  const withoutAac = codecs.filter((c) => !isProbablyAacCodec(c));
  if (aac.length > 0) {
    return [...aac, ...withoutAac];
  }

  return codecs;
}

function addPublishTracks(pc: RTCPeerConnection, stream: MediaStream): void {
  stream.getTracks().forEach((track) => {
    if (track.kind === 'video' && 'contentHint' in track) {
      track.contentHint = 'motion';
    }
    pc.addTransceiver(track, {
      direction: 'sendonly',
      streams: [stream],
    });
  });
}

function applyOutgoingCodecPreferencesForIngest(
  pc: RTCPeerConnection,
  preferredVideoCodec: WebrtcPublishVideoCodecPreference | undefined
): void {
  if (typeof RTCRtpSender.getCapabilities !== 'function') return;

  for (const transceiver of pc.getTransceivers()) {
    const track = transceiver.sender.track;
    if (!track || typeof transceiver.setCodecPreferences !== 'function') continue;

    try {
      if (track.kind === 'video') {
        const { codecs } = RTCRtpSender.getCapabilities('video');
        if (codecs?.length) {
          transceiver.setCodecPreferences(reorderVideoCodecsForIngest(codecs, preferredVideoCodec) as any);
        }
      } else if (track.kind === 'audio') {
        const { codecs } = RTCRtpSender.getCapabilities('audio');
        if (codecs?.length) {
          transceiver.setCodecPreferences(reorderAudioCodecsPreferOpusThenBrowserFallback(codecs) as any);
        }
      }
    } catch {
      // Browser may reject ordering; fall back to default negotiation.
    }
  }
}

async function applyOutboundVideoEncoding(
  pc: RTCPeerConnection,
  options: Pick<StartWhipPublishOptions, 'maxVideoBitrateBps' | 'maxVideoFramerate' | 'degradationPreference'>
): Promise<void> {
  const { maxVideoBitrateBps, maxVideoFramerate, degradationPreference } = options;
  if (maxVideoBitrateBps == null && maxVideoFramerate == null && !degradationPreference) return;

  for (const sender of pc.getSenders()) {
    if (sender.track?.kind !== 'video') continue;

    const params = sender.getParameters();
    if (!params.encodings || params.encodings.length === 0) {
      params.encodings = [{}];
    }

    const enc = params.encodings[0];
    if (maxVideoBitrateBps != null) enc.maxBitrate = maxVideoBitrateBps;
    if (maxVideoFramerate != null) enc.maxFramerate = maxVideoFramerate;
    (params as any).degradationPreference = degradationPreference || 'balanced';

    try {
      await sender.setParameters(params);
    } catch {
      // Browser may reject unsupported combinations.
    }
  }
}

export async function updateWhipVideoEncodingPolicy(
  pc: RTCPeerConnection | null,
  options: Pick<StartWhipPublishOptions, 'maxVideoBitrateBps' | 'maxVideoFramerate' | 'degradationPreference'>
): Promise<void> {
  if (!pc) return;
  await applyOutboundVideoEncoding(pc, options);
}

function setSDPBitrate(sdp: string, bitrateKbps: number): string {
  let munged = sdp.replace(/b=AS:\d+\r?\n/g, '');
  munged = munged.replace(/(m=video.*\r?\n)/g, `$1b=AS:${bitrateKbps}\r\n`);
  return munged;
}

function parseAnswerSdp(response: Response, bodyText: string): string {
  const ct = response.headers.get('Content-Type') || '';
  if (ct.includes('application/sdp')) return bodyText;
  return bodyText.trim();
}

function logSdpCandidates(label: string, sdp: string) {
  const candidates = sdp.match(/a=candidate:.*/g) || [];
  const transports = candidates.map((c: string) => {
    const parts = c.split(' ');
    const proto = parts[2]?.toUpperCase();
    const type = parts[7] || '';
    return `${proto} ${type} ${parts[4]}:${parts[5]}`;
  });
  console.log(`[WHIP] ${label}:`, transports.length ? transports.join(', ') : '(none)'); // eslint-disable-line no-console
}

export async function startWhipPublish(
  whipUrl: string,
  stream: MediaStream,
  options?: StartWhipPublishOptions
): Promise<WhipPublishResult> {
  const signal = options?.signal;
  const iceMs = options?.iceGatherTimeoutMs ?? DEFAULT_ICE_GATHER_TIMEOUT_MS;

  const iceServers: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }];
  const turnServer = getLivestreamTurnServer();
  if (turnServer) {
    iceServers.push(turnServer);
    console.log('[WHIP] Using TURN server:', turnServer.urls); // eslint-disable-line no-console
  }

  const pc = new RTCPeerConnection({
    iceServers,
    iceTransportPolicy: 'all',
  });

  try {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    addPublishTracks(pc, stream);
    applyOutgoingCodecPreferencesForIngest(pc, options?.videoCodecPreference);

    const offer = await pc.createOffer();
    const targetBitrateKbps = options?.maxVideoBitrateBps ? Math.round(options.maxVideoBitrateBps / 1000) : 2500;
    const mungedOffer = {
      type: offer.type,
      sdp: setSDPBitrate(offer.sdp || '', targetBitrateKbps),
    } as RTCSessionDescriptionInit;

    await pc.setLocalDescription(mungedOffer);
    await applyOutboundVideoEncoding(pc, {
      maxVideoBitrateBps: options?.maxVideoBitrateBps,
      maxVideoFramerate: options?.maxVideoFramerate,
      degradationPreference: options?.degradationPreference,
    });
    await waitForIceGatheringDone(pc, signal, Math.max(iceMs, 5000));

    const sdp = pc.localDescription?.sdp;
    if (!sdp) throw new Error('Missing local SDP');

    logSdpCandidates('Offer candidates', sdp);

    const response = await fetch(whipUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/sdp' },
      body: sdp,
      signal,
    });

    const bodyText = await response.text();
    if (!response.ok) {
      throw new Error(bodyText || `WHIP failed (${response.status})`);
    }

    const answerSdp = parseAnswerSdp(response, bodyText);
    if (!answerSdp) {
      throw new Error('Empty SDP answer from WHIP server');
    }

    logSdpCandidates('Answer candidates', answerSdp);
    await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        pc.getStats()
          .then((stats) => {
            stats.forEach((report: any) => {
              if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                const localId = report.localCandidateId;
                const remoteId = report.remoteCandidateId;
                stats.forEach((r: any) => {
                  if (r.id === localId) {
                    const relayInfo = r.relayProtocol ? ` (relay via ${r.relayProtocol.toUpperCase()})` : '';
                    console.log(`[WHIP] Connected local: ${r.protocol} ${r.candidateType} ${r.address}:${r.port}${relayInfo}`); // eslint-disable-line no-console
                  }
                  if (r.id === remoteId) {
                    console.log(`[WHIP] Connected remote: ${r.protocol} ${r.candidateType} ${r.address}:${r.port}`); // eslint-disable-line no-console
                  }
                });
              }
            });
          })
          .catch(() => {});
      }
    };

    const resourceUrl = response.headers.get('Location');
    return { pc, resourceUrl: resourceUrl ? new URL(resourceUrl, whipUrl).href : null };
  } catch (e) {
    try {
      pc.close();
    } catch {
      // ignore
    }
    throw e;
  }
}

export async function stopWhipPublish(pc: RTCPeerConnection | null, resourceUrl: string | null, stream: MediaStream) {
  stream.getTracks().forEach((t) => t.stop());
  try {
    if (resourceUrl) {
      await fetch(resourceUrl, { method: 'DELETE' });
    }
  } catch {
    // ignore
  }
  try {
    pc?.close();
  } catch {
    // ignore
  }
}
