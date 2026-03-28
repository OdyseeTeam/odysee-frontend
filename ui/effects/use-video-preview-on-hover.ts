import React from 'react';

const PREVIEW_POSITIONS = [0.15, 0.35, 0.55, 0.75, 0.9];
const FRAME_CYCLE_MS = 800;

/**
 * On hover, loads a video element with the streaming URL, seeks through
 * several positions, captures frames as data URLs, and cycles through them.
 * Returns the current frame URL to display.
 */
export default function useVideoPreviewOnHover(
  streamingUrl: string | null | undefined,
  duration: number | null | undefined,
  enabled: boolean
): string | null {
  const [frameUrl, setFrameUrl] = React.useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const framesRef = React.useRef<string[]>([]);
  const cycleTimerRef = React.useRef<number | null>(null);
  const extractingRef = React.useRef(false);

  // Extract frames on first hover
  React.useEffect(() => {
    if (!enabled || !streamingUrl || !duration || duration < 3) {
      // Stop cycling if disabled
      if (cycleTimerRef.current) {
        clearInterval(cycleTimerRef.current);
        cycleTimerRef.current = null;
      }
      setFrameUrl(null);
      return;
    }

    // If frames already extracted, just start cycling
    if (framesRef.current.length > 0) {
      startCycling();
      return () => stopCycling();
    }

    // Don't re-extract if already extracting
    if (extractingRef.current) return;
    extractingRef.current = true;

    let canceled = false;
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    videoRef.current = video;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const extractedFrames: string[] = [];
    let posIndex = 0;

    function captureFrame() {
      if (!ctx || canceled) return;
      canvas.width = Math.min(video.videoWidth, 320);
      canvas.height = Math.round(canvas.width * (video.videoHeight / video.videoWidth));
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      try {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        if (dataUrl && dataUrl.length > 100) {
          extractedFrames.push(dataUrl);
          // Show first frame immediately
          if (extractedFrames.length === 1 && !canceled) {
            setFrameUrl(dataUrl);
          }
        }
      } catch {
        // CORS or tainted canvas — abort gracefully
      }
    }

    function seekNext() {
      if (canceled || posIndex >= PREVIEW_POSITIONS.length) {
        finish();
        return;
      }
      video.currentTime = duration * PREVIEW_POSITIONS[posIndex];
      posIndex++;
    }

    function finish() {
      extractingRef.current = false;
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
      video.src = '';
      video.load();
      videoRef.current = null;

      if (canceled) return;
      framesRef.current = extractedFrames;
      if (extractedFrames.length > 0) {
        startCycling();
      }
    }

    function onSeeked() {
      captureFrame();
      seekNext();
    }

    function onError() {
      extractingRef.current = false;
      video.src = '';
      videoRef.current = null;
    }

    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', onError);

    video.addEventListener(
      'loadedmetadata',
      () => {
        if (!canceled) seekNext();
      },
      { once: true }
    );

    video.src = streamingUrl;

    return () => {
      canceled = true;
      stopCycling();
      extractingRef.current = false;
      if (videoRef.current) {
        videoRef.current.removeEventListener('seeked', onSeeked);
        videoRef.current.removeEventListener('error', onError);
        videoRef.current.src = '';
        videoRef.current = null;
      }
    };
  }, [enabled, streamingUrl, duration]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      stopCycling();
      framesRef.current = [];
    };
  }, []);

  return frameUrl;
}
