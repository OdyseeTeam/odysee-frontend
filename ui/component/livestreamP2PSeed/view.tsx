import React from 'react';
import Hls from 'hls.js';
import { getLivestreamTurnServer } from 'constants/livestream';

const P2P_DEBUG = process.env.NODE_ENV === 'development';
const P2P_FORCE_SEGMENT_MODE = true;
const P2P_SEED_PLAYLIST_TIMEOUT_MS = 30000;

function getP2PIceServers() {
  const turnServer = getLivestreamTurnServer();
  return [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:global.stun.twilio.com:3478' }, ...(turnServer ? [turnServer] : [])];
}

function serializeP2PError(error: any) {
  if (!error) return null;
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack || null,
    };
  }
  if (typeof error === 'object') {
    return {
      name: error.name || null,
      message: error.message || null,
      code: error.code || null,
      details: error.details || null,
      raw: String(error),
    };
  }
  return {
    raw: String(error),
  };
}

type Props = {
  /** The HLS video URL of the streamer's own livestream */
  videoUrl: string;
  /** Whether seeding is active */
  active: boolean;
  /** Optional custom tracker URL from livestream metadata */
  trackerUrl?: string | null;
  /** Optional custom swarm ID from livestream metadata */
  swarmId?: string | null;
};

function getP2PAnnounceTrackers(trackerUrl?: string | null): string[] {
  if (!trackerUrl) return [];
  return [trackerUrl];
}

function shortenP2PUrl(url?: string | null) {
  if (!url) return null;

  try {
    const parsed = new URL(url, window.location.href);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return url.length > 120 ? `...${url.slice(-120)}` : url;
  }
}

function summarizeP2PStreams(streams: Map<any, any>) {
  return Array.from(streams.values()).map((stream: any) => ({
    type: stream?.type || 'unknown',
    index: stream?.index ?? null,
    runtimeId: shortenP2PUrl(String(stream?.runtimeId || '')),
    segments: stream?.segments?.size ?? 0,
    peers: stream?.peers?.size ?? 0,
  }));
}

function summarizeP2PSegment(details: any) {
  return {
    source: details?.downloadSource || (details?.peerId ? 'p2p' : 'http'),
    peerId: details?.peerId || null,
    bytesLength: details?.bytesLength ?? null,
    streamType: details?.streamType || null,
    segmentUrl: shortenP2PUrl(details?.segmentUrl || details?.segment?.url || null),
    externalId: details?.segment?.externalId ?? null,
    runtimeId: details?.segment?.runtimeId ? String(details.segment.runtimeId).slice(-80) : null,
  };
}

/**
 * Hidden HLS player with P2P enabled that makes the streamer a seed node.
 * Downloads their own stream segments via HLS and shares them with P2P viewers
 * via WebRTC data channels (p2p-media-loader).
 *
 * No visible UI - runs entirely in the background.
 */
export default function LivestreamP2PSeed({ videoUrl, active, trackerUrl, swarmId }: Props) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const hlsRef = React.useRef<Hls | null>(null);
  const connectedPeersRef = React.useRef<Set<string>>(new Set());

  React.useEffect(() => {
    if (P2P_DEBUG) console.log('[P2P Seed] Effect:', { active, videoUrl: videoUrl?.slice(-40), hlsSupported: Hls.isSupported() }); // eslint-disable-line no-console
    if (!active || !videoUrl || !Hls.isSupported()) return;

    const video = videoRef.current;
    if (!video) return;

    let destroyed = false;

    (async () => {
      let HlsConstructor: typeof Hls = Hls;
      try {
        const { HlsJsP2PEngine } = await import('p2p-media-loader-hlsjs');
        if (destroyed) return;
        // injectMixin RETURNS a new class that extends Hls with P2P support
        HlsConstructor = HlsJsP2PEngine.injectMixin(Hls) as unknown as typeof Hls;
        console.log('[P2P Seed] Seeding enabled'); // eslint-disable-line no-console
      } catch (e) {
        console.warn('[P2P Seed] Failed to load p2p-media-loader, seeding disabled:', e); // eslint-disable-line no-console
        return;
      }

      if (destroyed) return;
      const p2pIceServers = getP2PIceServers();
      const announceTrackers = getP2PAnnounceTrackers(trackerUrl);

      const hls = new HlsConstructor({
        backBufferLength: 30, // Keep more segments in back buffer for P2P sharing
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        playlistLoadPolicy: {
          default: {
            maxTimeToFirstByteMs: P2P_SEED_PLAYLIST_TIMEOUT_MS,
            maxLoadTimeMs: P2P_SEED_PLAYLIST_TIMEOUT_MS,
            timeoutRetry: {
              maxNumRetry: 2,
              retryDelayMs: 0,
              maxRetryDelayMs: 0,
            },
            errorRetry: {
              maxNumRetry: 2,
              retryDelayMs: 1000,
              maxRetryDelayMs: 8000,
            },
          },
        },
        ...(P2P_FORCE_SEGMENT_MODE
          ? {
              lowLatencyMode: false,
            }
          : undefined),
        liveSyncDuration: 10, // Seeder stays further behind so it has segments viewers need
        liveMaxLatencyDuration: 20,
        p2p: {
          core: {
            announceTrackers,
            highDemandTimeWindow: 4, // Seeder downloads more aggressively (it's the source)
            simultaneousHttpDownloads: 4, // Seeder should always download from HTTP fast
            simultaneousP2PDownloads: 0, // Seeder doesn't download from peers, only uploads
            swarmId: swarmId || undefined,
            rtcConfig: {
              iceServers: p2pIceServers,
            },
          },
        },
      });

      hls.attachMedia(video);
      hlsRef.current = hls;
      video.muted = true;
      video.volume = 0;

      // Retry loading if the HLS manifest 404s (CDN may not be ready yet)
      let retryCount = 0;
      const MAX_RETRIES = 10;
      const RETRY_DELAY_MS = 3000;

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        connectedPeersRef.current.clear();
        console.log('[P2P Seed] Seeding active, tracker:', announceTrackers[0] || 'none'); // eslint-disable-line no-console
        video.play().catch(() => {});

        if (hls.p2pEngine) {
          const engine = hls.p2pEngine;
          try {
            engine.addEventListener('onPeerConnect', (details: any) => {
              if (details?.peerId) connectedPeersRef.current.add(details.peerId);
              console.log('[P2P Seed] Peer connected:', details?.peerId); // eslint-disable-line no-console
            });
            engine.addEventListener('onPeerClose', (details: any) => {
              if (details?.peerId) connectedPeersRef.current.delete(details.peerId);
              if (P2P_DEBUG) console.log('[P2P Seed] Peer disconnected:', details?.peerId); // eslint-disable-line no-console
            });
            engine.addEventListener('onChunkUploaded', () => {
              // Chunk-level logging is too noisy (25+ per segment). Track at segment level instead.
            });
            if (P2P_DEBUG) {
              engine.addEventListener('onSegmentLoaded', (details: any) => {
                if (P2P_DEBUG) console.log('[P2P Seed] Segment:', summarizeP2PSegment(details)); // eslint-disable-line no-console
              });
              engine.addEventListener('onSegmentError', (details: any) => {
                console.warn('[P2P Seed] Segment error:', details?.error?.message || details); // eslint-disable-line no-console
              });
              engine.addEventListener('onTrackerError', (details: any) => {
                console.warn('[P2P Seed] Tracker error:', details?.error?.message || details); // eslint-disable-line no-console
              });
            }
          } catch {} // eslint-disable-line no-empty
          const peerLogInterval = setInterval(() => {
            try {
              const core = engine.core;
              if (core && core.streams && P2P_DEBUG) {
                let totalPeers = 0;
                core.streams.forEach((stream: any) => {
                  if (stream.peers) totalPeers += stream.peers.size;
                });
                if (P2P_DEBUG) console.log(`[P2P Seed] Peers: ${connectedPeersRef.current.size}, Streams: ${core.streams.size}`); // eslint-disable-line no-console
              }
            } catch {} // eslint-disable-line no-empty
          }, 10000);
          hls.on(Hls.Events.DESTROYING, () => clearInterval(peerLogInterval));
        } else {
          console.warn('[P2P Seed] No p2pEngine on seeder HLS instance - mixin may not have worked'); // eslint-disable-line no-console
        }
      });

      hls.on(Hls.Events.ERROR, (_: any, data: any) => {
        if (destroyed) return;
        const errorSummary = {
          fatal: Boolean(data?.fatal),
          type: data?.type || null,
          details: data?.details || null,
          responseUrl: shortenP2PUrl(data?.response?.url || data?.url || null),
        };
        const isExpectedLivePlaylistGap =
          !data?.fatal && data?.type === Hls.ErrorTypes.NETWORK_ERROR && data?.details === 'levelEmptyError';
        const isExpectedHiddenLiveStall =
          !data?.fatal && data?.type === Hls.ErrorTypes.MEDIA_ERROR && data?.details === 'bufferStalledError';
        const isExpectedAudioTrackTimeout =
          !data?.fatal && data?.type === Hls.ErrorTypes.NETWORK_ERROR && data?.details === 'audioTrackLoadTimeOut';

        if (isExpectedLivePlaylistGap) {
          if (P2P_DEBUG) console.log('[P2P Seed] Live playlist not ready, retrying:', errorSummary); // eslint-disable-line no-console
        } else if (isExpectedHiddenLiveStall) {
          if (P2P_DEBUG) console.log('[P2P Seed] Seeder stalled briefly:', errorSummary); // eslint-disable-line no-console
        } else if (isExpectedAudioTrackTimeout) {
          if (P2P_DEBUG) console.log('[P2P Seed] Audio playlist timeout:', errorSummary); // eslint-disable-line no-console
        } else {
          console.warn('[P2P Seed] HLS error:', errorSummary); // eslint-disable-line no-console
        }
        if (data.fatal && data.type === Hls.ErrorTypes.NETWORK_ERROR && retryCount < MAX_RETRIES) {
          retryCount++;
          console.log(`[P2P Seed] Stream not ready, retrying in ${RETRY_DELAY_MS / 1000}s (${retryCount}/${MAX_RETRIES})...`); // eslint-disable-line no-console
          setTimeout(() => {
            if (!destroyed) {
              hls.loadSource(videoUrl);
            }
          }, RETRY_DELAY_MS);
          return;
        }
        if (data.fatal) {
          console.warn('[P2P Seed] Fatal error, giving up:', data.details); // eslint-disable-line no-console
        }
      });

      hls.on(Hls.Events.LEVEL_LOADED, (_: any, data: any) => {
        console.log('[P2P Seed] Playlist loaded:', {
          url: shortenP2PUrl(data?.details?.url || data?.url || null),
          fragments: data?.details?.fragments?.length ?? 0,
          live: Boolean(data?.details?.live),
          targetDuration: data?.details?.targetduration ?? null,
        }); // eslint-disable-line no-console
      });

      hls.loadSource(videoUrl);
    })();

    return () => {
      destroyed = true;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [active, swarmId, trackerUrl, videoUrl]);

  // Always render the hidden video element so the ref is available when the effect fires
  return (
    <video
      ref={videoRef}
      style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
      playsInline
      muted
    />
  );
}
