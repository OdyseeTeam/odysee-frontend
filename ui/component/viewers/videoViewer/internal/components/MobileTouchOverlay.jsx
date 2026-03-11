// @flow
import React, { useRef, useCallback } from 'react';
import Player from '../player';

const DOUBLE_TAP_THRESHOLD_MS = 300;
const SEEK_AMOUNT = 10;

type Props = {};

export default function MobileTouchOverlay(props: Props) {
  const store = Player.usePlayer();
  const lastTapRef = useRef(0);
  const lastTapSideRef = useRef(null);
  const tapTimerRef = useRef(null);

  const handleTap = useCallback(
    (e) => {
      const now = Date.now();
      const timeSince = now - lastTapRef.current;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX) || 0;
      const side = x < rect.left + rect.width / 2 ? 'left' : 'right';

      if (timeSince < DOUBLE_TAP_THRESHOLD_MS && lastTapSideRef.current === side) {
        // Double tap - seek
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

        lastTapRef.current = 0;
        lastTapSideRef.current = null;
      } else {
        // Single tap - toggle play/pause after delay
        lastTapRef.current = now;
        lastTapSideRef.current = side;

        if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
        tapTimerRef.current = setTimeout(() => {
          const s = store.state;
          if (s.paused) {
            s.play();
          } else {
            s.pause();
          }
          tapTimerRef.current = null;
        }, DOUBLE_TAP_THRESHOLD_MS);
      }
    },
    [store]
  );

  return <div className="odysee-touch-overlay" onClick={handleTap} />;
}
