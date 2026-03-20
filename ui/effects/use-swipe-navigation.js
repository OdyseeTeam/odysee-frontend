// @flow
import { useRef, useState, useEffect, useCallback } from 'react';

type SwipeNavigationOptions = {
  onSwipeNext?: () => void,
  onSwipePrevious?: () => void,
  isEnabled?: boolean,
  minSwipeDistance?: number,
  tapDuration?: number,
  onTap?: () => void,
};

export default function useSwipeNavigation(options: SwipeNavigationOptions) {
  const { onSwipeNext, onSwipePrevious, isEnabled = true, minSwipeDistance = 50, tapDuration = 200, onTap } = options;

  const [element, setElement] = useState<?HTMLElement>(null);
  const elementRef = useCallback((node: ?HTMLElement) => setElement(node), []);
  const touchStartRef = useRef(null);
  const touchEndRef = useRef(null);
  const isScrollingRef = useRef(false);
  const isTapRef = useRef(false);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!isEnabled) return;
      touchStartRef.current = {
        y: e.targetTouches[0].clientY,
        x: e.targetTouches[0].clientX,
        time: Date.now(),
      };
      touchEndRef.current = null;
      isScrollingRef.current = false;
      isTapRef.current = true;
    },
    [isEnabled]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isEnabled || !touchStartRef.current) return;
      const touchStart = touchStartRef.current; // lint
      const currentY = e.targetTouches[0].clientY;
      const currentX = e.targetTouches[0].clientX;
      const diffY = Math.abs(touchStart.y - currentY);
      const diffX = Math.abs(touchStart.x - currentX);

      if (diffY > 20) {
        isScrollingRef.current = true;
        isTapRef.current = false;
        if (diffY > diffX) {
          e.preventDefault();
        }
      }
      if (diffX > diffY) {
        isTapRef.current = false;
      }
      touchEndRef.current = { y: currentY, x: currentX };
    },
    [isEnabled]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!isEnabled || !touchStartRef.current) return;
      const touchStart = touchStartRef.current; // lint
      const touchDurationValue = Date.now() - touchStart.time;

      if (isTapRef.current && touchDurationValue < tapDuration) {
        if (onTap) {
          onTap();
        }
        touchStartRef.current = null;
        touchEndRef.current = null;
        isScrollingRef.current = false;
        return;
      }

      if (!touchEndRef.current || !isScrollingRef.current) return;
      const swipeDistance = touchStart.y - touchEndRef.current.y;

      if (Math.abs(swipeDistance) > minSwipeDistance) {
        e.preventDefault();
        e.stopPropagation();
        if (swipeDistance > 0 && onSwipeNext) {
          onSwipeNext();
        } else if (swipeDistance < 0 && onSwipePrevious) {
          onSwipePrevious();
        }
      }

      touchStartRef.current = null;
      touchEndRef.current = null;
      isScrollingRef.current = false;
      isTapRef.current = false;
    },
    [isEnabled, onSwipeNext, onSwipePrevious, onTap, minSwipeDistance, tapDuration]
  );

  useEffect(() => {
    const el = element;
    if (!el || !isEnabled) return;

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [element, isEnabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return elementRef;
}
