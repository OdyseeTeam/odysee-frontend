// @flow
import React, { useRef, useCallback, useEffect, useState } from 'react';
import Player from '../player';
import { icons } from 'component/common/icon-custom';
import * as ICONS from 'constants/icons';

const DOUBLE_TAP_THRESHOLD_MS = 300;
const SEEK_AMOUNT = 10;
const AUTO_HIDE_DELAY = 4000;
const PLAY_HIDE_DELAY = 400;

const PlayIcon = icons[ICONS.PLAY];
const ReplayIcon = icons[ICONS.REPLAY];
const PrevIcon = icons[ICONS.PLAY_PREVIOUS];

type Props = {
  onPlayNext?: (options?: { manual?: boolean }) => void,
  onPlayPrevious?: () => void,
  canPlayNext?: boolean,
  canPlayPrevious?: boolean,
};

export default function MobileTouchOverlay(props: Props) {
  const { onPlayNext, onPlayPrevious, canPlayNext, canPlayPrevious } = props;
  const store = Player.usePlayer();
  const paused = Player.usePlayer((s) => Boolean(s.paused));
  const ended = Player.usePlayer((s) => Boolean(s.ended));
  const lastTapRef = useRef(0);
  const lastTapSideRef = useRef(null);
  const tapTimerRef = useRef(null);
  const hideTimerRef = useRef(null);
  const overlayRef = useRef(null);
  const quickHideRef = useRef(false);
  const mountedRef = useRef(false);
  const [showControls, setShowControls] = useState(false);

  const getControlsEl = useCallback(() => {
    const el = overlayRef.current;
    // $FlowFixMe
    return el ? el.closest('.odysee-skin')?.querySelector('.media-controls') : null;
  }, []);

  useEffect(() => {
    const controls = getControlsEl();
    if (!controls) return;
    if (showControls) {
      controls.removeAttribute('data-mobile-hidden');
    } else {
      controls.setAttribute('data-mobile-hidden', '');
    }
    return () => controls.removeAttribute('data-mobile-hidden');
  }, [showControls, getControlsEl]);

  const scheduleAutoHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (document.querySelector('.media-button--settings-open')) {
        scheduleAutoHide();
        return;
      }
      setShowControls(false);
    }, AUTO_HIDE_DELAY);
  }, []);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (paused) {
      quickHideRef.current = false;
      setShowControls(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    } else if (showControls) {
      if (quickHideRef.current) {
        quickHideRef.current = false;
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => setShowControls(false), PLAY_HIDE_DELAY);
      } else {
        scheduleAutoHide();
      }
    }
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [showControls, paused, scheduleAutoHide]);

  useEffect(() => {
    return () => {
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    };
  }, []);

  const handleTap = useCallback(
    (e) => {
      e.stopPropagation();
      const now = Date.now();
      const timeSince = now - lastTapRef.current;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX) || 0;
      const side = x < rect.left + rect.width / 2 ? 'left' : 'right';

      if (timeSince < DOUBLE_TAP_THRESHOLD_MS && lastTapSideRef.current === side) {
        if (tapTimerRef.current) {
          clearTimeout(tapTimerRef.current);
          tapTimerRef.current = null;
        }

        const s = store.state;
        if (side === 'left') {
          s.seek(Math.max(0, s.currentTime - SEEK_AMOUNT));
        } else {
          s.seek(Math.min(s.duration, s.currentTime + SEEK_AMOUNT));
        }
        window.dispatchEvent(
          new CustomEvent('odysee-seek', { detail: { amount: side === 'left' ? -SEEK_AMOUNT : SEEK_AMOUNT } })
        );

        lastTapRef.current = 0;
        lastTapSideRef.current = null;
      } else {
        lastTapRef.current = now;
        lastTapSideRef.current = side;

        if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
        tapTimerRef.current = setTimeout(() => {
          tapTimerRef.current = null;
          if (showControls) {
            const s = store.state;
            if (s.paused) {
              quickHideRef.current = true;
              s.play();
            } else {
              s.pause();
            }
          } else {
            setShowControls(true);
          }
        }, DOUBLE_TAP_THRESHOLD_MS);
      }
    },
    [store, showControls]
  );

  const handlePlayPause = useCallback(
    (e) => {
      e.stopPropagation();
      const s = store.state;
      if (s.paused) {
        quickHideRef.current = true;
        s.play();
      } else {
        s.pause();
      }
    },
    [store]
  );

  const handlePrev = useCallback(
    (e) => {
      e.stopPropagation();
      if (canPlayPrevious && onPlayPrevious) onPlayPrevious();
    },
    [canPlayPrevious, onPlayPrevious]
  );

  const handleNext = useCallback(
    (e) => {
      e.stopPropagation();
      if (canPlayNext && onPlayNext) onPlayNext({ manual: true });
    },
    [canPlayNext, onPlayNext]
  );

  return (
    <div className="odysee-touch-overlay" ref={overlayRef} onClick={handleTap}>
      {showControls && (
        <div className="odysee-mobile-center-controls">
          <button
            type="button"
            className={`odysee-mobile-skip-btn ${!canPlayPrevious ? 'odysee-mobile-skip-btn--disabled' : ''}`}
            onClick={handlePrev}
          >
            <PrevIcon size={28} color="currentColor" />
          </button>

          <button type="button" className="odysee-mobile-play-btn" onClick={handlePlayPause}>
            {ended ? (
              <ReplayIcon size={48} color="currentColor" />
            ) : paused ? (
              <PlayIcon className="odysee-mobile-play-icon" size={48} color="currentColor" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width={48} height={48} viewBox="0 0 18 18" fill="currentColor">
                <rect width={4} height={12} x={3} y={3} rx={1.75} />
                <rect width={4} height={12} x={11} y={3} rx={1.75} />
              </svg>
            )}
          </button>

          <button
            type="button"
            className={`odysee-mobile-skip-btn ${!canPlayNext ? 'odysee-mobile-skip-btn--disabled' : ''}`}
            onClick={handleNext}
          >
            <PrevIcon size={28} color="currentColor" style={{ transform: 'scaleX(-1)' }} />
          </button>
        </div>
      )}
    </div>
  );
}
