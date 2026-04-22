import { useEffect, useRef, useCallback } from 'react';
import { HLS_EVENT_ERROR, HLS_ERROR_TYPE_MEDIA, HLS_ERROR_TYPE_NETWORK } from '../hls';
import Player from '../player';
import type { MediaWithHls } from '../types';

const BACKOFF_DELAYS = [250, 1000, 5000, 15000];
const MAX_ATTEMPTS = 4;

export default function useErrorRecovery(resolvedSrc, setReload, setTapToRetryVisible) {
  const media = Player.useMedia() as MediaWithHls | null;
  const attemptsRef = useRef(0);
  const lastTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!media || !resolvedSrc) return;

    attemptsRef.current = 0;

    const resetAttempts = () => {
      setTimeout(() => {
        if (media.currentTime > lastTimeRef.current) {
          attemptsRef.current = 0;
        }
      }, 500);
    };

    const attemptRecovery = (errorType) => {
      if (attemptsRef.current >= MAX_ATTEMPTS) {
        setTapToRetryVisible(true);
        return;
      }

      attemptsRef.current++;
      const delay = BACKOFF_DELAYS[attemptsRef.current - 1] || BACKOFF_DELAYS[BACKOFF_DELAYS.length - 1];

      clearTimer();
      timerRef.current = setTimeout(() => {
        const hls = media._hls;

        if (hls) {
          if (errorType === 'networkError') {
            hls.startLoad();
            media.play()?.catch(() => {});
          } else if (errorType === 'mediaError') {
            hls.recoverMediaError();
            media.play()?.catch(() => {});
          } else {
            lastTimeRef.current = media.currentTime || 0;
            setReload(Date.now());
            setTimeout(() => media.play()?.catch(() => {}), 500);
          }
        } else {
          lastTimeRef.current = media.currentTime || 0;
          setReload(Date.now());
          setTimeout(() => media.play()?.catch(() => {}), 500);
        }
      }, delay);
    };

    const onMediaError = () => {
      if (media._hls) return;
      const error = media.error;
      if (!error) return;

      if (error.code === 2 || error.code === 3) {
        attemptRecovery(null);
      } else {
        setTapToRetryVisible(true);
      }
    };

    const onHlsError = (event, data) => {
      if (!data.fatal) return;

      if (data.type === HLS_ERROR_TYPE_NETWORK) {
        attemptRecovery('networkError');
      } else if (data.type === HLS_ERROR_TYPE_MEDIA) {
        attemptRecovery('mediaError');
      } else {
        attemptRecovery(null);
      }
    };

    let hlsAttached = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const attachHlsHandler = () => {
      const hls = media._hls;
      if (hls && !hlsAttached) {
        hlsAttached = true;
        hls.on(HLS_EVENT_ERROR as any, onHlsError);
        if (pollTimer) {
          clearInterval(pollTimer);
          pollTimer = null;
        }
      }
    };

    attachHlsHandler();
    if (!hlsAttached) {
      pollTimer = setInterval(attachHlsHandler, 200);
    }

    media.addEventListener('error', onMediaError);
    media.addEventListener('playing', resetAttempts);

    return () => {
      clearTimer();
      if (pollTimer) clearInterval(pollTimer);
      media.removeEventListener('error', onMediaError);
      media.removeEventListener('playing', resetAttempts);
      const hls = media._hls;
      if (hls) {
        hls.off(HLS_EVENT_ERROR as any, onHlsError);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media, resolvedSrc, setReload, setTapToRetryVisible, clearTimer]);
}
