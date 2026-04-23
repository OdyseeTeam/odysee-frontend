// Widths are taken from "ui/scss/init/vars.scss"
import React, { useRef } from 'react';
import debounce from 'util/debounce';
import { getWindowAngle, isWindowLandscapeForAngle } from 'util/window';
const DEFAULT_SCREEN_SIZE = 1080;
const RESIZE_DEBOUNCE_MS = 100;

const ForceMobileContext = React.createContext(false);
export const ForceMobileProvider = ForceMobileContext.Provider;

export function useWindowSize() {
  const isWindowClient = typeof window === 'object';
  const [windowSize, setWindowSize] = React.useState(isWindowClient ? window.innerWidth : DEFAULT_SCREEN_SIZE);
  React.useEffect(() => {
    const setSize = debounce(() => {
      setWindowSize(window.innerWidth);
    }, RESIZE_DEBOUNCE_MS);

    if (isWindowClient) {
      window.addEventListener('resize', setSize);
      return () => {
        setSize.cancel();
        window.removeEventListener('resize', setSize);
      };
    }
  }, [isWindowClient]);
  return windowSize;
}

function useHasWindowWidthChangedEnough(comparisonFn: (windowSize: number) => boolean) {
  const isWindowClient = typeof window === 'object';
  const initialState: boolean = isWindowClient ? comparisonFn(window.innerWidth) : comparisonFn(DEFAULT_SCREEN_SIZE);
  const [windowSize, setWindowSize] = React.useState<boolean>(initialState);
  const prev = useRef<boolean>(initialState);
  React.useEffect(() => {
    const setSize = debounce(() => {
      const curr = comparisonFn(window.innerWidth);

      if (prev.current !== curr) {
        setWindowSize(curr);
        prev.current = curr;
      }
    }, RESIZE_DEBOUNCE_MS);

    if (isWindowClient) {
      window.addEventListener('resize', setSize);
      return () => {
        setSize.cancel();
        window.removeEventListener('resize', setSize);
      };
    } // eslint-disable-next-line react-hooks/exhaustive-deps -- @see TODO_NEED_VERIFICATION
  }, [isWindowClient]);
  return windowSize;
}

export function useIsMobile() {
  const forced = React.useContext(ForceMobileContext);
  const fromWindow = useHasWindowWidthChangedEnough((windowSize) => windowSize < 901);
  return forced || fromWindow;
}
export function useIsMobileLandscape() {
  const isMobile = useIsMobile();
  const isLandscapeScreen = useIsLandscapeScreen();
  return isMobile && isLandscapeScreen;
}
export function useIsLandscapeScreen() {
  const isWindowClient = typeof window === 'object';
  const windowAngle = getWindowAngle();
  const isLandscape = isWindowLandscapeForAngle(windowAngle);
  const [landscape, setLandscape] = React.useState<boolean>(isLandscape);
  React.useEffect(() => {
    const handleResize = debounce(() => {
      const currAngle = getWindowAngle();
      const isCurrLandscape = isWindowLandscapeForAngle(currAngle);

      if (landscape !== isCurrLandscape) {
        setLandscape(isCurrLandscape);
      }
    }, RESIZE_DEBOUNCE_MS);

    if (isWindowClient) {
      window.addEventListener('resize', handleResize);
      return () => {
        handleResize.cancel();
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isWindowClient, landscape]);
  return landscape;
}
export function useIsShortsMobile() {
  return useHasWindowWidthChangedEnough((windowSize) => windowSize < 1021);
}
export function useIsSmallScreen() {
  return useHasWindowWidthChangedEnough((windowSize) => windowSize < 1151);
}
export function useIsMediumScreen() {
  return useHasWindowWidthChangedEnough((windowSize) => windowSize >= 1151 && windowSize <= 1600);
}
export function useIsLargeScreen() {
  return useHasWindowWidthChangedEnough((windowSize) => windowSize > 1600);
}
