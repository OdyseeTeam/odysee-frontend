import React from 'react';
import Lbry from 'lbry';
import { loadHlsConstructor, HLS_EVENT_MANIFEST_PARSED } from 'component/viewers/videoViewer/internal/hls';

const manifestCache = new Map<string, { manifestUrl: string; basePath: string } | null>();
const streamingUrlCache = new Map<string, string>();
let activePreviewUri: string | null = null;

function resolveStreamingUrl(streamingUrl: string | null | undefined, uri: string): Promise<string | null> {
  if (streamingUrl) return Promise.resolve(streamingUrl);

  const cached = streamingUrlCache.get(uri);
  if (cached) return Promise.resolve(cached);

  return Lbry.get({ uri })
    .then((response: any) => {
      const url = response?.streaming_url;
      if (url) {
        streamingUrlCache.set(uri, url);
        return url;
      }
      return null;
    })
    .catch(() => null);
}

function resolveManifestUrl(streamingUrl: string): Promise<{ manifestUrl: string; basePath: string } | null> {
  if (manifestCache.has(streamingUrl)) {
    return Promise.resolve(manifestCache.get(streamingUrl) ?? null);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  return fetch(streamingUrl, {
    method: 'HEAD',
    cache: 'no-store',
    signal: controller.signal,
  })
    .then((response) => {
      clearTimeout(timeout);

      const finalUrl = new URL(response.url);
      finalUrl.hash = '';
      finalUrl.search = '';

      if (response.redirected && finalUrl.toString().endsWith('m3u8')) {
        const result = {
          manifestUrl: response.url,
          basePath: response.url.substring(0, response.url.lastIndexOf('/')),
        };
        manifestCache.set(streamingUrl, result);
        return result;
      }
      manifestCache.set(streamingUrl, null);
      return null;
    })
    .catch(() => {
      clearTimeout(timeout);
      manifestCache.set(streamingUrl, null);
      return null;
    });
}

export default function useHlsVideoPreview(
  streamingUrl: string | null | undefined,
  uri: string | null | undefined,
  enabled: boolean
): {
  videoRef: React.RefObject<HTMLVideoElement>;
  isReady: boolean;
  isHlsAvailable: boolean | null;
} {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const hlsRef = React.useRef<any>(null);
  const [isReady, setIsReady] = React.useState(false);
  const [isHlsAvailable, setIsHlsAvailable] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    if (!enabled || (!streamingUrl && !uri)) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      setIsReady(false);
      if (activePreviewUri === uri) {
        activePreviewUri = null;
      }
      return;
    }

    let canceled = false;
    activePreviewUri = uri;

    resolveStreamingUrl(streamingUrl, uri).then((resolvedUrl) => {
      if (canceled || !resolvedUrl || activePreviewUri !== uri) return;

      return Promise.all([resolveManifestUrl(resolvedUrl), loadHlsConstructor()]).then(([manifest, Hls]) => {
        if (canceled || activePreviewUri !== uri) return;

        if (!manifest) {
          setIsHlsAvailable(false);
          return;
        }

        setIsHlsAvailable(true);

        if (!videoRef.current || !Hls.isSupported()) return;

        const hls = new Hls({
          maxBufferLength: 5,
          maxMaxBufferLength: 10,
          startLevel: 0,
          startPosition: 1,
          capLevelToPlayerSize: false,
          enableWorker: false,
        });

        hlsRef.current = hls;

        hls.on(HLS_EVENT_MANIFEST_PARSED, () => {
          if (canceled || activePreviewUri !== uri) {
            hls.destroy();
            return;
          }

          const levels = hls.levels;
          if (levels && levels.length > 0) {
            const TARGET_HEIGHT = 480;
            let bestIdx = 0;
            let bestDiff = Math.abs(levels[0].height - TARGET_HEIGHT);
            for (let i = 1; i < levels.length; i++) {
              const diff = Math.abs(levels[i].height - TARGET_HEIGHT);
              if (diff < bestDiff) {
                bestDiff = diff;
                bestIdx = i;
              }
            }
            hls.currentLevel = bestIdx;
            hls.nextLevel = bestIdx;
          }

          if (videoRef.current) {
            videoRef.current.play().catch(() => {});
            setIsReady(true);
          }
        });

        hls.loadSource(manifest.manifestUrl);
        hls.attachMedia(videoRef.current);
      });
    });

    return () => {
      canceled = true;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      setIsReady(false);
      if (activePreviewUri === uri) {
        activePreviewUri = null;
      }
    };
  }, [enabled, streamingUrl, uri]);

  return { videoRef, isReady, isHlsAvailable };
}
