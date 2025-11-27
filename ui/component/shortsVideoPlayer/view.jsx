// @flow
import React from 'react';
import VideoClaimInitiator from 'component/videoClaimInitiator';
import Button from 'component/button';
import * as ICONS from 'constants/icons';
import { useHistory } from 'react-router-dom';

export const SHORTS_PLAYER_WRAPPER_CLASS = 'shorts-page__video-container';

type Props = {
  uri: string,
  upcomingUris: Array<string>,
  isMobile: boolean,
  sidePanelOpen: boolean,
  onInfoButtonClick: () => void,
  primaryPlayerWrapperClass: string,
  nextRecommendedShort: ?string,
  autoPlayNextShort: boolean,
  isAtEnd: boolean,
  onSwipeNext?: () => void,
  onSwipePrevious?: () => void,
  enableSwipe?: boolean,
};

const ShortsVideoPlayer = React.memo<Props>(
  ({
    uri,
    isMobile,
    sidePanelOpen,
    onInfoButtonClick,
    primaryPlayerWrapperClass,
    nextRecommendedShort,
    autoPlayNextShort,
    isAtEnd,
    onSwipeNext,
  }: Props) => {
    const {
      location: { search },
    } = useHistory();
    const urlParams = new URLSearchParams(search);
    const isShortVideo = urlParams.get('view') === 'shorts';

    React.useEffect(() => {
      let cleanupFn = null;
      let lastVideoElement = null;

      const attachListener = () => {
        const videoElement = document.querySelector('.vjs-tech');

        if (!videoElement || videoElement === lastVideoElement) {
          return lastVideoElement !== null;
        }
        if (cleanupFn) {
          cleanupFn();
          cleanupFn = null;
        }

        const handleEnded = () => {
          if (autoPlayNextShort && nextRecommendedShort && !isAtEnd) {
            setTimeout(() => {
              onSwipeNext();
            }, 500);
          } else {
            setTimeout(() => {
              videoElement.currentTime = 0;
              videoElement.play().catch((error) => {
                // eslint-disable-next-line no-console
                console.error(error);
              });
            }, 100);
          }
        };

        videoElement.addEventListener('ended', handleEnded);
        lastVideoElement = videoElement;
        cleanupFn = () => {
          videoElement.removeEventListener('ended', handleEnded);
          lastVideoElement = null;
        };
        return true;
      };
      attachListener();
      const interval = setInterval(() => {
        attachListener();
      }, 100);

      const handlePlaying = () => {
        attachListener();
      };
      document.addEventListener('playing', handlePlaying, true);

      const timeout = setTimeout(() => {
        clearInterval(interval);
      }, 10000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
        document.removeEventListener('playing', handlePlaying, true);
        if (cleanupFn) cleanupFn();
      };
    }, [autoPlayNextShort, nextRecommendedShort, isAtEnd, onSwipeNext, uri]);

    return (
      <div className="shorts-page__video-section">
        <div className={`${SHORTS_PLAYER_WRAPPER_CLASS} ${primaryPlayerWrapperClass}`}>
          {isShortVideo && <VideoClaimInitiator uri={uri} />}
        </div>

        {!isMobile && (
          <Button
            className="shorts-page__info-button"
            onClick={onInfoButtonClick}
            icon={ICONS.INFO}
            iconSize={20}
            title={sidePanelOpen ? __('Hide Details') : __('Show Details')}
          />
        )}
      </div>
    );
  }
);

export default ShortsVideoPlayer;
