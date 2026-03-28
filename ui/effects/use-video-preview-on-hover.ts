import React from 'react';
import Lbry from 'lbry';

const PREVIEW_POSITIONS = [0.08, 0.18, 0.28, 0.38, 0.48, 0.58, 0.68, 0.78, 0.88, 0.95];
const FRAME_CYCLE_MS = 1000;

const streamingUrlCache = new Map<string, string>();

type PreviewFrames = { current: string | null; previous: string | null; frameIndex: number };

export default function useVideoPreviewOnHover(
  streamingUrl: string | null | undefined,
  uri: string | null | undefined,
  duration: number | null | undefined,
  enabled: boolean
): PreviewFrames {
  const [frameUrl, setFrameUrl] = React.useState<string | null>(null);
  const [prevFrameUrl, setPrevFrameUrl] = React.useState<string | null>(null);
  const [frameIndex, setFrameIndex] = React.useState(0);
  const framesRef = React.useRef<string[]>([]);
  const cycleTimerRef = React.useRef<number | null>(null);
  const extractingRef = React.useRef(false);
  const resolvedUrlRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!enabled || !duration || duration < 3) {
      stopCycling();
      return;
    }

    if (framesRef.current.length > 0) {
      setFrameUrl(framesRef.current[0]);
      startCycling();
      return () => stopCycling();
    }

    if (extractingRef.current) return;

    let canceled = false;

    async function resolveAndExtract() {
      let url = streamingUrl || resolvedUrlRef.current;

      if (!url && uri) {
        const cached = streamingUrlCache.get(uri);
        if (cached) {
          url = cached;
        } else {
          try {
            const response = await Lbry.get({ uri });
            if (canceled) return;
            url = response?.streaming_url;
            if (url) {
              streamingUrlCache.set(uri, url);
              resolvedUrlRef.current = url;
            }
          } catch {
            return;
          }
        }
      }

      if (!url || canceled) return;
      extractingRef.current = true;
      await extractFrames(url, duration, () => canceled);
      extractingRef.current = false;
    }

    resolveAndExtract();
    return () => {
      stopCycling();
    };
  }, [enabled, streamingUrl, uri, duration]); // eslint-disable-line react-hooks/exhaustive-deps

  async function extractFrames(url: string, dur: number, isCanceled: () => boolean) {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    await new Promise<void>((resolve) => {
      let posIndex = 0;

      function captureFrame() {
        if (isCanceled()) {
          finish();
          return;
        }
        canvas.width = Math.min(video.videoWidth, 480);
        canvas.height = Math.round(canvas.width * (video.videoHeight / video.videoWidth));
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        try {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          if (dataUrl && dataUrl.length > 100) {
            framesRef.current.push(dataUrl);

            if (framesRef.current.length === 1) {
              setFrameUrl(dataUrl);
            } else if (framesRef.current.length === 2) {
              startCycling();
            }
          }
        } catch {
          // CORS / tainted canvas
        }
      }

      function seekNext() {
        if (isCanceled() || posIndex >= PREVIEW_POSITIONS.length) {
          finish();
          return;
        }
        video.currentTime = dur * PREVIEW_POSITIONS[posIndex];
        posIndex++;
      }

      function finish() {
        video.removeEventListener('seeked', onSeeked);
        video.removeEventListener('error', onError);
        video.src = '';
        video.load();
        resolve();
      }

      function onSeeked() {
        captureFrame();
        seekNext();
      }

      function onError() {
        finish();
      }

      video.addEventListener('seeked', onSeeked);
      video.addEventListener('error', onError);
      video.addEventListener(
        'loadedmetadata',
        () => {
          if (!isCanceled()) seekNext();
          else finish();
        },
        { once: true }
      );

      video.src = url;
    });
  }

  function startCycling() {
    if (cycleTimerRef.current) return;
    let idx = 0;
    cycleTimerRef.current = window.setInterval(() => {
      if (framesRef.current.length === 0) return;
      const prevIdx = idx;
      idx = (idx + 1) % framesRef.current.length;
      setPrevFrameUrl(framesRef.current[prevIdx]);
      setFrameUrl(framesRef.current[idx]);
      setFrameIndex(idx);
    }, FRAME_CYCLE_MS);
  }

  function stopCycling() {
    if (cycleTimerRef.current) {
      clearInterval(cycleTimerRef.current);
      cycleTimerRef.current = null;
    }
  }

  React.useEffect(() => {
    return () => {
      stopCycling();
      framesRef.current = [];
    };
  }, []);

  return { current: frameUrl, previous: prevFrameUrl, frameIndex };
}
