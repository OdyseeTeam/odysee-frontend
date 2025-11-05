// @flow
import * as React from 'react';
import FileTitleSection from 'component/fileTitleSection';
import { useIsMobile } from 'effects/use-screensize';
import RecSys from 'recsys';
import { v4 as Uuidv4 } from 'uuid';
import { PRIMARY_PLAYER_WRAPPER_CLASS } from '../videoPlayers/view';
import ShortsActions from 'component/shortsActions';
import ShortsVideoPlayer from 'component/shortsVideoPlayer';
import ShortsSidePanel from 'component/shortsSidePanel';
import MobilePanel from 'component/shortsMobileSidePanel';
import SwipeNavigationPortal from 'component/shortsActions/swipeNavigation';
import { useHistory } from 'react-router';

export const SHORTS_PLAYER_WRAPPER_CLASS = 'shorts-page__video-container';

type Props = {
  uri: string,
  accessStatus: ?string,
  shortsRecommendedUris?: Array<string>,
  nextRecommendedShort?: string,
  previousRecommendedShort?: string,
  currentIndex?: number,
  isSearchingRecommendations?: boolean,
  audioVideoDuration: ?number,
  commentsListTitle: string,
  fileInfo: FileListItem,
  isMature: boolean,
  linkedCommentId?: string,
  threadCommentId?: string,
  position: number,
  commentsDisabled: ?boolean,
  contentUnlocked: boolean,
  isAutoplayCountdownForUri: ?boolean,
  sidePanelOpen: boolean,
  clearPosition: (uri: string) => void,
  doNavigateToNextShort: (nextUri: string) => void,
  doNavigateToPreviousShort: (previousUri: string) => void,
  doToggleShortsSidePanel: () => void,
  doSetShortsSidePanel: (isOpen: boolean) => void,
  doFetchShortsRecommendedContent: (uri: string, fypParam?: ?FypParam) => void,
  doSetShortsPlaylist: (uris: Array<string>) => void,
  doClearShortsPlaylist: () => void,
  channelId: ?string,
  channelName: ?string,
  doFetchChannelShorts: (channelId: string) => void,
  viewMode: string,
  doSetShortsViewMode: (mode: string) => void,
  title?: string,
  channelUri?: string,
  thumbnail?: string,
  autoPlayNextShort: boolean,
  doToggleShortsAutoplay: () => void,
  doSetShortsAutoplay: (enabled: boolean) => void,
  isClaimShort: boolean,
  claimId?: string,
  autoplayMedia: boolean,
  doSetClientSetting: (key: string, value: boolean) => void,
  streamClaim?: () => void,
};

export default function ShortsPage(props: Props) {
  const {
    uri,
    accessStatus,
    shortsRecommendedUris,
    nextRecommendedShort,
    previousRecommendedShort,
    currentIndex = -1,
    isSearchingRecommendations,
    fileInfo,
    isMature,
    linkedCommentId,
    threadCommentId,
    commentsDisabled,
    commentsListTitle,
    contentUnlocked,
    clearPosition,
    doSetShortsSidePanel,
    doFetchShortsRecommendedContent,
    doSetShortsPlaylist,
    doClearShortsPlaylist,
    sidePanelOpen,
    channelId,
    channelName,
    doFetchChannelShorts,
    viewMode: reduxViewMode,
    doSetShortsViewMode,
    title,
    channelUri,
    thumbnail,
    autoPlayNextShort,
    doToggleShortsAutoplay,
  } = props;

  const {
    location: { search },
  } = useHistory();

  const urlParams = new URLSearchParams(search);
  const isShortFromChannelPage = urlParams.get('from') === 'channel';
  const history = useHistory();
  const isMobile = useIsMobile();
  const shortsContainerRef = React.useRef();
  const [uuid] = React.useState(Uuidv4());
  const [mobileModalOpen, setMobileModalOpen] = React.useState(false);
  const scrollLockRef = React.useRef(false);
  const [localViewMode, setLocalViewMode] = React.useState(
    isShortFromChannelPage ? 'channel' : reduxViewMode || 'related'
  );
  const [panelMode, setPanelMode] = React.useState<'info' | 'comments'>('info');
  const { onRecsLoaded: onRecommendationsLoaded, onClickedRecommended: onRecommendationClicked } = RecSys;

  const hasPlaylist = shortsRecommendedUris && shortsRecommendedUris.length > 0;
  const isAtStart = currentIndex <= 0;
  const isAtEnd = currentIndex >= (shortsRecommendedUris?.length || 1) - 1;
  const hasInitializedRef = React.useRef(false);
  const entryUrlRef = React.useRef(null);
  const isLoadingContent = isSearchingRecommendations || !hasPlaylist;

  const fetchForMode = React.useCallback(
    (mode) => {
      const fypParam = uuid ? { uuid } : null;
      if (mode === 'channel' && channelId) {
        doFetchChannelShorts(channelId);
      } else {
        doFetchShortsRecommendedContent(uri, fypParam);
      }
    },
    [channelId, uri, uuid, doFetchChannelShorts, doFetchShortsRecommendedContent]
  );

  const handlePlayPause = React.useCallback(() => {
    const videoElement = document.querySelector('.vjs-tech');
    if (videoElement) {
      if (videoElement.paused) {
        videoElement.play();
      } else {
        videoElement.pause();
      }
    }
  }, []);

  const handleViewModeChange = React.useCallback(
    (mode) => {
      setLocalViewMode(mode);
      doSetShortsViewMode(mode);
      doSetShortsPlaylist([]);
      fetchForMode(mode);
    },
    [doSetShortsViewMode, doSetShortsPlaylist, fetchForMode]
  );

  const handleCommentsClick = React.useCallback(() => {
    if (isMobile) {
      setMobileModalOpen(true);
      setPanelMode('comments');
    } else {
      setPanelMode('comments');
      doSetShortsSidePanel(true);
    }
  }, [isMobile, doSetShortsSidePanel]);

  const handleInfoButtonClick = React.useCallback(() => {
    if (isMobile) {
      setMobileModalOpen(true);
      setPanelMode('info');
    } else {
      setPanelMode('info');
      doSetShortsSidePanel(true);
    }
  }, [isMobile, doSetShortsSidePanel]);

  const handleClosePanel = React.useCallback(() => {
    if (isMobile) {
      setMobileModalOpen(false);
    } else {
      doSetShortsSidePanel(false);
    }
  }, [isMobile, doSetShortsSidePanel]);

  React.useEffect(() => {
    const unlisten = history.listen((location, action) => {
      const isNavigatingToShorts = location.search.includes('view=shorts');
      const isNavigatingFromShorts = search.includes('view=shorts');

      if (isNavigatingFromShorts && !isNavigatingToShorts) {
        doClearShortsPlaylist();
      }
    });

    return () => {
      unlisten();
      const currentUrl = window.location.search;
      if (!currentUrl.includes('view=shorts')) {
        doClearShortsPlaylist();
      }
    };
  }, [history, search, doClearShortsPlaylist]);

  React.useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      if (isShortFromChannelPage) {
        doSetShortsViewMode('channel');
      }
      fetchForMode(localViewMode);
    }
  }, [fetchForMode, localViewMode, doSetShortsViewMode, isShortFromChannelPage]);

  React.useEffect(() => {
    if (hasInitializedRef.current && reduxViewMode !== localViewMode) {
      setLocalViewMode(reduxViewMode);
    }
  }, [reduxViewMode, localViewMode]);

  React.useEffect(() => {
    const claim = fileInfo?.claim;
    const claimId = claim?.claim_id;

    if (claimId && hasPlaylist) {
      onRecommendationsLoaded(claimId, shortsRecommendedUris, uuid);
    }
  }, [shortsRecommendedUris, fileInfo, onRecommendationsLoaded, uuid, hasPlaylist]);

  React.useEffect(() => {
    if (shortsRecommendedUris && shortsRecommendedUris.length > 0) {
      const currentUriInPlaylist = shortsRecommendedUris.includes(uri);
      if (!currentUriInPlaylist) {
        const playlistUris = [uri, ...shortsRecommendedUris];
        doSetShortsPlaylist(playlistUris);
      }
    }
  }, [shortsRecommendedUris, uri, doSetShortsPlaylist]);

  React.useEffect(() => {
    if (!entryUrlRef.current) {
      const urlParams = new URLSearchParams(search);
      const fromChannel = urlParams.get('from') === 'channel';

      if (fromChannel && channelUri) {
        entryUrlRef.current = channelUri.replace('lbry://', '/').replace(/#/g, ':') + '?view=shortsTab';
      } else {
        entryUrlRef.current = '/';
      }
    }
  }, [search, channelUri]);

  const goToNext = React.useCallback(() => {
    if (!nextRecommendedShort || isAtEnd || isSearchingRecommendations) {
      return;
    }

    clearPosition(uri);

    const shortsUrl = nextRecommendedShort.replace('lbry://', '/').replace(/#/g, ':') + '?view=shorts';
    history.replace(shortsUrl);

    const claim = fileInfo?.claim;
    const currentClaimId = claim?.claim_id;
    if (currentClaimId) {
      const nextClaimId = nextRecommendedShort.split('#')[1] || nextRecommendedShort.split('/').pop();
      onRecommendationClicked(currentClaimId, nextClaimId);
    }
  }, [
    nextRecommendedShort,
    isAtEnd,
    isSearchingRecommendations,
    uri,
    clearPosition,
    history,
    fileInfo,
    onRecommendationClicked,
  ]);

  const goToPrevious = React.useCallback(() => {
    if (!previousRecommendedShort || isAtStart || isSearchingRecommendations) return;

    clearPosition(uri);

    const shortsUrl = previousRecommendedShort.replace('lbry://', '/').replace(/#/g, ':') + '?view=shorts';
    history.replace(shortsUrl);
  }, [previousRecommendedShort, isAtStart, isSearchingRecommendations, uri, clearPosition, history]);

  React.useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'Escape') {
        if (mobileModalOpen) {
          setMobileModalOpen(false);
        } else if (sidePanelOpen) {
          doSetShortsSidePanel(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [goToNext, goToPrevious, sidePanelOpen, mobileModalOpen, doSetShortsSidePanel]);

  const handleScroll = React.useCallback(
    (e) => {
      if (mobileModalOpen) return;
      if (scrollLockRef.current) return;

      e.preventDefault();
      scrollLockRef.current = true;

      if (e.deltaY > 0) {
        goToNext();
      } else if (e.deltaY < 0) {
        goToPrevious();
      }

      setTimeout(() => {
        scrollLockRef.current = false;
      }, 500);
    },
    [goToNext, goToPrevious, mobileModalOpen]
  );

  React.useEffect(() => {
    const container = shortsContainerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleScroll, { passive: false });
    return () => container.removeEventListener('wheel', handleScroll);
  }, [handleScroll]);

  React.useEffect(() => {
    const videoElement = document.querySelector('.vjs-tech');
    if (!videoElement) return;

    const handleEnded = () => {
      if (autoPlayNextShort && nextRecommendedShort && !isAtEnd) {
        setTimeout(() => {
          goToNext();
        }, 500);
      } else {
        setTimeout(() => {
          videoElement.currentTime = 0;
          videoElement.play().catch((error) => {
            console.log(error);
          });
        }, 500);
      }
    };
    videoElement.addEventListener('ended', handleEnded);
    return () => {
      videoElement.removeEventListener('ended', handleEnded);
    };
  }, [autoPlayNextShort, nextRecommendedShort, isAtEnd, goToNext]);

  const isSwipeEnabled = !mobileModalOpen;

  if (isMature) {
    return (
      <div className="shorts-page shorts-page--blocked">
        <div className={SHORTS_PLAYER_WRAPPER_CLASS}>
          <FileTitleSection uri={uri} accessStatus={accessStatus} isNsfwBlocked />
        </div>
        <ShortsActions
          hasPlaylist={hasPlaylist}
          onNext={goToNext}
          onPrevious={goToPrevious}
          isLoading={isLoadingContent}
          currentIndex={currentIndex}
          totalVideos={shortsRecommendedUris?.length || 0}
          isAtStart={isAtStart}
          isAtEnd={isAtEnd}
          autoPlayNextShort={autoPlayNextShort}
          doToggleShortsAutoplay={doToggleShortsAutoplay}
        />
      </div>
    );
  }

  return (
    <>
      <SwipeNavigationPortal
        onPlayPause={handlePlayPause}
        onNext={goToNext}
        onPrevious={goToPrevious}
        isEnabled={isSwipeEnabled && hasPlaylist}
        isMobile={isMobile}
        className="shorts-swipe-overlay"
        sidePanelOpen={sidePanelOpen}
        showViewToggle={!!channelId}
        viewMode={localViewMode}
        channelName={channelName}
        onViewModeChange={handleViewModeChange}
        title={title}
        channelUri={channelUri}
        thumbnailUrl={thumbnail}
        hasChannel={!!channelId}
        hasPlaylist={hasPlaylist}
        uri={uri}
      />
      <div className="shorts-page" ref={shortsContainerRef}>
        <div className={`shorts-page__container ${sidePanelOpen ? 'shorts-page__container--panel-open' : ''}`}>
          <div className="shorts-page__main-content">
            <div className="shorts-page__video-section">
              <ShortsVideoPlayer
                uri={uri}
                isMobile={isMobile}
                sidePanelOpen={sidePanelOpen}
                onInfoButtonClick={handleInfoButtonClick}
                primaryPlayerWrapperClass={PRIMARY_PLAYER_WRAPPER_CLASS}
                onNext={goToNext}
                onPrevious={goToPrevious}
                onScroll={handleScroll}
                viewMode={localViewMode}
                channelName={channelName}
                onViewModeChange={handleViewModeChange}
                hasChannel={!!channelId}
                hasPlaylist={hasPlaylist}
              />

              {!isMobile && (
                <ShortsActions
                  hasPlaylist={hasPlaylist}
                  onNext={goToNext}
                  onPrevious={goToPrevious}
                  isLoading={isLoadingContent}
                  currentIndex={currentIndex}
                  totalVideos={shortsRecommendedUris?.length || 0}
                  isAtStart={isAtStart}
                  isAtEnd={isAtEnd}
                  autoPlayNextShort={autoPlayNextShort}
                  doToggleShortsAutoplay={doToggleShortsAutoplay}
                  uri={uri}
                  onCommentsClick={handleCommentsClick}
                  onInfoClick={handleInfoButtonClick}
                />
              )}
            </div>
          </div>

          {!isMobile && (
            <ShortsSidePanel
              isOpen={sidePanelOpen}
              uri={uri}
              accessStatus={accessStatus}
              contentUnlocked={contentUnlocked}
              commentsDisabled={commentsDisabled}
              linkedCommentId={linkedCommentId}
              threadCommentId={threadCommentId}
              isComments={panelMode === 'comments'}
              onClose={handleClosePanel}
            />
          )}

          {isMobile && (
            <MobilePanel
              isOpen={mobileModalOpen}
              onClose={() => setMobileModalOpen(false)}
              onInfoClick={handleInfoButtonClick}
              uri={uri}
              accessStatus={accessStatus}
              contentUnlocked={contentUnlocked}
              commentsDisabled={commentsDisabled}
              commentsListTitle={commentsListTitle}
              linkedCommentId={linkedCommentId}
              threadCommentId={threadCommentId}
              autoPlayNextShort={autoPlayNextShort}
              doToggleShortsAutoplay={doToggleShortsAutoplay}
            />
          )}
        </div>
      </div>
    </>
  );
}
