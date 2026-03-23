import * as React from 'react';
import { createPortal } from 'react-dom';
import classnames from 'classnames';
import useSwipeNavigation from 'effects/use-swipe-navigation';
import './style.scss';
import MobileActions from '../shortsMobileActions';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectClaimForUri, selectIsStreamPlaceholderForUri, selectIsUriUnlisted } from 'redux/selectors/claims';
import { selectMyReactionForUri, selectLikeCountForUri, selectDislikeCountForUri } from 'redux/selectors/reactions';
import { doFetchReactions, doReactionLike, doReactionDislike } from 'redux/actions/reactions';
import { doOpenModal } from 'redux/actions/app';

const LIVE_REACTION_FETCH_MS = 1000 * 45;
type Props = {
  uri?: string;
  children: React.ReactNode;
  onNext: () => void;
  onPrevious: () => void;
  isEnabled: boolean;
  className?: string;
  containerSelector?: string;
  isMobile: boolean;
  sidePanelOpen?: boolean;
  autoPlayNextShort?: boolean;
  doToggleShortsAutoplay?: () => void;
  onCommentsClick?: () => void;
  onInfoButtonClick?: () => void;
  webShareable?: boolean;
  collectionId?: string;
  handleShareClick?: () => void;
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
    webShareable,
    collectionId,
    handleShareClick,
  }: Props) => {
    const dispatch = useAppDispatch();
    const claim = useAppSelector((state) => (uri ? selectClaimForUri(state, uri) : null));
    const claimId = claim?.claim_id;
    const myReaction = useAppSelector((state) => (uri ? selectMyReactionForUri(state, uri) : null));
    const likeCount = useAppSelector((state) => (uri ? selectLikeCountForUri(state, uri) : 0));
    const dislikeCount = useAppSelector((state) => (uri ? selectDislikeCountForUri(state, uri) : 0));
    const isLivestreamClaim = useAppSelector((state) => (uri ? selectIsStreamPlaceholderForUri(state, uri) : false));
    const isUnlisted = useAppSelector((state) => (uri ? selectIsUriUnlisted(state, uri) : false));
    const wheelLockRef = React.useRef(false);
    React.useEffect(() => {
      function fetchReactions() {
        if (claimId) dispatch(doFetchReactions(claimId));
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
    }, [claimId, dispatch, isLivestreamClaim]);
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
        overlay.addEventListener('wheel', handleWheel, {
          passive: false,
        });
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
        onClick={(e) => {
          e.currentTarget.style.pointerEvents = 'none';
          const el = document.elementFromPoint(e.clientX, e.clientY);
          e.currentTarget.style.pointerEvents = '';

          if (el) {
            const link = el.closest('a, button');

            if (
              link &&
              link.closest('.shorts-viewer__content-info, .shorts-page__view-toggle--overlay, .button--play')
            ) {
              if (link instanceof HTMLElement) link.click();
              return;
            }
          }

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
          doReactionLike={(u) => dispatch(doReactionLike(u))}
          doReactionDislike={(u) => dispatch(doReactionDislike(u))}
          onCommentsClick={onCommentsClick}
          onInfoButtonClick={onInfoButtonClick}
          autoPlayNextShort={autoPlayNextShort}
          doToggleShortsAutoplay={doToggleShortsAutoplay}
          isUnlisted={isUnlisted}
          webShareable={webShareable}
          collectionId={collectionId}
          doOpenModal={(id, p) => dispatch(doOpenModal(id, p))}
          onShareClick={handleShareClick}
        />

        {children}
      </div>,
      targetContainer
    );
  }
);
export default SwipeNavigationPortal;
