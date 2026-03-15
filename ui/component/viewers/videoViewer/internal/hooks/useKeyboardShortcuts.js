// @flow
import { useEffect, useRef, useCallback } from 'react';
import * as KEYCODES from 'constants/keycodes';
import { VIDEO_PLAYBACK_RATES } from 'constants/player';
import isUserTyping from 'util/detect-typing';
import Player from '../player';

const SEEK_STEP = 10;
const VOLUME_STEP = 0.05;
const VOLUME_STEP_FINE = 0.01;
const FAST_SPEED = 2;
const HOLD_SPEED_DELAY_MS = 300;

export default function useKeyboardShortcuts({
  containerRef,
  isMobile,
  isLivestreamClaim,
  toggleVideoTheaterMode,
  playNext,
  playPrevious,
}: {
  containerRef: any,
  isMobile: boolean,
  isLivestreamClaim: boolean,
  toggleVideoTheaterMode: () => void,
  playNext: () => void,
  playPrevious: () => void,
}) {
  const store = Player.usePlayer();
  const media = Player.useMedia();

  const holdingRef = useRef(false);
  const spacePressedRef = useRef(false);
  const lastSpeedRef = useRef(1.0);
  const holdTimeoutRef = useRef(null);
  const pendingToggleRef = useRef(false);

  const getState = useCallback(() => store.state, [store]);

  useEffect(() => {
    if (!media) return;

    function volumeUp(e, amount = VOLUME_STEP) {
      e.preventDefault();
      const s = getState();
      s.setVolume(Math.min(1, s.volume + amount));
    }

    function volumeDown(e, amount = VOLUME_STEP) {
      e.preventDefault();
      const s = getState();
      s.setVolume(Math.max(0, s.volume - amount));
    }

    function seekVideo(stepSize, jumpTo) {
      const s = getState();
      const duration = s.duration;
      const currentTime = s.currentTime;
      if (isNaN(duration) || isNaN(currentTime)) return;

      const newTime = jumpTo ? duration * stepSize : currentTime + stepSize;
      s.seek(Math.max(0, Math.min(duration, newTime)));
    }

    function toggleFullscreen() {
      const target = document.querySelector('.player-fullscreen-target');
      // $FlowFixMe
      if (document.fullscreenElement) {
        // $FlowFixMe
        document.exitFullscreen();
      } else if (target) {
        // $FlowFixMe
        target.requestFullscreen();
      }
    }

    function toggleMute() {
      getState().toggleMuted();
    }

    function togglePlay(forcePlay = false) {
      const s = getState();
      if (s.paused || forcePlay) {
        s.play();
      } else {
        s.pause();
      }
    }

    function changePlaybackSpeed(shouldSpeedUp, newRate = -1) {
      const s = getState();
      let rate;
      if (newRate !== -1) {
        rate = newRate;
        lastSpeedRef.current = s.playbackRate;
      } else {
        rate = s.playbackRate;
      }

      let rateIndex = VIDEO_PLAYBACK_RATES.findIndex((x) => x === rate);
      if (rateIndex >= 0) {
        if (newRate === -1) {
          rateIndex = shouldSpeedUp
            ? Math.min(rateIndex + 1, VIDEO_PLAYBACK_RATES.length - 1)
            : Math.max(rateIndex - 1, 0);
        }
        s.setPlaybackRate(VIDEO_PLAYBACK_RATES[rateIndex]);
      }
    }

    function restorePlaybackRate() {
      const s = getState();
      const shouldSpeedUp = lastSpeedRef.current > s.playbackRate;
      changePlaybackSpeed(shouldSpeedUp, lastSpeedRef.current);
    }

    function clearHoldTimeout() {
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current);
        holdTimeoutRef.current = null;
      }
    }

    function handleKeyDown(e) {
      if (isUserTyping()) return;

      // Shift key combos
      if (e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey) {
        if (e.keyCode === KEYCODES.PERIOD) changePlaybackSpeed(true);
        if (e.keyCode === KEYCODES.COMMA) changePlaybackSpeed(false);
        if (e.keyCode === KEYCODES.N) playNext();
        if (e.keyCode === KEYCODES.P) playPrevious();
        if (e.keyCode === KEYCODES.SLASH) window.dispatchEvent(new CustomEvent('toggleShortcuts'));
        return;
      }

      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;

      // Space/K - play/pause with hold-to-speed
      if (e.keyCode === KEYCODES.SPACEBAR || e.keyCode === KEYCODES.K) {
        e.preventDefault();
        if (spacePressedRef.current) return;

        spacePressedRef.current = true;
        clearHoldTimeout();

        const wasPaused = getState().paused;
        pendingToggleRef.current = !wasPaused;
        if (wasPaused) togglePlay(true);

        holdTimeoutRef.current = setTimeout(() => {
          if (!spacePressedRef.current) return;
          holdingRef.current = true;
          pendingToggleRef.current = false;
          togglePlay(true);
          changePlaybackSpeed(true, FAST_SPEED);
        }, HOLD_SPEED_DELAY_MS);
      }

      if (e.keyCode === KEYCODES.F) toggleFullscreen();
      if (e.keyCode === KEYCODES.M) toggleMute();
      if (e.keyCode === KEYCODES.UP) volumeUp(e);
      if (e.keyCode === KEYCODES.DOWN) volumeDown(e);
      if (e.keyCode === KEYCODES.T && !isMobile) {
        toggleVideoTheaterMode();
        const s = getState();
        if (s.fullscreen) s.exitFullscreen();
      }
      if (e.keyCode === KEYCODES.L) {
        seekVideo(SEEK_STEP);
        window.dispatchEvent(new CustomEvent('odysee-seek', { detail: { amount: SEEK_STEP } }));
      }
      if (e.keyCode === KEYCODES.J) {
        seekVideo(-SEEK_STEP);
        window.dispatchEvent(new CustomEvent('odysee-seek', { detail: { amount: -SEEK_STEP } }));
      }
      if (e.keyCode === KEYCODES.RIGHT) {
        seekVideo(SEEK_STEP);
        window.dispatchEvent(new CustomEvent('odysee-seek', { detail: { amount: SEEK_STEP } }));
      }
      if (e.keyCode === KEYCODES.LEFT) {
        seekVideo(-SEEK_STEP);
        window.dispatchEvent(new CustomEvent('odysee-seek', { detail: { amount: -SEEK_STEP } }));
      }
      if (e.keyCode === KEYCODES.ZERO) seekVideo(0, true);
      if (e.keyCode === KEYCODES.ONE) seekVideo(10 / 100, true);
      if (e.keyCode === KEYCODES.TWO) seekVideo(20 / 100, true);
      if (e.keyCode === KEYCODES.THREE) seekVideo(30 / 100, true);
      if (e.keyCode === KEYCODES.FOUR) seekVideo(40 / 100, true);
      if (e.keyCode === KEYCODES.FIVE) seekVideo(50 / 100, true);
      if (e.keyCode === KEYCODES.SIX) seekVideo(60 / 100, true);
      if (e.keyCode === KEYCODES.SEVEN) seekVideo(70 / 100, true);
      if (e.keyCode === KEYCODES.EIGHT) seekVideo(80 / 100, true);
      if (e.keyCode === KEYCODES.NINE) seekVideo(90 / 100, true);

      // Frame stepping when paused
      if (e.keyCode === KEYCODES.COMMA && window.videoFps && getState().paused) {
        media.currentTime = media.currentTime - 1 / window.videoFps;
      }
      if (e.keyCode === KEYCODES.PERIOD && window.videoFps && getState().paused) {
        media.currentTime = media.currentTime + 1 / window.videoFps;
      }
    }

    function handleKeyUp(e) {
      if (isUserTyping()) return;

      if (e.keyCode === KEYCODES.SPACEBAR || e.keyCode === KEYCODES.K) {
        e.preventDefault();
        clearHoldTimeout();
        if (holdingRef.current) {
          restorePlaybackRate();
        } else if (pendingToggleRef.current) {
          togglePlay();
        }
        spacePressedRef.current = false;
        holdingRef.current = false;
        pendingToggleRef.current = false;
      }
    }

    function handleBlur(e) {
      if (e.type === 'visibilitychange' && !document.hidden) return;
      clearHoldTimeout();
      if (holdingRef.current) restorePlaybackRate();
      spacePressedRef.current = false;
      holdingRef.current = false;
      pendingToggleRef.current = false;
    }

    function handleWheel(e) {
      if (isUserTyping() || !e.shiftKey) return;
      e.preventDefault();
      if (e.deltaY > 0) {
        volumeDown(e, VOLUME_STEP_FINE);
      } else if (e.deltaY < 0) {
        volumeUp(e, VOLUME_STEP_FINE);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    // $FlowFixMe
    document.addEventListener('visibilitychange', handleBlur);

    const container = containerRef.current;
    if (container) container.addEventListener('wheel', handleWheel);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      // $FlowFixMe
      document.removeEventListener('visibilitychange', handleBlur);
      if (container) container.removeEventListener('wheel', handleWheel);
      clearHoldTimeout();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media, isMobile, isLivestreamClaim]);
}
