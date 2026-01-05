// @flow
import * as React from 'react';
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
import * as SETTINGS from 'constants/settings';
import * as MODALS from 'constants/modal_types';
import { getThumbnailCdnUrl } from 'util/thumbnail';

export const SHORTS_PLAYER_WRAPPER_CLASS = 'shorts-page__video-container';
let ORIGINAL_AUTOPLAY_SETTING = null;

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
  doFileGetForUri: (uri: string) => void,
  webShareable?: boolean,
  collectionId?: string,
  doOpenModal: (id: string, modalProps: any) => void,
  nextThumbnail?: string,
  previousThumbnail?: string,
  doResolveUri: (uri: string) => void,
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
    autoplayMedia,
    doSetClientSetting,
    doFileGetForUri,
    webShareable,
    collectionId,
    doOpenModal,
    nextThumbnail,
    previousThumbnail,
    doResolveUri,
  } = props;

  const {
    location: { search },
  } = useHistory();

  const urlParams = new URLSearchParams(search);
  const isShortFromChannelPage = urlParams.get('from') === 'channel';
  const history = useHistory();
  const isMobile = useIsMobile();
  const shortsContainerRef = React.useRef<any>();
  const [uuid] = React.useState(Uuidv4());
  const [mobileModalOpen, setMobileModalOpen] = React.useState(false);
  const scrollLockRef = React.useRef(false);
  const [localViewMode, setLocalViewMode] = React.useState(
    isShortFromChannelPage ? 'channel' : reduxViewMode || 'related'
  );
  const [panelMode, setPanelMode] = React.useState<'info' | 'comments'>('info');
  const [videoStarted, setVideoStarted] = React.useState(false);
  const { onRecsLoaded: onRecommendationsLoaded, onClickedRecommended: onRecommendationClicked } = RecSys;
  const nextPreviewRef = React.useRef(null);
  const prevPreviewRef = React.useRef(null);

  const hasPlaylist = shortsRecommendedUris && shortsRecommendedUris.length > 0;
  const isAtStart = currentIndex <= 0;
  const isAtEnd = currentIndex >= (shortsRecommendedUris?.length || 1) - 1;
  const hasInitializedRef = React.useRef(false);
  const entryUrlRef = React.useRef(null);
  const isLoadingContent = isSearchingRecommendations || !hasPlaylist;
  const firstShortPlayedRef = React.useRef(false);
  const PRELOAD_BATCH_SIZE = 3;
  const preloadedUrisRef = React.useRef(new Set());
  const isSwipeEnabled = !mobileModalOpen;
  const hasEnsuredViewParam = React.useRef(false);

  if (ORIGINAL_AUTOPLAY_SETTING === null) {
    ORIGINAL_AUTOPLAY_SETTING = autoplayMedia ?? false;
  }

  const isSwipeInsideSidePanel = React.useCallback((clientX, clientY) => {
    const el = document.elementFromPoint(clientX, clientY);
    if (!el) return false;

    return !!el.closest('.shorts-page__side-panel, .shorts-page__side-panel--open');
  }, []);

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

  const handleShareClick = React.useCallback(() => {
    doOpenModal(MODALS.SOCIAL_SHARE, { uri, webShareable, collectionId });
  }, [doOpenModal, uri, webShareable, collectionId]);

  const handleCommentsClick = React.useCallback(() => {
    if (isMobile) {
      setMobileModalOpen(true);
      setPanelMode('comments');
    } else {
      if (sidePanelOpen && panelMode === 'comments') {
        doSetShortsSidePanel(false);
      } else {
        setPanelMode('comments');
        doSetShortsSidePanel(true);
      }
    }
  }, [isMobile, doSetShortsSidePanel, sidePanelOpen, panelMode]);

  const handleInfoButtonClick = React.useCallback(() => {
    if (isMobile) {
      setMobileModalOpen(true);
      setPanelMode('info');
    } else {
      if (sidePanelOpen && panelMode === 'info') {
        doSetShortsSidePanel(false);
      } else {
        setPanelMode('info');
        doSetShortsSidePanel(true);
      }
    }
  }, [isMobile, doSetShortsSidePanel, sidePanelOpen, panelMode]);

  const handleClosePanel = React.useCallback(() => {
    if (isMobile) {
      setMobileModalOpen(false);
    } else {
      doSetShortsSidePanel(false);
    }
  }, [isMobile, doSetShortsSidePanel]);

  React.useEffect(() => {
    if (!shortsRecommendedUris || shortsRecommendedUris.length === 0) return;
    if (currentIndex < 0) return;
    if (!doFileGetForUri) return;
    const currentBatch = Math.floor(currentIndex / PRELOAD_BATCH_SIZE);
    const nextBatchStart = (currentBatch + 1) * PRELOAD_BATCH_SIZE;
    const preloadEndIndex = Math.min(nextBatchStart + PRELOAD_BATCH_SIZE, shortsRecommendedUris.length);
    const urisToPreload = [];

    for (let i = currentIndex + 1; i < preloadEndIndex; i++) {
      const uriToPreload = shortsRecommendedUris[i];
      if (uriToPreload && !preloadedUrisRef.current.has(uriToPreload)) {
        urisToPreload.push(uriToPreload);
        preloadedUrisRef.current.add(uriToPreload);
      }
    }
    urisToPreload.forEach((preloadUri, index) => {
      setTimeout(() => {
        doFileGetForUri(preloadUri);
      }, index * 100);
    });
  }, [currentIndex, shortsRecommendedUris, doFileGetForUri]);

  React.useEffect(() => {
    preloadedUrisRef.current.clear();
  }, [uri]);

  React.useEffect(() => {
    if (nextRecommendedShort && !nextThumbnail) {
      doResolveUri(nextRecommendedShort);
    }
    if (previousRecommendedShort && !previousThumbnail) {
      doResolveUri(previousRecommendedShort);
    }
  }, [nextRecommendedShort, previousRecommendedShort, nextThumbnail, previousThumbnail, doResolveUri]);

  React.useEffect(() => {
    if (nextThumbnail) {
      const img = new Image();
      const src = getThumbnailCdnUrl({ thumbnail: nextThumbnail, isShorts: true });
      if (src) img.src = src;
    }
    if (previousThumbnail) {
      const img = new Image();
      const src = getThumbnailCdnUrl({ thumbnail: previousThumbnail, isShorts: true });
      if (src) img.src = src;
    }
  }, [nextThumbnail, previousThumbnail]);

  React.useEffect(() => {
    const checkVideoPlaying = setInterval(() => {
      const videoEl = document.querySelector('.vjs-tech');
      if (videoEl instanceof HTMLVideoElement && !videoEl.paused) {
        setVideoStarted(true);
        clearInterval(checkVideoPlaying);
      }
    }, 100);

    return () => clearInterval(checkVideoPlaying);
  }, [search, uri]);

  React.useEffect(() => {
    const unlisten = history.listen((location, action) => {
      const currentSearch = history.location?.search || '';
      const nextSearch = location.search || '';

      const currentParams = new URLSearchParams(currentSearch);
      const nextParams = new URLSearchParams(nextSearch);

      const isCurrentlyInShortsPlayer = currentParams.get('view') === 'shorts';
      const isNavigatingToShortsPlayer = nextParams.get('view') === 'shorts';
      const isNavigatingToShortsTab = nextParams.get('view') === 'shortsTab';
      const isNavigatingToHome = location.pathname === '/' && !nextSearch;

      const isBackNavigation = action === 'POP';

      const shouldCleanup =
        (isCurrentlyInShortsPlayer && !isNavigatingToShortsPlayer) ||
        (isCurrentlyInShortsPlayer && isNavigatingToHome) ||
        (isBackNavigation && isCurrentlyInShortsPlayer && isNavigatingToShortsTab) ||
        (isCurrentlyInShortsPlayer && isNavigatingToShortsTab);

      if (shouldCleanup && ORIGINAL_AUTOPLAY_SETTING !== null) {
        doClearShortsPlaylist();
        doSetClientSetting(SETTINGS.AUTOPLAY_MEDIA, ORIGINAL_AUTOPLAY_SETTING);
        firstShortPlayedRef.current = false;
        ORIGINAL_AUTOPLAY_SETTING = null;
      }
    });

    return () => {
      unlisten();

      const currentUrl = history.location?.search || '';
      const currentPath = history.location?.pathname || '/';

      const currentParams = new URLSearchParams(currentUrl);
      const isInShortsPlayer = currentParams.get('view') === 'shorts';
      const isInShortsTab = currentParams.get('view') === 'shortsTab';
      const isHomePage = currentPath === '/' && !currentUrl;

      // restore original autoplay when leaving video shorts player -> channel page
      const shouldCleanupOnUnmount =
        (!isInShortsPlayer && !isInShortsTab) || (!isInShortsPlayer && isInShortsTab) || isHomePage;

      if (shouldCleanupOnUnmount && ORIGINAL_AUTOPLAY_SETTING !== null) {
        doSetClientSetting(SETTINGS.AUTOPLAY_MEDIA, ORIGINAL_AUTOPLAY_SETTING);
        firstShortPlayedRef.current = false;
        doClearShortsPlaylist();
        ORIGINAL_AUTOPLAY_SETTING = null;
      }
    };
  }, [history, doClearShortsPlaylist, doSetClientSetting]);

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

  React.useEffect(() => {
    if (hasEnsuredViewParam.current) return;

    const urlParams = new URLSearchParams(search);
    if (urlParams.get('view') !== 'shorts') {
      urlParams.set('view', 'shorts');
      history.replace(`${history.location.pathname}?${urlParams.toString()}`);
    }
    hasEnsuredViewParam.current = true;
  }, [search, history]);

  const goToNext = React.useCallback(() => {
    if (!nextRecommendedShort || isAtEnd) {
      return;
    }
    scrollLockRef.current = true;

    if (!firstShortPlayedRef.current) {
      firstShortPlayedRef.current = true;
      if (ORIGINAL_AUTOPLAY_SETTING === false && autoPlayNextShort) {
        doSetClientSetting(SETTINGS.AUTOPLAY_MEDIA, true);
      }
    }
    if (ORIGINAL_AUTOPLAY_SETTING === false && !autoPlayNextShort) {
      doSetClientSetting(SETTINGS.AUTOPLAY_MEDIA, autoPlayNextShort);
    }

    if (window.player) window.player.pause();

    if (document.body) document.body.style.overflow = 'hidden';

    const videoEl = document.querySelector('.shorts__viewer') || document.querySelector('.content__cover');
    const overlayEl = document.querySelector('.swipe-navigation-overlay');
    const previewEl = nextPreviewRef.current;

    if (videoEl) {
      const isMobile = window.innerWidth <= 768;
      const videoRect = videoEl.getBoundingClientRect();

      if (previewEl) {
        const videoCenterX = videoRect.left + videoRect.width / 2;
        previewEl.style.position = 'fixed';
        previewEl.style.width = videoRect.width + 'px';
        previewEl.style.height = videoRect.height + 'px';
        previewEl.style.left = videoCenterX + 'px';
        previewEl.style.top = videoRect.bottom + 'px';
        previewEl.style.zIndex = '2';
        previewEl.style.backgroundColor = '#000';
        previewEl.style.transform = 'translate(-50%, 0)';
        if (nextThumbnail && !autoplayMedia) {
          const thumbUrl = getThumbnailCdnUrl({ thumbnail: nextThumbnail, isShorts: true });
          previewEl.style.backgroundImage = `url(${String(thumbUrl)})`;
          previewEl.style.backgroundSize = 'cover';
          previewEl.style.backgroundPosition = 'center';
        } else {
          previewEl.style.backgroundImage = 'none';
        }
        void previewEl.offsetHeight;
        previewEl.style.transition = 'transform 0.3s ease';
      }

      videoEl.style.setProperty('transition', 'transform 0.3s ease', 'important');
      if (overlayEl) overlayEl.style.setProperty('transition', 'transform 0.3s ease', 'important');
      void videoEl.offsetHeight;

      requestAnimationFrame(() => {
        const videoTranslateY = -(videoRect.height + videoRect.top);
        const previewTranslateY = -videoRect.height;
        if (isMobile) {
          videoEl.style.setProperty('transform', `translateY(${videoTranslateY}px)`, 'important');
          if (previewEl) previewEl.style.transform = `translate(-50%, ${previewTranslateY}px)`;
          if (overlayEl) overlayEl.style.setProperty('transform', `translateY(${videoTranslateY}px)`, 'important');
        } else {
          const computedStyle = window.getComputedStyle(videoEl);
          // $FlowFixMe
          const matrix = new DOMMatrix(computedStyle.transform);
          const currentXpx = matrix.m41;
          videoEl.style.setProperty('transform', `translate(${currentXpx}px, ${videoTranslateY}px)`, 'important');
          if (previewEl) previewEl.style.transform = `translate(-50%, ${previewTranslateY}px)`;
          if (overlayEl) {
            // $FlowFixMe
            const overlayMatrix = new DOMMatrix(window.getComputedStyle(overlayEl).transform);
            overlayEl.style.setProperty(
              'transform',
              `translate(${overlayMatrix.m41}px, ${videoTranslateY}px)`,
              'important'
            );
          }
        }
      });
    }

    setTimeout(() => {
      clearPosition(uri);
      const shortsUrl = nextRecommendedShort.replace('lbry://', '/').replace(/#/g, ':') + '?view=shorts';
      history.replace(shortsUrl);

      const claim = fileInfo?.claim;
      const currentClaimId = claim?.claim_id;
      if (currentClaimId) {
        const nextClaimId = nextRecommendedShort.split('#')[1] || nextRecommendedShort.split('/').pop();
        onRecommendationClicked(currentClaimId, nextClaimId);
      }

      setTimeout(() => {
        const newVideoEl = document.querySelector('.shorts__viewer') || document.querySelector('.content__cover');
        const newOverlayEl = document.querySelector('.swipe-navigation-overlay');

        if (newVideoEl) {
          newVideoEl.style.removeProperty('transform');
          newVideoEl.style.removeProperty('transition');
        }
        if (newOverlayEl) {
          newOverlayEl.style.removeProperty('transform');
          newOverlayEl.style.removeProperty('transition');
        }
        if (previewEl) {
          previewEl.style.cssText = 'position: fixed; top: -9999px; left: -9999px;';
        }
        scrollLockRef.current = false;
        if (document.body) document.body.style.overflow = '';
      }, 100);
    }, 350);
  }, [
    nextRecommendedShort,
    isAtEnd,
    uri,
    clearPosition,
    history,
    fileInfo,
    onRecommendationClicked,
    autoPlayNextShort,
    doSetClientSetting,
    nextThumbnail,
    autoplayMedia,
  ]);

  const goToPrevious = React.useCallback(() => {
    if (!previousRecommendedShort || isAtStart) return;

    if (window.player) window.player.pause();

    if (document.body) document.body.style.overflow = 'hidden';

    const videoEl = document.querySelector('.shorts__viewer') || document.querySelector('.content__cover');
    const overlayEl = document.querySelector('.swipe-navigation-overlay');
    const previewEl = prevPreviewRef.current;

    if (videoEl) {
      const isMobile = window.innerWidth <= 768;
      const videoRect = videoEl.getBoundingClientRect();

      if (previewEl) {
        const videoCenterX = videoRect.left + videoRect.width / 2;
        previewEl.style.position = 'fixed';
        previewEl.style.width = videoRect.width + 'px';
        previewEl.style.height = videoRect.height + 'px';
        previewEl.style.left = videoCenterX + 'px';
        previewEl.style.top = videoRect.top - videoRect.height + 'px';
        previewEl.style.zIndex = '2';
        previewEl.style.backgroundColor = '#000';
        previewEl.style.transform = 'translate(-50%, 0)';
        if (previousThumbnail && !autoplayMedia) {
          const thumbUrl = getThumbnailCdnUrl({ thumbnail: previousThumbnail, isShorts: true });
          previewEl.style.backgroundImage = `url(${String(thumbUrl)})`;
          previewEl.style.backgroundSize = 'cover';
          previewEl.style.backgroundPosition = 'center';
        } else {
          previewEl.style.backgroundImage = 'none';
        }
        void previewEl.offsetHeight;
        previewEl.style.transition = 'transform 0.3s ease';
      }

      videoEl.style.setProperty('transition', 'transform 0.3s ease', 'important');
      if (overlayEl) overlayEl.style.setProperty('transition', 'transform 0.3s ease', 'important');
      void videoEl.offsetHeight;

      requestAnimationFrame(() => {
        const videoTranslateY = window.innerHeight - videoRect.top;
        const previewTranslateY = videoRect.height;
        if (isMobile) {
          videoEl.style.setProperty('transform', `translateY(${videoTranslateY}px)`, 'important');
          if (previewEl) previewEl.style.transform = `translate(-50%, ${previewTranslateY}px)`;
          if (overlayEl) overlayEl.style.setProperty('transform', `translateY(${videoTranslateY}px)`, 'important');
        } else {
          const computedStyle = window.getComputedStyle(videoEl);
          // $FlowFixMe
          const matrix = new DOMMatrix(computedStyle.transform);
          const currentXpx = matrix.m41;
          videoEl.style.setProperty('transform', `translate(${currentXpx}px, ${videoTranslateY}px)`, 'important');
          if (previewEl) previewEl.style.transform = `translate(-50%, ${previewTranslateY}px)`;
          if (overlayEl) {
            // $FlowFixMe
            const overlayMatrix = new DOMMatrix(window.getComputedStyle(overlayEl).transform);
            overlayEl.style.setProperty(
              'transform',
              `translate(${overlayMatrix.m41}px, ${videoTranslateY}px)`,
              'important'
            );
          }
        }
      });
    }

    setTimeout(() => {
      clearPosition(uri);
      const shortsUrl = previousRecommendedShort.replace('lbry://', '/').replace(/#/g, ':') + '?view=shorts';
      history.replace(shortsUrl);

      setTimeout(() => {
        const newVideoEl = document.querySelector('.shorts__viewer') || document.querySelector('.content__cover');
        const newOverlayEl = document.querySelector('.swipe-navigation-overlay');

        if (newVideoEl) {
          newVideoEl.style.removeProperty('transform');
          newVideoEl.style.removeProperty('transition');
        }
        if (newOverlayEl) {
          newOverlayEl.style.removeProperty('transform');
          newOverlayEl.style.removeProperty('transition');
        }
        if (previewEl) {
          previewEl.style.cssText = 'position: fixed; top: -9999px; left: -9999px;';
        }
        if (document.body) document.body.style.overflow = '';
      }, 100);
    }, 350);
  }, [previousRecommendedShort, isAtStart, uri, clearPosition, history, previousThumbnail, autoplayMedia]);

  const handleScroll = React.useCallback(
    (e) => {
      if (mobileModalOpen) return;
      if (scrollLockRef.current) return;

      const { clientX, clientY } = e;

      if (isSwipeInsideSidePanel(clientX, clientY)) {
        scrollLockRef.current = false;
        return e.stopPropagation();
      }
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
    [goToNext, goToPrevious, mobileModalOpen, isSwipeInsideSidePanel]
  );

  React.useEffect(() => {
    const container = shortsContainerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleScroll, { passive: false });
    return () => container.removeEventListener('wheel', handleScroll);
  }, [handleScroll]);

  return (
    <>
      <div ref={nextPreviewRef} className="shorts-preview shorts-preview--next" />
      <div ref={prevPreviewRef} className="shorts-preview shorts-preview--prev" />
      {videoStarted && (
        <SwipeNavigationPortal
          onNext={goToNext}
          onPrevious={goToPrevious}
          isEnabled={isSwipeEnabled && hasPlaylist}
          isMobile={isMobile}
          className="shorts-swipe-overlay"
          sidePanelOpen={sidePanelOpen}
          showViewToggle={!!channelId}
          viewMode={localViewMode}
          channelName={channelName}
          setLocalViewMode={setLocalViewMode}
          doSetShortsViewMode={doSetShortsViewMode}
          doSetShortsPlaylist={doSetShortsPlaylist}
          fetchForMode={fetchForMode}
          title={title}
          channelUri={channelUri}
          thumbnailUrl={thumbnail}
          hasChannel={!!channelId}
          hasPlaylist={hasPlaylist}
          uri={uri}
          autoPlayNextShort={autoPlayNextShort}
          doToggleShortsAutoplay={doToggleShortsAutoplay}
          onInfoButtonClick={handleInfoButtonClick}
          onCommentsClick={handleCommentsClick}
          isComments={panelMode === 'comments'}
          handleShareClick={handleShareClick}
        />
      )}
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
                nextRecommendedShort={nextRecommendedShort}
                autoPlayNextShort={autoPlayNextShort}
                isAtEnd={isAtEnd}
                onSwipeNext={goToNext}
                onSwipePrevious={goToPrevious}
                enableSwipe={isSwipeEnabled}
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
                  handleShareClick={handleShareClick}
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
              isComments={panelMode === 'comments'}
            />
          )}
        </div>
      </div>
    </>
  );
}
