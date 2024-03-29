// @flow
import type { ElementRef } from 'react';
import React, { useEffect } from 'react';

/**
 * Helper React hook for lazy loading images
 * @param elementRef - A React useRef instance to the element to lazy load.
 * @param backgroundFallback
 * @param yOffsetPx - Number of pixels from the viewport to start loading.
 * @param {Array<>} [deps=[]] - The dependencies this lazy-load is reliant on.
 */
export default function useLazyLoading(
  elementRef: { current: ?ElementRef<any> },
  backgroundFallback: string = '',
  yOffsetPx: number = 500,
  deps: Array<any> = []
) {
  const [srcLoaded, setSrcLoaded] = React.useState(false);
  const threshold = 0.01;

  function calcRootMargin(value) {
    const devicePixelRatio = window.devicePixelRatio || 1.0;
    if (devicePixelRatio < 1.0) {
      return Math.ceil(value / devicePixelRatio);
    }
    return Math.ceil(value * devicePixelRatio);
  }

  function loadImgFromDataset(target, backgroundFallback, setSrcLoadedFn) {
    // lazy-loaded <img>:
    if (target.dataset.src) {
      // $FlowFixMe
      target.src = target.dataset.src;
      target.onload = () => setSrcLoadedFn(true);

      // We don't handle onerror() here and simply let srcLoaded hanging for
      // flexibility since we have various clients of this hook.
      // If the client needs to do something special when error'd, they can add
      // an onerror() to elementRef on their side.
      return;
    }

    // lazy-loaded `background-image`:
    if (target.dataset.backgroundImage) {
      if (backgroundFallback) {
        const tmpImage = new Image();
        tmpImage.onerror = () => {
          target.style.backgroundImage = `url(${backgroundFallback})`;
        };
        tmpImage.src = target.dataset.backgroundImage;
      }
      target.style.backgroundImage = `url(${target.dataset.backgroundImage})`;
    } else {
      target.style.backgroundImage = `url(${backgroundFallback})`;
    }
  }

  useEffect(() => {
    if (!elementRef.current) {
      return;
    }

    if (!window.IntersectionObserver) {
      loadImgFromDataset(elementRef.current, backgroundFallback, setSrcLoaded);
      return;
    }

    const lazyLoadingObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.intersectionRatio >= threshold) {
            const { target } = entry;
            observer.unobserve(target);
            loadImgFromDataset(target, backgroundFallback, setSrcLoaded);
          }
        });
      },
      {
        root: null,
        rootMargin: `0px 0px ${calcRootMargin(yOffsetPx)}px 0px`,
        threshold: [threshold],
      }
    );

    // $FlowFixMe
    lazyLoadingObserver.observe(elementRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- PLEASE FIX
  }, deps);

  return srcLoaded;
}
