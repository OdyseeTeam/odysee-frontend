import React from 'react';
import Lbry from 'lbry';

const PREVIEW_POSITIONS = [0.15, 0.35, 0.55, 0.75, 0.9];
const FRAME_CYCLE_MS = 800;

// Cache resolved streaming URLs so we don't re-fetch on re-hover
const streamingUrlCache = new Map<string, string>();

/**
 * On hover, resolves the streaming URL (via Lbry.get if needed), loads a
 * hidden <video> element, seeks through several positions, captures frames
 * as data URLs, and cycles through them. Zero network calls until hover.
 */
export default function useVideoPreviewOnHover(
  streamingUrl: string | null | undefined,
  uri: string | null | undefined,
  duration: number | null | undefined,
  enabled: boolean
): string | null {
  const [frameUrl, setFrameUrl] = React.useState<string | null>(null);
  const framesRef = React.useRef<string[]>([]);
  const cycleTimerRef = React.useRef<number | null>(null);
  const extractingRef = React.useRef(false);
  const resolvedUrlRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!enabled || !duration || duration < 3) {
      stopCycling();
      setFrameUrl(null);
      return;
    }

    // If frames already extracted, just start cycling
    if (framesRef.current.length > 0) {
      startCycling();
      return () => stopCycling();
    }

    if (extractingRef.current) return;

    let canceled = false;

    async function resolveAndExtract() {
      // Resolve streaming URL
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
            return; // silently fail
          }
        }
      }

      if (!url || canceled) return;
      extractingRef.current = true;
      await extractFrames(url, duration, canceled, () => canceled);
      extractingRef.current = false;

      if (!canceled && framesRef.current.length > 0) {
        startCycling();
      }
    }

    resolveAndExtract();
    return () => {
      canceled = true;
      stopCycling();
    };
  }, [enabled, streamingUrl, uri, duration]); // eslint-disable-line react-hooks/exhaustive-deps

  async function extractFrames(url: string, dur: number, wasCanceled: boolean, isCanceled: () => boolean) {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const extracted: string[] = [];

    await new Promise<void>((resolve) => {
      let posIndex = 0;

      function captureFrame() {
        if (isCanceled()) {
          resolve();
          return;
        }
        canvas.width = Math.min(video.videoWidth, 320);
        canvas.height = Math.round(canvas.width * (video.videoHeight / video.videoWidth));
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        try {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
          if (dataUrl && dataUrl.length > 100) {
            extracted.push(dataUrl);
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
        framesRef.current = extracted;
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
    setFrameUrl(framesRef.current[0] || null);
    cycleTimerRef.current = window.setInterval(() => {
      idx = (idx + 1) % framesRef.current.length;
      setFrameUrl(framesRef.current[idx]);
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

  return frameUrl;
}
