import React from 'react';
import Hls from 'hls.js';
import { getLivestreamTurnServer } from 'constants/livestream';

const P2P_ANNOUNCE_TRACKERS = ['wss://tracker.novage.com.ua:443', 'wss://tracker.openwebtorrent.com:443'];
const P2P_LIVE_HIGH_DEMAND_WINDOW = 3;

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

function getP2PAnnounceTrackers(trackerUrl?: string | null) {
  return trackerUrl ? [trackerUrl] : P2P_ANNOUNCE_TRACKERS;
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
    console.log('[P2P Seed] Effect:', { active, videoUrl: videoUrl?.slice(-40), hlsSupported: Hls.isSupported() }); // eslint-disable-line no-console
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
        HlsConstructor = HlsJsP2PEngine.injectMixin(Hls) as typeof Hls;
        console.log('[P2P Seed] Streamer seeding enabled for:', videoUrl); // eslint-disable-line no-console
      } catch (e) {
        console.warn('[P2P Seed] Failed to load p2p-media-loader, seeding disabled:', e); // eslint-disable-line no-console
        return;
      }

      if (destroyed) return;
      const p2pIceServers = getP2PIceServers();
      const announceTrackers = getP2PAnnounceTrackers(trackerUrl);

      const hls = new HlsConstructor({
        backBufferLength: 10,
        maxBufferLength: 15,
        maxMaxBufferLength: 30,
        liveSyncDuration: 4,
        liveMaxLatencyDuration: Infinity,
        p2p: {
          core: {
            announceTrackers,
            highDemandTimeWindow: P2P_LIVE_HIGH_DEMAND_WINDOW,
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
        console.log('[P2P Seed] Manifest loaded, seeding active:', {
          requestedUrl: shortenP2PUrl(videoUrl),
          trackers: announceTrackers,
          swarmId: swarmId || null,
          highDemandTimeWindow: P2P_LIVE_HIGH_DEMAND_WINDOW,
          iceServers: p2pIceServers.map((server) => server.urls),
          manifestResponseUrl: shortenP2PUrl(hls.p2pEngine?.core?.manifestResponseUrl || null),
          streamSummaries: hls.p2pEngine?.core?.streams ? summarizeP2PStreams(hls.p2pEngine.core.streams) : [],
        }); // eslint-disable-line no-console
        video.play().catch(() => {});

        // Check if P2P engine is actually running
        if (hls.p2pEngine) {
          console.log('[P2P Seed] P2P engine active on seeder'); // eslint-disable-line no-console
          const engine = hls.p2pEngine;
          try {
            engine.addEventListener('onSegmentStart', (details: any) => {
              console.log('[P2P Seed] Segment start:', summarizeP2PSegment(details)); // eslint-disable-line no-console
            });
            engine.addEventListener('onSegmentLoaded', (details: any) => {
              console.log('[P2P Seed] Segment loaded:', {
                ...summarizeP2PSegment(details),
                connectedPeers: connectedPeersRef.current.size,
                connectedPeerIds: Array.from(connectedPeersRef.current),
              }); // eslint-disable-line no-console
            });
            engine.addEventListener('onSegmentAbort', (details: any) => {
              console.warn('[P2P Seed] Segment aborted:', summarizeP2PSegment(details)); // eslint-disable-line no-console
            });
            engine.addEventListener('onSegmentError', (details: any) => {
              console.warn('[P2P Seed] Segment error:', {
                ...summarizeP2PSegment(details),
                error: details?.error?.type || details?.error?.message || details?.error || null,
              }); // eslint-disable-line no-console
            });
            engine.addEventListener('onTrackerWarning', (details: any) => {
              console.warn('[P2P Seed] Tracker warning:', {
                streamType: details?.streamType || null,
                warning: serializeP2PError(details?.warning),
              }); // eslint-disable-line no-console
            });
            engine.addEventListener('onTrackerError', (details: any) => {
              console.warn('[P2P Seed] Tracker error:', {
                streamType: details?.streamType || null,
                error: serializeP2PError(details?.error),
              }); // eslint-disable-line no-console
            });
            engine.addEventListener('onPeerConnect', (details: any) => {
              if (details?.peerId) connectedPeersRef.current.add(details.peerId);
              console.log('[P2P Seed] Peer connected:', details); // eslint-disable-line no-console
            });
            engine.addEventListener('onPeerClose', (details: any) => {
              if (details?.peerId) connectedPeersRef.current.delete(details.peerId);
              console.warn('[P2P Seed] Peer closed:', details); // eslint-disable-line no-console
            });
            engine.addEventListener('onPeerError', (details: any) => {
              console.warn('[P2P Seed] Peer error:', {
                peerId: details?.peerId || null,
                error: serializeP2PError(details?.error),
              }); // eslint-disable-line no-console
            });
            engine.addEventListener('onChunkDownloaded', (bytesLength: any, downloadSource: any, peerId: any) => {
              if (downloadSource === 'http' && !peerId) return;
              console.log('[P2P Seed] Chunk downloaded:', {
                bytesLength,
                downloadSource,
                peerId: peerId || null,
              }); // eslint-disable-line no-console
            });
            engine.addEventListener('onChunkUploaded', (bytesLength: any, peerId: any) => {
              console.log('[P2P Seed] Chunk uploaded:', {
                bytesLength,
                peerId: peerId || null,
              }); // eslint-disable-line no-console
            });
          } catch (e) {
            console.warn('[P2P Seed] Failed to attach event listeners:', e); // eslint-disable-line no-console
          }
          // Log tracker/peer status periodically
          const peerLogInterval = setInterval(() => {
            try {
              const core = engine.core;
              if (core && core.streams) {
                let totalPeers = 0;
                core.streams.forEach((stream: any) => {
                  if (stream.peers) totalPeers += stream.peers.size;
                });
                console.log('[P2P Seed] Swarm snapshot:', {
                  peers: connectedPeersRef.current.size,
                  trackedPeers: totalPeers,
                  streams: core.streams.size,
                  manifestResponseUrl: shortenP2PUrl(core.manifestResponseUrl || null),
                  streamSummaries: summarizeP2PStreams(core.streams),
                  connectedPeerIds: Array.from(connectedPeersRef.current),
                }); // eslint-disable-line no-console
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

        if (isExpectedLivePlaylistGap) {
          console.log('[P2P Seed] Live playlist not populated yet, retrying:', errorSummary); // eslint-disable-line no-console
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
