import React from 'react';
import Hls from 'hls.js';

type Props = {
  /** The HLS video URL of the streamer's own livestream */
  videoUrl: string;
  /** Whether seeding is active */
  active: boolean;
};

/**
 * Hidden HLS player with P2P enabled that makes the streamer a seed node.
 * Downloads their own stream segments via HLS and shares them with P2P viewers
 * via WebRTC data channels (p2p-media-loader).
 *
 * No visible UI - runs entirely in the background.
 */
export default function LivestreamP2PSeed({ videoUrl, active }: Props) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const hlsRef = React.useRef<Hls | null>(null);

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

      const hls = new HlsConstructor({
        backBufferLength: 10,
        maxBufferLength: 15,
        maxMaxBufferLength: 30,
        liveSyncDuration: 4,
        liveMaxLatencyDuration: Infinity,
        p2p: {
          core: {
            announceTrackers: [
              'wss://tracker.novage.com.ua',
              'wss://tracker.webtorrent.dev',
            ],
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
        console.log('[P2P Seed] Manifest loaded, seeding active'); // eslint-disable-line no-console
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_: any, data: any) => {
        if (destroyed) return;
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

      hls.loadSource(videoUrl);
    })();

    return () => {
      destroyed = true;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [active, videoUrl]);

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
