// @flow
import * as React from 'react';
import { createPortal } from 'react-dom';
import classnames from 'classnames';
import withStreamClaimRender from 'hocs/withStreamClaimRender';
import useSwipeNavigation from 'effects/use-swipe-navigation';
import './style.scss';
import ViewModeSelector from './viewModeSelector';
import MobileActions from '../shortsMobileActions';
import ViewModeToggle from './viewModeToggle';
import ChannelThumbnail from 'component/channelThumbnail';
import { Link } from 'react-router-dom';

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
  showViewToggle?: boolean,
  viewMode?: string,
  channelName?: string,
  title?: string,
  channelUri?: string,
  hasChannel?: boolean,
  autoPlayNextShort?: boolean,
  doToggleShortsAutoplay?: () => void,
  streamClaim?: StreamClaim,
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
  setLocalViewMode: (mode: string) => void,
  doSetShortsViewMode: (mode: string) => void,
  doSetShortsPlaylist: (playlist: Array<any>) => void,
  fetchForMode: (mode: string) => void,
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
    showViewToggle = false,
    viewMode = 'related',
    channelName,
    title,
    channelUri,
    hasChannel,
    onInfoButtonClick,
    autoPlayNextShort,
    doToggleShortsAutoplay,
    onCommentsClick,
    likeCount,
    dislikeCount,
    myReaction,
    doReactionLike,
    doReactionDislike,
    streamClaim,
    webShareable,
    isUnlisted,
    collectionId,
    doOpenModal,
    setLocalViewMode,
    doSetShortsViewMode,
    doSetShortsPlaylist,
    fetchForMode,
    claimId,
    isLivestreamClaim,
    doFetchReactions,
    handleShareClick,
  }: Props) => {
    const scrollLockRef = React.useRef(false);

    React.useEffect(() => {
      function fetchReactions() {
        doFetchReactions(claimId);
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

    const handleViewModeChange = React.useCallback(
      (mode) => {
        setLocalViewMode(mode);
        doSetShortsViewMode(mode);
        doSetShortsPlaylist([]);
        fetchForMode(mode);
      },
      [doSetShortsViewMode, doSetShortsPlaylist, fetchForMode, setLocalViewMode]
    );

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
        if (!isEnabled || scrollLockRef.current) return;
        e.preventDefault();
        scrollLockRef.current = true;

        if (e.deltaY > 0) {
          onNext();
        } else if (e.deltaY < 0) {
          onPrevious();
        }

        setTimeout(() => {
          scrollLockRef.current = false;
        }, 500);
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
          if (streamClaim) {
            streamClaim();
          }
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

        {channelName && (
          <>
            <div className="swipe-navigation-overlay__content-info">
              <div className="swipe-navigation-overlay__text-info">
                {channelUri && channelName && (
                  <Link
                    to={channelUri.replace('lbry://', '/').replace(/#/g, ':')}
                    className="swipe-navigation-overlay__channel"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <ChannelThumbnail uri={channelUri} xsmall checkMembership={false} />
                    <span className="swipe-navigation-overlay__channel-name">{channelName}</span>
                  </Link>
                )}
              </div>
              <span className="swipe-navigation-overlay__title">{title}</span>
            </div>
          </>
        )}

        {!isMobile && hasChannel && handleViewModeChange && (
          <ViewModeSelector viewMode={viewMode} channelName={channelName} onViewModeChange={handleViewModeChange} />
        )}

        {showViewToggle && handleViewModeChange && (
          <ViewModeToggle viewMode={viewMode} channelName={channelName} onViewModeChange={handleViewModeChange} />
        )}

        {children}
      </div>,
      targetContainer
    );
  }
);

export default withStreamClaimRender(SwipeNavigationPortal);
