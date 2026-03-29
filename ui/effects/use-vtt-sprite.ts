import { useState, useEffect, useRef } from 'react';

const THUMB_WIDTH = 160;
const THUMB_HEIGHT = 90;
const INTERVAL_SECONDS = 5;
const COLUMNS = 10;
const UPDATE_EVERY_N_FRAMES = 5;

const storyboardCache = new Map<string, string>();

let blackFrameUrl: string | null = null;
function getBlackFrameUrl(): string {
  if (!blackFrameUrl) {
    const c = document.createElement('canvas');
    c.width = THUMB_WIDTH;
    c.height = THUMB_HEIGHT;
    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, THUMB_WIDTH, THUMB_HEIGHT);
    }
    blackFrameUrl = c.toDataURL('image/jpeg', 0.1);
  }
  return blackFrameUrl;
}

function buildBinarySplitOrder(count: number): number[] {
  if (count === 0) return [];
  const order: number[] = [0];
  const queue: [number, number][] = [[0, count - 1]];

  while (queue.length > 0) {
    const [lo, hi] = queue.shift();
    if (lo >= hi) continue;
    const mid = Math.floor((lo + hi) / 2);
    if (mid !== lo) {
      order.push(mid);
      queue.push([lo, mid - 1]);
      queue.push([mid + 1, hi]);
    } else {
      if (hi !== lo && !order.includes(hi)) order.push(hi);
    }
  }

  for (let i = 0; i < count; i++) {
    if (!order.includes(i)) order.push(i);
  }

  return order;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

export default function useVttSprite(
  sourceUrl: string | null | undefined,
  duration: number | null | undefined,
  hasNativeStoryboard: boolean
): string | null {
  const [vttUrl, setVttUrl] = useState<string | null>(null);
  const generatingRef = useRef(false);
  const blobUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!sourceUrl || !duration || duration < 10 || hasNativeStoryboard || generatingRef.current) {
      return;
    }

    const cached = storyboardCache.get(sourceUrl);
    if (cached) {
      setVttUrl(cached);
      return;
    }

    let canceled = false;
    generatingRef.current = true;

    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;

    const frameCount = Math.floor(duration / INTERVAL_SECONDS);
    const rows = Math.ceil(frameCount / COLUMNS);
    const canvas = document.createElement('canvas');
    canvas.width = COLUMNS * THUMB_WIDTH;
    canvas.height = rows * THUMB_HEIGHT;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      generatingRef.current = false;
      return;
    }

    const seekOrder = buildBinarySplitOrder(frameCount);
    const capturedFrames = new Set<number>();
    let orderIndex = 0;
    let capturedCount = 0;

    const black = getBlackFrameUrl();

    function findClosestCaptured(idx: number): number | null {
      if (capturedFrames.has(idx)) return idx;
      if (capturedFrames.size === 0) return null;
      let best: number | null = null;
      let bestDist = Infinity;
      for (const f of capturedFrames) {
        const dist = Math.abs(f - idx);
        if (dist < bestDist) {
          bestDist = dist;
          best = f;
        }
      }
      return best;
    }

    function spriteCoords(idx: number): string {
      const col = idx % COLUMNS;
      const row = Math.floor(idx / COLUMNS);
      return `${col * THUMB_WIDTH},${row * THUMB_HEIGHT},${THUMB_WIDTH},${THUMB_HEIGHT}`;
    }

    function emitVtt() {
      if (canceled) return;

      canvas.toBlob(
        (blob) => {
          if (canceled || !blob) return;

          const spriteUrl = URL.createObjectURL(blob);
          blobUrlsRef.current.push(spriteUrl);

          let vtt = 'WEBVTT\n\n';
          for (let i = 0; i < frameCount; i++) {
            const startTime = i * INTERVAL_SECONDS;
            const endTime = (i + 1) * INTERVAL_SECONDS;
            const closest = findClosestCaptured(i);
            if (closest !== null) {
              vtt += `${formatTime(startTime)} --> ${formatTime(endTime)}\n`;
              vtt += `${spriteUrl}#xywh=${spriteCoords(closest)}\n\n`;
            } else {
              vtt += `${formatTime(startTime)} --> ${formatTime(endTime)}\n`;
              vtt += `${black}#xywh=0,0,${THUMB_WIDTH},${THUMB_HEIGHT}\n\n`;
            }
          }

          const vttBlob = new Blob([vtt], { type: 'text/vtt' });
          const vttBlobUrl = URL.createObjectURL(vttBlob);
          blobUrlsRef.current.push(vttBlobUrl);

          if (!canceled) {
            setVttUrl(vttBlobUrl);
          }
        },
        'image/jpeg',
        0.7
      );
    }

    function captureFrame() {
      if (canceled || orderIndex > seekOrder.length) {
        emitVtt();
        finish();
        return;
      }

      const frameIdx = seekOrder[orderIndex - 1];
      const col = frameIdx % COLUMNS;
      const row = Math.floor(frameIdx / COLUMNS);
      ctx.drawImage(video, col * THUMB_WIDTH, row * THUMB_HEIGHT, THUMB_WIDTH, THUMB_HEIGHT);
      capturedFrames.add(frameIdx);
      capturedCount++;

      if (capturedCount % UPDATE_EVERY_N_FRAMES === 0) {
        emitVtt();
      }

      seekNext();
    }

    function seekNext() {
      if (canceled || orderIndex >= seekOrder.length) {
        emitVtt();
        finish();
        return;
      }
      const frameIdx = seekOrder[orderIndex];
      orderIndex++;
      video.currentTime = frameIdx * INTERVAL_SECONDS;
    }

    function finish() {
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
      video.src = '';
      video.load();
      generatingRef.current = false;
    }

    function onSeeked() {
      captureFrame();
    }

    function onError() {
      emitVtt();
      finish();
    }

    emitVtt();

    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', onError);
    video.addEventListener(
      'loadedmetadata',
      () => {
        if (!canceled) seekNext();
        else finish();
      },
      { once: true }
    );

    video.src = sourceUrl;

    return () => {
      canceled = true;
    };
  }, [sourceUrl, duration, hasNativeStoryboard]);

  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      blobUrlsRef.current = [];
    };
  }, []);

  return vttUrl;
}
