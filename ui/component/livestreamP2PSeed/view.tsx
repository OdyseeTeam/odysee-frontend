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
    if (!active || !videoUrl || !Hls.isSupported()) return;

    const video = videoRef.current;
    if (!video) return;

    let destroyed = false;

    (async () => {
      let HlsConstructor: typeof Hls = Hls;
      try {
        const { HlsJsP2PEngine } = await import('p2p-media-loader-hlsjs');
        if (destroyed) return;
        // injectMixin modifies the class in place
        HlsJsP2PEngine.injectMixin(Hls);
        HlsConstructor = Hls;
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
      hls.loadSource(videoUrl);
      hlsRef.current = hls;

      video.muted = true;
      video.volume = 0;
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
    })();

    return () => {
      destroyed = true;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [active, videoUrl]);

  if (!active || !videoUrl) return null;

  // Hidden video element - no visible UI
  return (
    <video
      ref={videoRef}
      style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
      playsInline
      muted
    />
  );
}
