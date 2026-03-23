import * as React from 'react';
import { createPortal } from 'react-dom';
import { createSelector } from 'reselect';
import { useIsShortsMobile } from 'effects/use-screensize';
import RecSys from 'recsys';
import { v4 as Uuidv4 } from 'uuid';
import { PRIMARY_PLAYER_WRAPPER_CLASS } from '../videoPlayers/view';
import ShortsActions from 'component/shortsActions';
import ShortsVideoPlayer from 'component/shortsVideoPlayer';
import ShortsSidePanel from 'component/shortsSidePanel';
import MobilePanel from 'component/shortsMobileSidePanel';
import SwipeNavigationPortal from 'component/shortsActions/swipeNavigation';
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { LINKED_COMMENT_QUERY_PARAM, THREAD_COMMENT_QUERY_PARAM } from 'constants/comment';
import * as MODALS from 'constants/modal_types';
import * as TAGS from 'constants/tags';
import * as SETTINGS_CONST from 'constants/settings';
import { FYP_ID } from 'constants/urlParams';
import { getThumbnailCdnUrl } from 'util/thumbnail';
import { useOnResize } from 'effects/use-on-resize';
import classnames from 'classnames';
import ChannelThumbnail from 'component/channelThumbnail';
import { Link } from 'react-router-dom';
import ViewModeToggle from 'component/shortsActions/swipeNavigation/viewModeToggle';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { getChannelIdFromClaim, createNormalizedClaimSearchKey, isClaimShort as isClaimShortUtil } from 'util/claim';
import { doFileGetForUri as doFileGetForUriAction } from 'redux/actions/file';
import {
  selectClaimIsNsfwForUri,
  selectClaimForUri,
  makeSelectTagInClaimOrChannelForUri,
  selectClaimSearchByQuery,
  selectTitleForUri,
} from 'redux/selectors/claims';
import {
  selectContentPositionForUri,
  selectPlayingCollectionId,
  selectIsUriCurrentlyPlaying,
  selectIsAutoplayCountdownForUri,
} from 'redux/selectors/content';
import { selectCommentsListTitleForUri, selectCommentsDisabledSettingForChannelId } from 'redux/selectors/comments';
import { selectNoRestrictionOrUserIsMemberForContentClaimId } from 'redux/selectors/memberships';
import {
  clearPosition as clearPositionAction,
  doClearPlayingUri as doClearPlayingUriAction,
} from 'redux/actions/content';
import { selectIsSearching } from 'redux/selectors/search';
import { selectClientSetting } from 'redux/selectors/settings';
import { selectShortsSidePanelOpen, selectShortsPlaylist, selectShortsViewMode } from 'redux/selectors/shorts';
import {
  doSetShortsSidePanel as doSetShortsSidePanelAction,
  doToggleShortsSidePanel,
  doSetShortsPlaylist as doSetShortsPlaylistAction,
  doSetShortsViewMode as doSetShortsViewModeAction,
  doSetShortsAutoplay as doSetShortsAutoplayAction,
  doClearShortsPlaylist as doClearShortsPlaylistAction,
} from 'redux/actions/shorts';
import { doClaimSearch as doClaimSearchAction, doResolveUri as doResolveUriAction } from 'redux/actions/claims';
import { toggleAutoplayNextShort } from 'redux/actions/settings';
import { doFetchShortsRecommendedContent as doFetchShortsRecommendedContentAction } from 'redux/actions/search';
import { doOpenModal as doOpenModalAction } from 'redux/actions/app';

const EMPTY_ARRAY: string[] = [];

const selectShortsRelatedUris = (state: any, uri: string) => {
  if (!uri) return EMPTY_ARRAY;
  const claim = selectClaimForUri(state, uri);
  if (!claim?.value?.title) return EMPTY_ARRAY;
  const searchResults = state.search.resultsByQuery;
  const titleEncoded = encodeURIComponent(claim.value.title);

  for (const queryKey in searchResults) {
    if (
      queryKey.includes(`s=${titleEncoded}`) &&
      queryKey.includes(`max_aspect_ratio=${SETTINGS_CONST.SHORTS_ASPECT_RATIO_LTE}`)
    ) {
      return searchResults[queryKey]?.uris || EMPTY_ARRAY;
    }
  }

  return EMPTY_ARRAY;
};

const selectShortsChannelUris = createSelector(
  (state: any, uri: string) => {
    const claim = selectClaimForUri(state, uri);
    const channelId = getChannelIdFromClaim(claim);
    if (!channelId) return undefined;
    const searchKey = createNormalizedClaimSearchKey({
      channel_ids: [channelId],
      duration: `<=${SETTINGS_CONST.SHORTS_DURATION_LTE}`,
      content_aspect_ratio: `<=${SETTINGS_CONST.SHORTS_ASPECT_RATIO_LTE}`,
      order_by: ['release_time'],
      page_size: 50,
      page: 1,
      claim_type: ['stream'],
      has_source: true,
    });
    return selectClaimSearchByQuery(state)[searchKey];
  },
  (state: any) => state,
  (claimSearchResults, state) => {
    if (!claimSearchResults) return EMPTY_ARRAY;
    return claimSearchResults.map((u: string) => {
      const c = selectClaimForUri(state, u);
      return c?.permanent_url;
    });
  }
);

const selectShortsRecommendedContent = (state: any, uri: string) => {
  const shortsPlaylist = selectShortsPlaylist(state);
  if (shortsPlaylist.length > 0) return shortsPlaylist;
  const viewMode = selectShortsViewMode(state);
  return viewMode === 'channel' ? selectShortsChannelUris(state, uri) : selectShortsRelatedUris(state, uri);
};
export const SHORTS_PLAYER_WRAPPER_CLASS = 'shorts-page__video-container';
const REEL_TRANSITION_MS = 320;
const REEL_NAVIGATION_FALLBACK_MS = 1200;
type ReelDirection = 'next' | 'previous';
type Props = {
  uri: string;
  accessStatus: string | null | undefined;
  collectionId?: string;
};
export default function ShortsPage(props: Props) {
  const { uri, accessStatus, collectionId } = props;
  const dispatch = useAppDispatch();
  const claim = useAppSelector((state) => selectClaimForUri(state, uri));
  const channelId = getChannelIdFromClaim(claim);
  const claimId = claim?.claim_id;
  const commentSettingDisabled = useAppSelector((state) => selectCommentsDisabledSettingForChannelId(state, channelId));
  const shortsRecommendedUris = useAppSelector((state) => selectShortsRecommendedContent(state, uri));
  const currentIndex = shortsRecommendedUris.findIndex((shortUri: string) => shortUri === uri);
  const title = claim?.value?.title;
  const channelUri = claim?.signing_channel?.canonical_url || claim?.signing_channel?.permanent_url;
  const thumbnail = claim?.value?.thumbnail?.url || claim?.value?.thumbnail || null;
  const nextShortUri =
    currentIndex >= 0 && currentIndex < shortsRecommendedUris.length - 1
      ? shortsRecommendedUris[currentIndex + 1]
      : null;
  const prevShortUri = currentIndex > 0 ? shortsRecommendedUris[currentIndex - 1] : null;
  const nextShortClaimValue = useAppSelector((state) =>
    nextShortUri ? selectClaimForUri(state, nextShortUri) : null
  );
  const prevShortClaimValue = useAppSelector((state) =>
    prevShortUri ? selectClaimForUri(state, prevShortUri) : null
  );
  const nextThumbnail = nextShortClaimValue?.value?.thumbnail?.url || null;
  const previousThumbnail = prevShortClaimValue?.value?.thumbnail?.url || null;
  const commentsListTitle = useAppSelector((state) => selectCommentsListTitleForUri(state, uri));
  const isMature = useAppSelector((state) => selectClaimIsNsfwForUri(state, uri));
  const isUriPlaying = useAppSelector((state) => selectIsUriCurrentlyPlaying(state, uri));
  const playingCollectionId = useAppSelector(selectPlayingCollectionId);
  const position = useAppSelector((state) => selectContentPositionForUri(state, uri));
  const commentsDisabledTag = useAppSelector((state) =>
    makeSelectTagInClaimOrChannelForUri(uri, TAGS.DISABLE_COMMENTS_TAG)(state)
  );
  const commentsDisabled = commentSettingDisabled || commentsDisabledTag;
  const contentUnlockedValue = useAppSelector((state) =>
    claimId ? selectNoRestrictionOrUserIsMemberForContentClaimId(state, claimId) : undefined
  );
  const contentUnlocked = claimId && contentUnlockedValue;
  const isAutoplayCountdownForUri = useAppSelector((state) => selectIsAutoplayCountdownForUri(state, uri));
  const sidePanelOpen = useAppSelector(selectShortsSidePanelOpen);
  const nextRecommendedShort =
    currentIndex >= 0 && currentIndex < shortsRecommendedUris.length - 1
      ? shortsRecommendedUris[currentIndex + 1]
      : null;
  const previousRecommendedShort = currentIndex > 0 ? shortsRecommendedUris[currentIndex - 1] : null;
  const channelName = claim?.signing_channel?.name;
  const channelDisplayName = channelUri
    ? useAppSelector((state) => selectTitleForUri(state, channelUri)) || claim?.signing_channel?.name
    : claim?.signing_channel?.name;
  const isSearchingRecommendations = useAppSelector(selectIsSearching);
  const searchInLanguage = useAppSelector((state) => selectClientSetting(state, SETTINGS_CONST.SEARCH_IN_LANGUAGE));
  const reduxViewMode = useAppSelector(selectShortsViewMode);
  const autoPlayNextShort = useAppSelector((state) => selectClientSetting(state, SETTINGS_CONST.AUTOPLAY_NEXT_SHORTS));
  const disableShortsView = useAppSelector((state) => selectClientSetting(state, SETTINGS_CONST.DISABLE_SHORTS_VIEW));
  const isClaimShortValue = isClaimShortUtil(claim);
  const webShareable = true;

  const clearPosition = (u: string) => dispatch(clearPositionAction(u));
  const doClearPlayingUri = () => dispatch(doClearPlayingUriAction());
  const doSetShortsSidePanel = (isOpen: boolean) => dispatch(doSetShortsSidePanelAction(isOpen));
  const doFetchShortsRecommendedContent = (u: string, fypParam?: FypParam | null) =>
    dispatch(doFetchShortsRecommendedContentAction(u, fypParam));
  const doFetchChannelShorts = (chId: string) => {
    return dispatch(
      doClaimSearchAction({
        channel_ids: [chId],
        duration: `<=${SETTINGS_CONST.SHORTS_DURATION_LTE}`,
        content_aspect_ratio: `<=${SETTINGS_CONST.SHORTS_ASPECT_RATIO_LTE}`,
        order_by: ['release_time'],
        page_size: 50,
        page: 1,
        claim_type: ['stream'],
        has_source: true,
      })
    );
  };
  const doFileGetForUri = (u: string) => dispatch(doFileGetForUriAction(u));
  const doSetShortsPlaylist = (uris: Array<string>) => dispatch(doSetShortsPlaylistAction(uris));
  const doSetShortsViewMode = (mode: string) => dispatch(doSetShortsViewModeAction(mode));
  const doToggleShortsAutoplay = () => dispatch(toggleAutoplayNextShort());
  const doClearShortsPlaylist = () => dispatch(doClearShortsPlaylistAction());
  const doOpenModal = (id: string, modalProps: any) => dispatch(doOpenModalAction(id, modalProps));
  const doResolveUri = (u: string) => dispatch(doResolveUriAction(u));
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const location = useLocation();
  const { pathname, search } = location;
  const urlParams = new URLSearchParams(search);
  const linkedCommentId = urlParams.get(LINKED_COMMENT_QUERY_PARAM) || undefined;
  const threadCommentId = urlParams.get(THREAD_COMMENT_QUERY_PARAM) || undefined;
  const isShortFromChannelPage = urlParams.get('from') === 'channel';
  const isMobile = useIsShortsMobile();
  const shortsContainerRef = React.useRef<any>();
  const fypId = urlParams.get(FYP_ID);
  const [uuid] = React.useState(fypId ? Uuidv4() : '');
  const wheelLockRef = React.useRef(false);
  const [localViewMode, setLocalViewMode] = React.useState(
    isShortFromChannelPage ? 'channel' : reduxViewMode || 'related'
  );
  const [panelMode, setPanelMode] = React.useState<'info' | 'comments'>('info');
  const { onRecsLoaded: onRecommendationsLoaded, onClickedRecommended: onRecommendationClicked } = RecSys;
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [transitionDirection, setTransitionDirection] = React.useState<ReelDirection | null | undefined>(null);
  const [transitionThumbnailUrl, setTransitionThumbnailUrl] = React.useState<string | null | undefined>(null);
  const transitionQueueRef = React.useRef<Array<ReelDirection>>([]);
  const transitionTimerRef = React.useRef<TimeoutID | null | undefined>(null);
  const transitionFallbackTimerRef = React.useRef<TimeoutID | null | undefined>(null);
  const activeTransitionRef = React.useRef<
    | {
        sourceUri: string;
        targetUri: string;
        direction: ReelDirection;
      }
    | null
    | undefined
  >(null);
  const isTransitioningRef = React.useRef(false);
  const processNextTransitionRef = React.useRef<any>(() => {});
  const finishTransitionRef = React.useRef<any>(() => {});
  const hasPlaylist = shortsRecommendedUris && shortsRecommendedUris.length > 0;
  const isAtStart = currentIndex <= 0;
  const isAtEnd = currentIndex >= (shortsRecommendedUris?.length || 1) - 1;
  const hasInitializedRef = React.useRef(false);
  const entryUrlRef = React.useRef(null);
  const isLoadingContent = isSearchingRecommendations || !hasPlaylist;
  const PRELOAD_BATCH_SIZE = 3;
  const preloadedUrisRef = React.useRef(new Set());
  const isSwipeEnabled = !(isMobile && sidePanelOpen);
  const hasEnsuredViewParam = React.useRef(false);
  const latestRouteRef = React.useRef({
    pathname,
    search,
  });
  const [overlayTarget, setOverlayTarget] = React.useState(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    const viewer = document.querySelector('.shorts__viewer');
    const cover = document.querySelector('.content__cover--shorts');
    const target = viewer || cover || null;
    setOverlayTarget((prev) => (prev !== target ? target : prev));
  });
  const setShortViewerWidthFromVideo = React.useCallback(() => {
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
    const panelMaxPx = window.innerWidth - 480;
    const panelMaxVW = (panelMaxPx / window.innerWidth) * 100;
    const maxWidth = sidePanelOpen ? Math.min(panelMaxVW, 80) : Math.min(maxWidthVW, 80);
    const widthVW = (computedWidthPx / window.innerWidth) * 100;
    const clampedVW = Math.min(widthVW, maxWidth); // Avoid overflow

    requestAnimationFrame(() => {
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
      const fypParam =
        fypId && uuid
          ? {
              gid: fypId,
              uuid,
            }
          : null;

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
    doOpenModal(MODALS.SOCIAL_SHARE, {
      uri,
      webShareable,
      collectionId,
    });
  }, [doOpenModal, uri, webShareable, collectionId]);
  const handleCommentsClick = React.useCallback(() => {
    if (sidePanelOpen && panelMode === 'comments') {
      doSetShortsSidePanel(false);
    } else {
      setPanelMode('comments');
      doSetShortsSidePanel(true);
    }
  }, [doSetShortsSidePanel, sidePanelOpen, panelMode]);
  const handleInfoButtonClick = React.useCallback(() => {
    if (sidePanelOpen && panelMode === 'info') {
      doSetShortsSidePanel(false);
    } else {
      setPanelMode('info');
      doSetShortsSidePanel(true);
    }
  }, [doSetShortsSidePanel, sidePanelOpen, panelMode]);
  const handleClosePanel = React.useCallback(() => {
    doSetShortsSidePanel(false);
  }, [doSetShortsSidePanel]);
  const handledLinkedCommentIdRef = React.useRef(null);
  React.useEffect(() => {
    if (linkedCommentId && linkedCommentId !== handledLinkedCommentIdRef.current) {
      handledLinkedCommentIdRef.current = linkedCommentId;
      setPanelMode('comments');
      doSetShortsSidePanel(true);
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
      const src = getThumbnailCdnUrl({
        thumbnail: nextThumbnail,
        isShorts: true,
      });
      if (src) img.src = src;
    }

    if (previousThumbnail) {
      const img = new Image();
      const src = getThumbnailCdnUrl({
        thumbnail: previousThumbnail,
        isShorts: true,
      });
      if (src) img.src = src;
    }
  }, [nextThumbnail, previousThumbnail]);
  React.useEffect(() => {
    const previousRoute = latestRouteRef.current;

    if (previousRoute.pathname !== pathname || previousRoute.search !== search) {
      const currentSearch = previousRoute.search || '';
      const nextSearch = search || '';
      const currentParams = new URLSearchParams(currentSearch);
      const nextParams = new URLSearchParams(nextSearch);
      const isCurrentlyInShortsPlayer = currentParams.get('view') === 'shorts';
      const isNavigatingToShortsPlayer = nextParams.get('view') === 'shorts';
      const isNavigatingToShortsTab = nextParams.get('view') === 'shortsTab';
      const isNavigatingToHome = pathname === '/' && !nextSearch;
      const isBackNavigation = navigationType === 'POP';
      const shouldCleanup =
        (isCurrentlyInShortsPlayer && !isNavigatingToShortsPlayer) ||
        (isCurrentlyInShortsPlayer && isNavigatingToHome) ||
        (isBackNavigation && isCurrentlyInShortsPlayer && isNavigatingToShortsTab) ||
        (isCurrentlyInShortsPlayer && isNavigatingToShortsTab);

      if (shouldCleanup) {
        doClearShortsPlaylist();
      }
    }

    latestRouteRef.current = {
      pathname,
      search,
    };
  }, [doClearShortsPlaylist, navigationType, pathname, search]);

  React.useEffect(() => {
    return () => {
      const currentUrl = latestRouteRef.current.search || '';
      const currentPath = latestRouteRef.current.pathname || '/';
      const currentParams = new URLSearchParams(currentUrl);
      const isInShortsPlayer = currentParams.get('view') === 'shorts';
      const isInShortsTab = currentParams.get('view') === 'shortsTab';
      const isHomePage = currentPath === '/' && !currentUrl;
      const shouldCleanupOnUnmount =
        (!isInShortsPlayer && !isInShortsTab) || (!isInShortsPlayer && isInShortsTab) || isHomePage;

      if (shouldCleanupOnUnmount) {
        doClearShortsPlaylist();
      }
    };
  }, [doClearShortsPlaylist]);
  React.useEffect(() => {
    let timeoutId;

    function loop() {
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
      navigate(
        {
          pathname,
          search: `?${urlParams.toString()}`,
        },
        { replace: true }
      );
    }

    hasEnsuredViewParam.current = true;
  }, [navigate, pathname, search]);
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
      const previewSrc = transitionThumb
        ? getThumbnailCdnUrl({
            thumbnail: transitionThumb,
            isShorts: true,
          })
        : null;
      isTransitioningRef.current = true;
      activeTransitionRef.current = {
        sourceUri: uri,
        targetUri,
        direction,
      };
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
        navigate(getShortsUrl(activeTransition.targetUri), { replace: true });

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
    uri,
    clearTransitionTimers,
    clearPosition,
    getShortsUrl,
    claimId,
    onRecommendationClicked,
    doClearPlayingUri,
    navigate,
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

    queueTransition('next');
  }, [nextRecommendedShort, isAtEnd, queueTransition]);
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
      if ((isMobile && sidePanelOpen) || wheelLockRef.current) return;
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
    [goToNext, goToPrevious, isMobile, sidePanelOpen, isSwipeInsideSidePanel]
  );
  React.useEffect(() => {
    const container = shortsContainerRef.current;
    if (!container) return;
    container.addEventListener('wheel', handleScroll, {
      passive: false,
    });
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
                ? {
                    backgroundImage: `url(${String(
                      getThumbnailCdnUrl({
                        thumbnail,
                        isShorts: true,
                      })
                    )})`,
                  }
                : undefined
            }
          />,
          transitionPreviewTarget
        )}
      {channelName &&
        overlayTarget &&
        createPortal(
          <>
            {overlayTarget.classList.contains('shorts__viewer') && (
              <div className="shorts-viewer__content-info">
                {channelUri && (
                  <Link
                    to={channelUri.replace('lbry://', '/').replace(/#/g, ':')}
                    className="shorts-viewer__channel"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ChannelThumbnail uri={channelUri} xxsmall checkMembership={false} />
                    <span className="shorts-viewer__channel-name">{channelDisplayName || channelName}</span>
                  </Link>
                )}
                <span className="shorts-viewer__title">{title}</span>
              </div>
            )}
            {channelId && (
              <ViewModeToggle
                viewMode={localViewMode}
                channelName={channelName}
                onViewModeChange={handleViewModeChange}
                isTransitioning={isTransitioning}
              />
            )}
          </>,
          overlayTarget
        )}
      <div
        className={classnames('shorts-page', {
          'shorts-page--transitioning': isTransitioning,
        })}
        ref={shortsContainerRef}
      >
        <div className={`shorts-page__container ${sidePanelOpen ? 'shorts-page__container--panel-open' : ''}`}>
          <div className="shorts-page__main-content">
            <div className="shorts-page__video-section">
              <ShortsVideoPlayer
                uri={uri}
                isMobile={isMobile}
                primaryPlayerWrapperClass={PRIMARY_PLAYER_WRAPPER_CLASS}
                nextRecommendedShort={nextRecommendedShort}
                autoPlayNextShort={autoPlayNextShort}
                isAtEnd={isAtEnd}
                onSwipeNext={goToNext}
                onSwipePrevious={goToPrevious}
                enableSwipe={isSwipeEnabled}
              />

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
              isOpen={sidePanelOpen}
              onClose={handleClosePanel}
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
