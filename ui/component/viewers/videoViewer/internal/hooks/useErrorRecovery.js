// @flow
import { useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import Player from '../player';

const BACKOFF_DELAYS = [250, 1000, 5000, 15000];
const MAX_ATTEMPTS = 4;

export default function useErrorRecovery(
  resolvedSrc: ?string,
  setReload: (number) => void,
  setTapToRetryVisible: (boolean) => void
) {
  const media = Player.useMedia();
  const attemptsRef = useRef(0);
  const lastTimeRef = useRef(0);
  const timerRef = useRef(null);

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

    const attemptRecovery = (errorType: ?string) => {
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
          } else if (errorType === 'mediaError') {
            hls.recoverMediaError();
          } else {
            lastTimeRef.current = media.currentTime || 0;
            setReload(Date.now());
          }
        } else {
          lastTimeRef.current = media.currentTime || 0;
          setReload(Date.now());
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

    const onHlsError = (event: any, data: any) => {
      if (!data.fatal) return;

      if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
        attemptRecovery('networkError');
      } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
        attemptRecovery('mediaError');
      } else {
        attemptRecovery(null);
      }
    };

    const attachHlsHandler = () => {
      const checkHls = () => {
        const hls = media._hls;
        if (hls) {
          hls.on(Hls.Events.ERROR, onHlsError);
        }
      };
      if (media._hls) {
        checkHls();
      } else {
        setTimeout(checkHls, 100);
      }
    };

    media.addEventListener('error', onMediaError);
    media.addEventListener('playing', resetAttempts);
    attachHlsHandler();

    return () => {
      clearTimer();
      media.removeEventListener('error', onMediaError);
      media.removeEventListener('playing', resetAttempts);
      const hls = media._hls;
      if (hls) {
        hls.off(Hls.Events.ERROR, onHlsError);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media, resolvedSrc, setReload, setTapToRetryVisible, clearTimer]);
}
