// @flow
import * as React from 'react';
import { createPortal } from 'react-dom';
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
import { FYP_ID } from 'constants/urlParams';
import { getThumbnailCdnUrl } from 'util/thumbnail';
import { useOnResize } from 'effects/use-on-resize';
import classnames from 'classnames';
import ChannelThumbnail from 'component/channelThumbnail';
import { Link } from 'react-router-dom';
import ViewModeToggle from 'component/shortsActions/swipeNavigation/viewModeToggle';

export const SHORTS_PLAYER_WRAPPER_CLASS = 'shorts-page__video-container';
const REEL_TRANSITION_MS = 320;
const REEL_NAVIGATION_FALLBACK_MS = 1200;

type ReelDirection = 'next' | 'previous';

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
  channelDisplayName: ?string,
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
  doClearPlayingUri: () => void,
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
    channelDisplayName,
    doFetchChannelShorts,
    viewMode: reduxViewMode,
    doSetShortsViewMode,
    title,
    channelUri,
    thumbnail,
    autoPlayNextShort,
    doToggleShortsAutoplay,
    autoplayMedia,
    claimId,
    doSetClientSetting,
    doFileGetForUri,
    webShareable,
    collectionId,
    doOpenModal,
    nextThumbnail,
    previousThumbnail,
    doResolveUri,
    doClearPlayingUri,
  } = props;

  const {
    location: { search },
  } = useHistory();

  const urlParams = new URLSearchParams(search);
  const isShortFromChannelPage = urlParams.get('from') === 'channel';
  const history = useHistory();
  const isMobile = useIsMobile();
  const shortsContainerRef = React.useRef<any>();
  const fypId = urlParams.get(FYP_ID);
  const [uuid] = React.useState(fypId ? Uuidv4() : '');
  const [mobileModalOpen, setMobileModalOpen] = React.useState(false);
  const wheelLockRef = React.useRef(false);
  const [localViewMode, setLocalViewMode] = React.useState(
    isShortFromChannelPage ? 'channel' : reduxViewMode || 'related'
  );
  const [panelMode, setPanelMode] = React.useState<'info' | 'comments'>('info');
  const [videoStarted, setVideoStarted] = React.useState(false);
  const { onRecsLoaded: onRecommendationsLoaded, onClickedRecommended: onRecommendationClicked } = RecSys;
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [transitionDirection, setTransitionDirection] = React.useState<?ReelDirection>(null);
  const [transitionThumbnailUrl, setTransitionThumbnailUrl] = React.useState<?string>(null);
  const transitionQueueRef = React.useRef<Array<ReelDirection>>([]);
  const transitionTimerRef = React.useRef<?TimeoutID>(null);
  const transitionFallbackTimerRef = React.useRef<?TimeoutID>(null);
  const activeTransitionRef = React.useRef<?{ sourceUri: string, targetUri: string, direction: ReelDirection }>(null);
  const isTransitioningRef = React.useRef(false);
  const processNextTransitionRef = React.useRef<any>(() => {});
  const finishTransitionRef = React.useRef<any>(() => {});

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

  const setShortViewerWidthFromVideo = React.useCallback(() => {
    // $FlowFixMe
    const video = document.querySelector('.shorts__viewer')?.querySelector('video');
    if (!(video instanceof HTMLVideoElement)) return;
    const videoW = video?.videoWidth;
    const videoH = video?.videoHeight;
    if (!videoW || !videoH) return;

    const maxHeight = window.innerHeight * 0.9;

    const scale = maxHeight / videoH;
    const computedWidthPx = videoW * scale;

    // Convert to vw (viewport width %)
    const maxWidthPx = window.innerWidth - 240;
    const maxWidthVW = (maxWidthPx / window.innerWidth) * 100;
    const maxWidth = sidePanelOpen ? 30 : Math.min(maxWidthVW, 80);
    const widthVW = (computedWidthPx / window.innerWidth) * 100;
    const clampedVW = Math.min(widthVW, maxWidth); // Avoid overflow

    requestAnimationFrame(() => {
      // $FlowFixMe
      document.documentElement?.style?.setProperty('--shorts-viewer-width', `${clampedVW}vw`);
    });
  }, [sidePanelOpen]);

  useOnResize(setShortViewerWidthFromVideo);

  const isSwipeInsideSidePanel = React.useCallback((clientX, clientY) => {
    const el = document.elementFromPoint(clientX, clientY);
    if (!el) return false;

    return !!el.closest('.shorts-page__side-panel, .shorts-page__side-panel--open');
  }, []);

  const fetchForMode = React.useCallback(
    (mode) => {
      const fypParam = fypId && uuid ? { gid: fypId, uuid } : null;
      if (mode === 'channel' && channelId) {
        doFetchChannelShorts(channelId);
      } else {
        doFetchShortsRecommendedContent(uri, fypParam);
      }
    },
    [channelId, uri, uuid, fypId, doFetchChannelShorts, doFetchShortsRecommendedContent]
  );

  const handleViewModeChange = React.useCallback(
    (mode) => {
      setLocalViewMode(mode);
      doSetShortsViewMode(mode);
      doSetShortsPlaylist([]);
      fetchForMode(mode);
    },
    [doSetShortsViewMode, doSetShortsPlaylist, fetchForMode, setLocalViewMode]
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

  const handledLinkedCommentIdRef = React.useRef(null);
  React.useEffect(() => {
    if (linkedCommentId && linkedCommentId !== handledLinkedCommentIdRef.current) {
      handledLinkedCommentIdRef.current = linkedCommentId;
      if (isMobile) {
        setMobileModalOpen(true);
        setPanelMode('comments');
      } else {
        setPanelMode('comments');
        doSetShortsSidePanel(true);
      }
    }
  }, [linkedCommentId, isMobile, doSetShortsSidePanel]);

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
    let timeoutId;
    function loop() {
      // $FlowFixMe
      const video = document.querySelector('.shorts__viewer')?.querySelector('video');
      if (!(video instanceof HTMLVideoElement) || !video?.videoWidth || !video?.videoHeight) {
        timeoutId = setTimeout(loop, 300);
        return;
      }
      setShortViewerWidthFromVideo();
    }

    timeoutId = setTimeout(loop, 300);

    return () => clearTimeout(timeoutId);
  }, [uri, setShortViewerWidthFromVideo]);

  React.useEffect(() => {
    setShortViewerWidthFromVideo();
  }, [sidePanelOpen, setShortViewerWidthFromVideo]);

  React.useEffect(() => {
    hasInitializedRef.current = false;
  }, [uri]);

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
    if (claimId && hasPlaylist) {
      onRecommendationsLoaded(claimId, shortsRecommendedUris, uuid);
    }
  }, [shortsRecommendedUris, claimId, onRecommendationsLoaded, uuid, hasPlaylist]);

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

  const getShortsUrl = React.useCallback((shortUri: string) => {
    return shortUri.replace('lbry://', '/').replace(/#/g, ':') + '?view=shorts';
  }, []);

  const clearTransitionTimers = React.useCallback(() => {
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    if (transitionFallbackTimerRef.current) {
      clearTimeout(transitionFallbackTimerRef.current);
      transitionFallbackTimerRef.current = null;
    }
  }, []);

  const finishTransition = React.useCallback(
    (shouldContinueQueue: boolean = true) => {
      clearTransitionTimers();
      activeTransitionRef.current = null;
      isTransitioningRef.current = false;
      setIsTransitioning(false);
      setTransitionDirection(null);
      setTransitionThumbnailUrl(null);

      if (document.body) {
        document.body.style.overflow = '';
      }

      if (shouldContinueQueue) {
        requestAnimationFrame(() => {
          processNextTransitionRef.current();
        });
      }
    },
    [clearTransitionTimers]
  );
  finishTransitionRef.current = finishTransition;

  const processNextQueuedTransition = React.useCallback(() => {
    if (isTransitioningRef.current) return;

    while (transitionQueueRef.current.length > 0) {
      const direction = transitionQueueRef.current.shift();
      if (!direction) continue;

      const targetUri = direction === 'next' ? nextRecommendedShort : previousRecommendedShort;
      if (!targetUri) continue;

      const transitionThumb = direction === 'next' ? nextThumbnail : previousThumbnail;
      const previewSrc =
        transitionThumb && !autoplayMedia ? getThumbnailCdnUrl({ thumbnail: transitionThumb, isShorts: true }) : null;

      isTransitioningRef.current = true;
      activeTransitionRef.current = { sourceUri: uri, targetUri, direction };
      setIsTransitioning(true);
      setTransitionDirection(direction);
      setTransitionThumbnailUrl(previewSrc || null);
      clearTransitionTimers();

      if (window.player) {
        window.player.pause();
      }
      if (document.body) {
        document.body.style.overflow = 'hidden';
      }

      transitionTimerRef.current = setTimeout(() => {
        const activeTransition = activeTransitionRef.current;
        if (!activeTransition) return;

        clearPosition(activeTransition.sourceUri);
        doClearPlayingUri();
        history.replace(getShortsUrl(activeTransition.targetUri));

        if (activeTransition.direction === 'next' && claimId) {
          const nextClaimId =
            activeTransition.targetUri.split('#').pop() || activeTransition.targetUri.split('/').pop();
          onRecommendationClicked(claimId, nextClaimId);
        }

        transitionFallbackTimerRef.current = setTimeout(() => {
          transitionQueueRef.current = [];
          finishTransitionRef.current(false);
        }, REEL_NAVIGATION_FALLBACK_MS);
      }, REEL_TRANSITION_MS);
      break;
    }
  }, [
    nextRecommendedShort,
    previousRecommendedShort,
    nextThumbnail,
    previousThumbnail,
    autoplayMedia,
    uri,
    clearTransitionTimers,
    clearPosition,
    history,
    getShortsUrl,
    claimId,
    onRecommendationClicked,
    doClearPlayingUri,
  ]);
  processNextTransitionRef.current = processNextQueuedTransition;

  const queueTransition = React.useCallback((direction: ReelDirection) => {
    transitionQueueRef.current.push(direction);
    processNextTransitionRef.current();
  }, []);

  const goToNext = React.useCallback(() => {
    if (!isTransitioningRef.current && (!nextRecommendedShort || isAtEnd)) {
      return;
    }

    if (!firstShortPlayedRef.current) {
      firstShortPlayedRef.current = true;
      if (ORIGINAL_AUTOPLAY_SETTING === false && autoPlayNextShort) {
        doSetClientSetting(SETTINGS.AUTOPLAY_MEDIA, true);
      }
    }
    if (ORIGINAL_AUTOPLAY_SETTING === false && !autoPlayNextShort) {
      doSetClientSetting(SETTINGS.AUTOPLAY_MEDIA, autoPlayNextShort);
    }

    queueTransition('next');
  }, [nextRecommendedShort, isAtEnd, autoPlayNextShort, doSetClientSetting, queueTransition]);

  const goToPrevious = React.useCallback(() => {
    if (!isTransitioningRef.current && (!previousRecommendedShort || isAtStart)) return;
    queueTransition('previous');
  }, [previousRecommendedShort, isAtStart, queueTransition]);

  React.useEffect(() => {
    const activeTransition = activeTransitionRef.current;
    if (!activeTransition) return;
    if (uri !== activeTransition.sourceUri) {
      finishTransitionRef.current();
    }
  }, [uri]);

  React.useEffect(() => {
    return () => {
      transitionQueueRef.current = [];
      clearTransitionTimers();
      activeTransitionRef.current = null;
      isTransitioningRef.current = false;
      if (document.body) {
        document.body.style.overflow = '';
      }
    };
  }, [clearTransitionTimers]);

  const handleScroll = React.useCallback(
    (e) => {
      if (mobileModalOpen || wheelLockRef.current) return;

      const { clientX, clientY } = e;
      if (isSwipeInsideSidePanel(clientX, clientY)) {
        return e.stopPropagation();
      }
      if (Math.abs(e.deltaY) < 8) return;

      e.preventDefault();
      wheelLockRef.current = true;
      if (e.deltaY > 0) {
        goToNext();
      } else {
        goToPrevious();
      }

      setTimeout(() => {
        wheelLockRef.current = false;
      }, 120);
    },
    [goToNext, goToPrevious, mobileModalOpen, isSwipeInsideSidePanel]
  );

  React.useEffect(() => {
    const container = shortsContainerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleScroll, { passive: false });
    return () => container.removeEventListener('wheel', handleScroll);
  }, [handleScroll]);

  const transitionPreviewStyle = transitionThumbnailUrl
    ? {
        backgroundImage: `url(${String(transitionThumbnailUrl)})`,
      }
    : undefined;
  const transitionPreviewTarget = typeof document !== 'undefined' ? document.body : null;

  return (
    <>
      {videoStarted && (
        <SwipeNavigationPortal
          onNext={goToNext}
          onPrevious={goToPrevious}
          isEnabled={isSwipeEnabled && hasPlaylist}
          isMobile={isMobile}
          className="shorts-swipe-overlay"
          sidePanelOpen={sidePanelOpen}
          thumbnailUrl={thumbnail}
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
      {transitionPreviewTarget &&
        createPortal(
          <div
            className={classnames('shorts-transition-preview', {
              'shorts-transition-preview--next': isTransitioning && transitionDirection === 'next',
              'shorts-transition-preview--previous': isTransitioning && transitionDirection === 'previous',
              'shorts-transition-preview--panel-open': sidePanelOpen,
            })}
            style={transitionPreviewStyle}
          />,
          transitionPreviewTarget
        )}
      {transitionPreviewTarget &&
        createPortal(
          <div
            className={classnames('shorts-transition-current', {
              'shorts-transition-current--next': isTransitioning && transitionDirection === 'next',
              'shorts-transition-current--previous': isTransitioning && transitionDirection === 'previous',
              'shorts-transition-current--panel-open': sidePanelOpen,
            })}
            style={
              thumbnail
                ? { backgroundImage: `url(${String(getThumbnailCdnUrl({ thumbnail, isShorts: true }))})` }
                : undefined
            }
          />,
          transitionPreviewTarget
        )}
      {channelName &&
        typeof document !== 'undefined' &&
        (() => {
          const el = document.querySelector('.shorts__viewer');
          if (!el) return null;
          return createPortal(
            <>
              <div className="shorts-viewer__content-info">
                {channelUri && (
                  <Link
                    to={channelUri.replace('lbry://', '/').replace(/#/g, ':')}
                    className="shorts-viewer__channel"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ChannelThumbnail uri={channelUri} xsmall checkMembership={false} />
                    <span className="shorts-viewer__channel-name">{channelDisplayName || channelName}</span>
                  </Link>
                )}
                <span className="shorts-viewer__title">{title}</span>
              </div>
              {channelId && (
                <ViewModeToggle
                  viewMode={localViewMode}
                  channelName={channelName}
                  onViewModeChange={handleViewModeChange}
                />
              )}
            </>,
            el
          );
        })()}
      <div
        className={classnames('shorts-page', { 'shorts-page--transitioning': isTransitioning })}
        ref={shortsContainerRef}
      >
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
