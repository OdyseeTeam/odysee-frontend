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
  }: Props) => {
    const {
      location: { search },
    } = useHistory();
    const urlParams = new URLSearchParams(search);
    const isShortVideo = urlParams.get('view') === 'shorts';

    const autoPlayRef = React.useRef({ autoPlayNextShort, nextRecommendedShort, isAtEnd, onSwipeNext });
    autoPlayRef.current = { autoPlayNextShort, nextRecommendedShort, isAtEnd, onSwipeNext };

    React.useEffect(() => {
      const videoElement: any = document.querySelector('video');
      if (videoElement) {
        videoElement.loop = !(autoPlayNextShort && nextRecommendedShort && !isAtEnd);
      }
    }, [autoPlayNextShort, nextRecommendedShort, isAtEnd]);

    React.useEffect(() => {
      let videoEl = null;
      let pollId = null;

      const handleEnded = () => {
        const {
          autoPlayNextShort: ap,
          nextRecommendedShort: next,
          isAtEnd: end,
          onSwipeNext: swipe,
        } = autoPlayRef.current;
        if (ap && next && !end) {
          window.__shortsAutoPlayNext = true;
          const docEl = document.documentElement;
          if (docEl) docEl.setAttribute('data-shorts-transitioning', '');
          swipe();
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
