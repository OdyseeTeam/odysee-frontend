// @flow
import * as React from 'react';
import { createPortal } from 'react-dom';
import classnames from 'classnames';
import withStreamClaimRender from 'hocs/withStreamClaimRender';
import useSwipeNavigation from 'effects/use-swipe-navigation';
import './style.scss';
import MobileActions from '../shortsMobileActions';

const LIVE_REACTION_FETCH_MS = 1000 * 45;

type Props = {
  uri?: string,
  children: React.Node,
  onNext: () => void,
  onPrevious: () => void,
  isEnabled: boolean,
  className?: string,
  containerSelector?: string,
  isMobile: boolean,
  sidePanelOpen?: boolean,
  autoPlayNextShort?: boolean,
  doToggleShortsAutoplay?: () => void,
  onCommentsClick?: () => void,
  onInfoButtonClick?: () => void,
  likeCount: number,
  dislikeCount: number,
  myReaction: ?string,
  doReactionLike: (uri: string) => void,
  doReactionDislike: (uri: string) => void,
  isUnlisted: ?boolean,
  doOpenModal: (id: string, props: any) => void,
  webShareable?: boolean,
  collectionId?: string,
  claimId?: string,
  isLivestreamClaim?: boolean,
  doFetchReactions?: (claimId: ?string) => void,
  handleShareClick?: () => void,
};

const SwipeNavigationPortal = React.memo<Props>(
  ({
    uri,
    children,
    onNext,
    onPrevious,
    isEnabled,
    className = '',
    containerSelector,
    isMobile,
    sidePanelOpen,
    onInfoButtonClick,
    autoPlayNextShort,
    doToggleShortsAutoplay,
    onCommentsClick,
    likeCount,
    dislikeCount,
    myReaction,
    doReactionLike,
    doReactionDislike,
    webShareable,
    isUnlisted,
    collectionId,
    doOpenModal,
    claimId,
    isLivestreamClaim,
    doFetchReactions,
    handleShareClick,
  }: Props) => {
    const wheelLockRef = React.useRef(false);

    React.useEffect(() => {
      function fetchReactions() {
        if (doFetchReactions) doFetchReactions(claimId);
      }

      let fetchInterval;
      if (claimId) {
        fetchReactions();

        if (isLivestreamClaim) {
          fetchInterval = setInterval(fetchReactions, LIVE_REACTION_FETCH_MS);
        }
      }

      return () => {
        if (fetchInterval) {
          clearInterval(fetchInterval);
        }
      };
    }, [claimId, doFetchReactions, isLivestreamClaim]);

    const handlePlayPause = React.useCallback(() => {
      const videoElement: any = document.querySelector('.vjs-tech');
      if (videoElement) {
        if (videoElement.paused) {
          videoElement.play();
        } else {
          videoElement.pause();
        }
      }
    }, []);

    const overlayRef = useSwipeNavigation({
      onSwipeNext: onNext,
      onSwipePrevious: onPrevious,
      isEnabled: isEnabled && isMobile,
      minSwipeDistance: 10,
      tapDuration: 200,
    });

    const handleWheel = React.useCallback(
      (e) => {
        if (!isEnabled || wheelLockRef.current) return;
        e.preventDefault();
        wheelLockRef.current = true;

        if (e.deltaY > 0) {
          onNext();
        } else if (e.deltaY < 0) {
          onPrevious();
        }

        setTimeout(() => {
          wheelLockRef.current = false;
        }, 120);
      },
      [onNext, onPrevious, isEnabled]
    );

    const handleKeyDown = React.useCallback(
      (e) => {
        if (!isEnabled) return;
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          onPrevious();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          onNext();
        }
      },
      [onNext, onPrevious, isEnabled]
    );

    React.useEffect(() => {
      const overlay = overlayRef.current;
      if (!overlay || !isEnabled) return;

      if (!isMobile) {
        overlay.addEventListener('wheel', handleWheel, { passive: false });
      }
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        if (!isMobile) {
          overlay.removeEventListener('wheel', handleWheel);
        }
        window.removeEventListener('keydown', handleKeyDown);
      };
    }, [isMobile, isEnabled, handleWheel, handleKeyDown, overlayRef]);

    const targetContainer = React.useMemo(() => {
      if (containerSelector) {
        return document.querySelector(containerSelector);
      }
      return document.body;
    }, [containerSelector]);

    if (!targetContainer) return null;
    return createPortal(
      <div
        onClick={() => {
          handlePlayPause();
        }}
        ref={overlayRef}
        className={classnames('swipe-navigation-overlay', className, {
          'swipe-navigation-overlay--enabled': isEnabled,
          'shorts__viewer--panel-open': sidePanelOpen,
        })}
      >
        <MobileActions
          uri={uri}
          likeCount={likeCount}
          dislikeCount={dislikeCount}
          myReaction={myReaction}
          doReactionLike={doReactionLike}
          doReactionDislike={doReactionDislike}
          onCommentsClick={onCommentsClick}
          onInfoButtonClick={onInfoButtonClick}
          autoPlayNextShort={autoPlayNextShort}
          doToggleShortsAutoplay={doToggleShortsAutoplay}
          isUnlisted={isUnlisted}
          webShareable={webShareable}
          collectionId={collectionId}
          doOpenModal={doOpenModal}
          onShareClick={handleShareClick}
        />

        {children}
      </div>,
      targetContainer
    );
  }
);

export default withStreamClaimRender(SwipeNavigationPortal);
