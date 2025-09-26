// @flow
import * as React from 'react';
import FileTitleSection from 'component/fileTitleSection';
import { useIsMobile } from 'effects/use-screensize';
import RecSys from 'recsys';
import { v4 as Uuidv4 } from 'uuid';
import { PRIMARY_PLAYER_WRAPPER_CLASS } from '../videoPlayers/view';
import ShortsNavigation from 'component/shortsNavigation';
import ShortsVideoPlayer from 'component/shortsVideoPlayer';
import ShortsSidePanel from 'component/shortsSidePanel';
import MobilePanel from 'component/shortsMobileSidePanel';
import SwipeNavigationPortal from 'component/shortsNavigation/swipeNavigation';
import classnames from 'classnames';
import Button from '../../../../../../../../component/button';

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
  doFetchRecommendedContent: (uri: string, fypParam?: ?FypParam, isShorts?: boolean) => void,
  doSetShortsPlaylist: (uris: Array<string>) => void,
  channelId: ?string,
  channelName: ?string,
  doFetchChannelShorts: (channelId: string) => void,
  viewMode: string,
  doSetShortsViewMode: (mode: string) => void,
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
    doNavigateToNextShort,
    doNavigateToPreviousShort,
    doSetShortsSidePanel,
    doToggleShortsSidePanel,
    doFetchRecommendedContent,
    doSetShortsPlaylist,
    sidePanelOpen,
    channelId,
    channelName,
    doFetchChannelShorts,
    viewMode: reduxViewMode,
    doSetShortsViewMode,
  } = props;

  const isMobile = useIsMobile();
  const shortsContainerRef = React.useRef();
  const [uuid] = React.useState(Uuidv4());
  const [mobileModalOpen, setMobileModalOpen] = React.useState(false);
  const scrollLockRef = React.useRef(false);
  const [localViewMode, setLocalViewMode] = React.useState(reduxViewMode || 'related');
  const hasInitializedPlaylist = React.useRef(false);

  console.log(localViewMode);

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

  const { onRecsLoaded: onRecommendationsLoaded, onClickedRecommended: onRecommendationClicked } = RecSys;

  const hasPlaylist = shortsRecommendedUris && shortsRecommendedUris.length > 0;
  const isAtStart = currentIndex <= 0;
  const isAtEnd = currentIndex >= (shortsRecommendedUris?.length || 1) - 1;

  const doFetchRecommendedContentRef = React.useRef(doFetchRecommendedContent);
  const uriRef = React.useRef(uri);
  const uuidRef = React.useRef(uuid);

  const handleViewModeChange = React.useCallback(
    (mode) => {
      setLocalViewMode(mode);
      doSetShortsViewMode(mode);
      doSetShortsPlaylist([]);
      if (mode === 'channel' && channelId) {
        doFetchChannelShorts(channelId);
      } else {
        const fypParam = uuid ? { uuid } : null;
        doFetchRecommendedContent(uri, fypParam);
      }
    },
    [channelId, uuid, uri, doFetchChannelShorts, doFetchRecommendedContent, doSetShortsPlaylist, doSetShortsViewMode]
  );

  React.useEffect(() => {
    doFetchRecommendedContentRef.current = doFetchRecommendedContent;
    uriRef.current = uri;
    uuidRef.current = uuid;
  });

  React.useEffect(() => {
    if (!hasPlaylist && !hasInitializedPlaylist.current && !isSearchingRecommendations) {
      hasInitializedPlaylist.current = true;
      const fypParam = uuid ? { uuid } : null;
      doFetchRecommendedContent(uri, fypParam);
    }
  }, [hasPlaylist, isSearchingRecommendations, uri, uuid, doFetchRecommendedContent]);

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
    const claim = fileInfo?.claim;
    const claimId = claim?.claim_id;

    if (claimId && hasPlaylist) {
      onRecommendationsLoaded(claimId, shortsRecommendedUris, uuid);
    }
  }, [shortsRecommendedUris, fileInfo, onRecommendationsLoaded, uuid, hasPlaylist]);

  const goToNext = React.useCallback(() => {
    if (!nextRecommendedShort || isAtEnd || isSearchingRecommendations) {
      return;
    }
    clearPosition(uri);
    doNavigateToNextShort(nextRecommendedShort);

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
    doNavigateToNextShort,
    fileInfo,
    onRecommendationClicked,
  ]);

  const goToPrevious = React.useCallback(() => {
    if (!previousRecommendedShort || isAtStart || isSearchingRecommendations) return;

    clearPosition(uri);
    doNavigateToPreviousShort(previousRecommendedShort);
  }, [previousRecommendedShort, isAtStart, isSearchingRecommendations, uri, clearPosition, doNavigateToPreviousShort]);

  const handleInfoButtonClick = React.useCallback(() => {
    if (isMobile) {
      setMobileModalOpen(true);
    } else {
      doToggleShortsSidePanel();
    }
  }, [isMobile, doToggleShortsSidePanel]);

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

  const isSwipeEnabled = !mobileModalOpen;

  if (isMature) {
    return (
      <div className="shorts-page shorts-page--blocked">
        <div className={SHORTS_PLAYER_WRAPPER_CLASS}>
          <FileTitleSection uri={uri} accessStatus={accessStatus} isNsfwBlocked />
        </div>
        <ShortsNavigation
          hasPlaylist={hasPlaylist}
          onNext={goToNext}
          onPrevious={goToPrevious}
          isLoading={isSearchingRecommendations}
          currentIndex={currentIndex}
          totalVideos={shortsRecommendedUris?.length || 0}
          isAtStart={isAtStart}
          isAtEnd={isAtEnd}
        />
      </div>
    );
  }

  return (
    <>
      {channelId && (
        <div className="shorts-page__view-toggle">
          <Button
            className={classnames('button-bubble', {
              'button-bubble--active': localViewMode === 'related',
            })}
            label={__('Related')}
            onClick={() => handleViewModeChange('related')}
          />
          <Button
            className={classnames('button-bubble', {
              'button-bubble--active': localViewMode === 'channel',
            })}
            label={__('From %channel%', { channel: channelName || 'Channel' })}
            onClick={() => handleViewModeChange('channel')}
          />
        </div>
      )}
      <SwipeNavigationPortal
        onPlayPause={handlePlayPause}
        onNext={goToNext}
        onPrevious={goToPrevious}
        isEnabled={isSwipeEnabled && hasPlaylist}
        isMobile={isMobile}
        className="shorts-swipe-overlay"
        sidePanelOpen={sidePanelOpen}
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
              />

              {!isMobile && (
                <ShortsNavigation
                  hasPlaylist={hasPlaylist}
                  onNext={goToNext}
                  onPrevious={goToPrevious}
                  isLoading={isSearchingRecommendations}
                  currentIndex={currentIndex}
                  totalVideos={shortsRecommendedUris?.length || 0}
                  isAtStart={isAtStart}
                  isAtEnd={isAtEnd}
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
            />
          )}
        </div>
      </div>
    </>
  );
}
