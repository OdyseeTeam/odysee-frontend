// @flow
import { useEffect, useRef } from 'react';
import Player from '../player';

export default function useWatchdog(isLivestream: boolean, onStall: () => void, timeoutMs: number = 15000) {
  const media = Player.useMedia();
  const watchdogRef = useRef(null);

  useEffect(() => {
    if (!isLivestream || !media) return;

    const stopWatchdog = () => {
      if (watchdogRef.current) {
        clearInterval(watchdogRef.current);
        watchdogRef.current = null;
      }
    };

    const resetWatchdog = () => {
      stopWatchdog();
      watchdogRef.current = setInterval(() => {
        if (onStall) onStall();
      }, timeoutMs);
    };

    const handleWaiting = () => resetWatchdog();
    const handleTimeUpdate = () => stopWatchdog();

    media.addEventListener('waiting', handleWaiting);
    media.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      stopWatchdog();
      media.removeEventListener('waiting', handleWaiting);
      media.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [isLivestream, media, onStall, timeoutMs]);
}
