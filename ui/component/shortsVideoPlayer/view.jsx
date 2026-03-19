// @flow
import React from 'react';
import VideoClaimInitiator from 'component/videoClaimInitiator';
import { useHistory } from 'react-router-dom';

export const SHORTS_PLAYER_WRAPPER_CLASS = 'shorts-page__video-container';

type Props = {
  uri: string,
  upcomingUris: Array<string>,
  isMobile: boolean,
  primaryPlayerWrapperClass: string,
  nextRecommendedShort: ?string,
  autoPlayNextShort: boolean,
  isAtEnd: boolean,
  onSwipeNext: () => void,
  onSwipePrevious?: () => void,
  enableSwipe?: boolean,
  panelOpen?: boolean,
};

const ShortsVideoPlayer = React.memo<Props>(
  ({
    uri,
    isMobile,
    primaryPlayerWrapperClass,
    nextRecommendedShort,
    autoPlayNextShort,
    isAtEnd,
    onSwipeNext,
    onSwipePrevious,
    enableSwipe,
    panelOpen,
  }: Props) => {
    const {
      location: { search },
    } = useHistory();
    const urlParams = new URLSearchParams(search);
    const isShortVideo = urlParams.get('view') === 'shorts';

    const autoPlayRef = React.useRef({ autoPlayNextShort, nextRecommendedShort, isAtEnd, onSwipeNext, panelOpen });
    autoPlayRef.current = { autoPlayNextShort, nextRecommendedShort, isAtEnd, onSwipeNext, panelOpen };

    React.useEffect(() => {
      let videoEl = null;
      let pollId = null;

      const shouldAutoAdvance = () => {
        const { autoPlayNextShort: ap, nextRecommendedShort: next, isAtEnd: end, panelOpen: po } = autoPlayRef.current;
        return ap && next && !end && !po;
      };

      const handleEnded = () => {
        if (shouldAutoAdvance()) {
          const { onSwipeNext: swipe } = autoPlayRef.current;
          window.__shortsAutoPlayNext = true;
          const docEl = document.documentElement;
          if (docEl) docEl.setAttribute('data-shorts-transitioning', '');
          swipe();
        } else if (videoEl) {
          videoEl.currentTime = 0;
          videoEl.play();
        }
      };

      const tryAttach = () => {
        const el: any = document.querySelector('video');
        if (el && el !== videoEl) {
          if (videoEl) videoEl.removeEventListener('ended', handleEnded);
          videoEl = el;
          el.addEventListener('ended', handleEnded);
        }
      };

      pollId = setInterval(tryAttach, 200);
      tryAttach();

      return () => {
        clearInterval(pollId);
        if (videoEl) videoEl.removeEventListener('ended', handleEnded);
      };
    }, [uri]);

    return (
      <div className="shorts-page__video-section">
        <div className={`${SHORTS_PLAYER_WRAPPER_CLASS} ${primaryPlayerWrapperClass}`}>
          {isShortVideo && (
            <VideoClaimInitiator
              uri={uri}
              onSwipeNext={onSwipeNext}
              onSwipePrevious={onSwipePrevious}
              enableSwipe={enableSwipe}
            />
          )}
        </div>
      </div>
    );
  }
);

export default ShortsVideoPlayer;
