// @ts-expect-error
import { Global } from '@emotion/react';
import { VideoRenderFloatingContext } from 'contexts/videoRenderFloating';
import type { ElementRef } from 'react';
import * as MODALS from 'constants/modal_types';
import * as ICONS from 'constants/icons';
import {
  PRIMARY_PLAYER_WRAPPER_CLASS,
  FLOATING_PLAYER_CLASS,
  DEFAULT_INITIAL_FLOATING_POS,
  HEADER_HEIGHT_MOBILE,
} from 'constants/player';
import React from 'react';
import Button from 'component/button';
import classnames from 'classnames';
import VideoRender from 'component/videoClaimRender';
import UriIndicator from 'component/uriIndicator';
import usePersistedState from 'effects/use-persisted-state';
import Draggable from 'react-draggable';
import { formatLbryUrlForWeb, generateListSearchUrlParams, formatLbryChannelName } from 'util/url';
import { useIsMobile, useIsMobileLandscape, useIsLandscapeScreen } from 'effects/use-screensize';
import debounce from 'util/debounce';
import { isURIEqual } from 'util/lbryURI';
import AutoplayCountdown from './internal/autoplayCountdown';
import FileViewerEmbeddedTitle from 'component/fileViewerEmbeddedTitle';
import ChannelThumbnail from 'component/channelThumbnail';
import {
  getRootEl,
  getScreenWidth,
  getScreenHeight,
  clampFloatingPlayerToScreen,
  calculateRelativePos,
  getMaxLandscapeHeight,
  getAmountNeededToCenterVideo,
  getPossiblePlayerHeight,
} from 'util/window';
import { lazyImport } from 'util/lazyImport';
import withStreamClaimRender from 'hocs/withStreamClaimRender';
import FloatingShortsActions from './internal/floatingShortsActions';
import FloatingReactions from './internal/floatingReactions';
const HEADER_HEIGHT = 60;
const DEBOUNCE_WINDOW_RESIZE_HANDLER_MS = 100;
const CONTENT_VIEWER_CLASS = 'content__viewer';
const SHORTS_VIEWER_CLASS = 'shorts__viewer';
const PlaylistCard = lazyImport(
  () =>
    import(
      'component/playlistCard'
      /* webpackChunkName: "playlistCard" */
    )
);
// ****************************************************************************
// ****************************************************************************
type Props = {
  claimId: string | null | undefined;
  channelUrl: string | null | undefined;
  channelTitle: string | null | undefined;
  isFloating: boolean;
  uri: string;
  title: string | null | undefined;
  floatingPlayerEnabled: boolean;
  renderMode: string;
  playingUri: PlayingUri;
  primaryUri: string | null | undefined;
  videoTheaterMode: boolean;
  collectionId: string;
  collectionSidebarId: string | null | undefined;
  doFetchRecommendedContent: (uri: string) => void;
  isCurrentClaimLive?: boolean;
  videoAspectRatio: number;
  socketConnection: {
    connected: boolean | null | undefined;
  };
  appDrawerOpen: boolean;
  playingCollection: Collection;
  hasClaimInQueue: boolean;
  mainPlayerDimensions: {
    height: number;
    width: number;
  };
  location: {
    search: string;
    state?: {
      overrideFloating?: boolean;
    };
  };
  contentUnlocked: boolean;
  isAutoplayCountdown: boolean | null | undefined;
  autoplayCountdownUri: string | null | undefined;
  canViewFile: boolean | null | undefined;
  doCommentSocketConnect: (
    uri: string,
    channelName: string,
    claimId: string,
    subCategory: string | null | undefined
  ) => void;
  doCommentSocketDisconnect: (arg0: string, arg1: string) => void;
  doClearPlayingUri: () => void;
  doClearQueueList: () => void;
  doOpenModal: (id: string, arg1: {}) => void;
  doClearPlayingSource: () => void;
  doSetShowAutoplayCountdownForUri: (params: { uri: string | null | undefined; show: boolean }) => void;
  sidePanelOpen: boolean;
  isClaimShort?: boolean;
  disableShortsView?: boolean;
  shortsPlaylist: Array<string>;
  autoPlayNextShort: boolean;
  doSetPlayingUri: (arg0: PlayingUri) => void;
};

function isDraggingVideojsComponent(e) {
  const className = e?.target?.className;
  return (
    typeof className === 'string' &&
    (className.includes('vjs-volume-control') ||
      className.includes('vjs-volume-level') ||
      className.includes('vjs-time-marker') ||
      className.includes('vjs-mouse-display') ||
      className.includes('vjs-icon-placeholder'))
  );
}

function VideoRenderFloating(props: Props) {
  const {
    claimId,
    channelUrl,
    channelTitle,
    uri,
    title,
    isFloating,
    floatingPlayerEnabled,
    renderMode,
    playingUri,
    primaryUri,
    videoTheaterMode,
    collectionId,
    collectionSidebarId,
    socketConnection,
    doFetchRecommendedContent,
    isCurrentClaimLive,
    videoAspectRatio,
    appDrawerOpen,
    playingCollection,
    hasClaimInQueue,
    mainPlayerDimensions,
    location,
    isAutoplayCountdown,
    autoplayCountdownUri,
    canViewFile,
    doCommentSocketConnect,
    doCommentSocketDisconnect,
    doClearPlayingUri,
    doClearQueueList,
    doOpenModal,
    doClearPlayingSource,
    doSetShowAutoplayCountdownForUri,
    sidePanelOpen,
    contentUnlocked,
    isClaimShort,
    disableShortsView,
    shortsPlaylist,
    autoPlayNextShort,
    doSetPlayingUri,
  } = props;
  const { state } = location;
  const { overrideFloating } = state || {};
  const isShortVideo = Boolean(isClaimShort && (!disableShortsView || isFloating));
  const isShortsFloating = isFloating && isShortVideo;
  const shortsPlaylistRef = React.useRef(shortsPlaylist);

  if (shortsPlaylist.length > 0) {
    shortsPlaylistRef.current = shortsPlaylist;
  }

  const playlist = shortsPlaylistRef.current;
  const playlistIndex = uri ? playlist.indexOf(uri) : -1;
  const hasPreviousShort = playlistIndex > 0;
  const hasNextShort = playlistIndex >= 0 && playlistIndex < playlist.length - 1;
  const goToPreviousShort = React.useCallback(() => {
    if (hasPreviousShort) {
      doSetPlayingUri({
        uri: playlist[playlistIndex - 1],
        collection: {},
        isShort: true,
      });
    }
  }, [hasPreviousShort, playlist, playlistIndex, doSetPlayingUri]);
  const goToNextShort = React.useCallback(() => {
    if (hasNextShort) {
      doSetPlayingUri({
        uri: playlist[playlistIndex + 1],
        collection: {},
        isShort: true,
      });
    }
  }, [hasNextShort, playlist, playlistIndex, doSetPlayingUri]);
  const isMobile = useIsMobile();
  const isTabletLandscape = useIsLandscapeScreen() && !isMobile;
  const isLandscapeRotated = useIsMobileLandscape();
  const initialMobileState = React.useRef(isMobile);
  const initialPlayerHeight = React.useRef();
  const resizedBetweenFloating = React.useRef();
  const { source: playingUriSource, primaryUri: playingPrimaryUri } = playingUri;
  const isComment = playingUriSource === 'comment';
  const mainFilePlaying = Boolean(!isFloating && primaryUri && isURIEqual(uri, primaryUri));
  const noFloatingPlayer = !overrideFloating && (!isFloating || !floatingPlayerEnabled);
  const [cancelledAutoPlayCountdown, setCancelledAutoPlayCountdown] = React.useState(false);
  const [fileViewerRect, setFileViewerRect] = React.useState();
  const [wasDragging, setWasDragging] = React.useState(false);
  const shortsFloatingWrapperRef = React.useRef();
  const [forceDisable, setForceDisable] = React.useState(false);
  const [isShortsFloatingPaused, setIsShortsFloatingPaused] = React.useState(false);
  const [fireGlow, setFireGlow] = React.useState(false);
  const fireGlowTimeout = React.useRef(null);
  const [slimeEffect, setSlimeEffect] = React.useState(false);
  const slimeEffectTimeout = React.useRef(null);
  const [position, setPosition] = usePersistedState('floating-file-viewer:position', DEFAULT_INITIAL_FLOATING_POS);
  const relativePosRef = React.useRef(calculateRelativePos(position.x, position.y));
  const noPlayerHeight = fileViewerRect?.height === 0;
  const draggable = !isMobile && isFloating;
  // allows displaying overlays like membership/paid/rental for restrictions even when floating
  const showStreamPlaceholder = cancelledAutoPlayCountdown && !canViewFile;
  // Avoid forcing collection query params for floating shorts title navigation.
  const includeCollectionQueryInTitleNav = Boolean(collectionId && !isShortsFloating);
  const navigateUrl = uri
    ? formatLbryUrlForWeb(uri) +
      (isShortsFloating
        ? '?view=shorts'
        : includeCollectionQueryInTitleNav
          ? generateListSearchUrlParams(collectionId)
          : '')
    : '';
  const shortsMetaLabel = channelTitle || (channelUrl ? formatLbryChannelName(channelUrl) : __('Anonymous'));
  const channelNavigateUrl = channelUrl ? formatLbryUrlForWeb(channelUrl) : '';
  const theaterMode = renderMode === 'video' || renderMode === 'audio' ? videoTheaterMode : false;
  // const [isPortraitVideo, setIsPortraitVideo] = React.useState(false);
  const isPortraitVideo = React.useRef(false);
  // ****************************************************************************
  // FUNCTIONS
  // ****************************************************************************
  const handleResize = React.useCallback(() => {
    const element = document.querySelector(`.${PRIMARY_PLAYER_WRAPPER_CLASS}`);
    if (!element) return;
    const rect = element.getBoundingClientRect();
    // getBoundingClientRect returns a DomRect, not an object
    const objectRect = {
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      // $FlowFixMe
      x: rect.x,
    };
    isPortraitVideo.current = rect.height > rect.width;
    // replace the initial value every time the window is resized if isMobile is true,
    // since it could be a portrait -> landscape rotation switch, or if it was a mobile - desktop
    // switch, so use the ref to compare the initial state
    const resizedEnoughForMobileSwitch = isMobile !== initialMobileState.current;

    if (videoAspectRatio && (!initialPlayerHeight.current || isMobile || resizedEnoughForMobileSwitch)) {
      const heightForRect = getPossiblePlayerHeight(videoAspectRatio * rect.width, isMobile);
      initialPlayerHeight.current = heightForRect;
    }

    // $FlowFixMe
    setFileViewerRect({ ...objectRect, windowOffset: window.pageYOffset }); // force re-calculate when sourceId changes (playing a new claimLink on the same page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, mainFilePlaying, videoAspectRatio, playingUri.sourceId, mainPlayerDimensions]);
  const restoreToRelativePosition = React.useCallback(() => {
    const SCROLL_BAR_PX = 12; // root: --body-scrollbar-width

    const screenW = getScreenWidth() - SCROLL_BAR_PX;
    const screenH = getScreenHeight();
    const newX = Math.round(relativePosRef.current.x * screenW);
    const newY = Math.round(relativePosRef.current.y * screenH);
    const clampPosition = clampFloatingPlayerToScreen({
      x: newX,
      y: newY,
    });

    if (![clampPosition.x, clampPosition.y].some(isNaN)) {
      setPosition(clampPosition);
    }
  }, [setPosition]);
  const clampToScreenOnResize = React.useCallback(
    debounce(restoreToRelativePosition, DEBOUNCE_WINDOW_RESIZE_HANDLER_MS),
    []
  );
  // ****************************************************************************
  // EFFECTS
  // ****************************************************************************
  // Establish web socket connection for viewer count.
  React.useEffect(() => {
    if (!claimId || !channelUrl || !isCurrentClaimLive) return;
    const channelName = formatLbryChannelName(channelUrl);

    // Only connect if not yet connected, so for example clicked on an embed instead of accessing
    // from the Livestream page
    if (!socketConnection?.connected && contentUnlocked) {
      doCommentSocketConnect(uri, channelName, claimId, undefined);
    }

    // This will be used to disconnect for every case, since this is the main player component
    return () => {
      if (socketConnection?.connected) {
        doCommentSocketDisconnect(claimId, channelName);
      }
    };
  }, [
    channelUrl,
    claimId,
    contentUnlocked,
    doCommentSocketConnect,
    doCommentSocketDisconnect,
    isCurrentClaimLive,
    socketConnection,
    uri,
  ]);
  React.useEffect(() => {
    if (playingPrimaryUri || uri || collectionSidebarId) {
      handleResize();
    }
  }, [handleResize, playingPrimaryUri, theaterMode, uri, collectionSidebarId]);
  React.useEffect(() => {
    if (noPlayerHeight) {
      handleResize();
    }
  }, [fileViewerRect, noPlayerHeight, handleResize]);
  // Listen to main-window resizing and adjust the floating player position accordingly:
  React.useEffect(() => {
    // intended to only run once: when floating player switches between true - false
    // otherwise handleResize() can run twice when this effect re-runs, so use
    // resizedBetweenFloating ref
    if (isFloating) {
      // Ensure player is within screen when 'isFloating' changes.
      restoreToRelativePosition();
      resizedBetweenFloating.current = false;
    } else if (!resizedBetweenFloating.current) {
      doSetShowAutoplayCountdownForUri({
        uri,
        show: false,
      });
      handleResize();
      resizedBetweenFloating.current = true;
    }

    const element = document.querySelector(`.${PRIMARY_PLAYER_WRAPPER_CLASS}`);
    const resizeObserver = new ResizeObserver(() => {
      if (isFloating) clampToScreenOnResize();
      if (collectionSidebarId || !isFloating) handleResize();
    });
    if (element) resizeObserver.observe(element);
    return () => {
      resizeObserver.disconnect();
    }; // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clampToScreenOnResize, handleResize, isFloating, collectionSidebarId]);
  React.useEffect(() => {
    // Initial update for relativePosRef:
    relativePosRef.current = calculateRelativePos(position.x, position.y); // eslint-disable-next-line react-hooks/exhaustive-deps -- Only on mount
  }, []);
  React.useEffect(() => {
    if (isFloating && isComment) {
      // When the player begins floating, remove the comment source
      // so that it doesn't try to resize again in case of going back
      // to the origin's comment section and fail to position correctly
      doClearPlayingSource();
    }
  }, [doClearPlayingSource, isComment, isFloating]);
  React.useEffect(() => {
    if (isFloating && !isShortVideo) doFetchRecommendedContent(uri);
  }, [doFetchRecommendedContent, isFloating, uri, isShortVideo]);
  React.useEffect(() => {
    if (!isShortsFloating) {
      setIsShortsFloatingPaused(false);
      return;
    }

    let videoEl = null;

    const onPlay = () => setIsShortsFloatingPaused(false);

    const onPause = () => setIsShortsFloatingPaused(true);

    const attach = () => {
      // $FlowFixMe — querySelector returns HTMLElement but we need HTMLVideoElement
      const el: HTMLVideoElement | null | undefined = document.querySelector(
        '.content__viewer--shorts-floating .vjs-tech'
      );

      if (el && el !== videoEl) {
        if (videoEl) {
          videoEl.removeEventListener('play', onPlay);
          videoEl.removeEventListener('pause', onPause);
        }

        videoEl = el;
        videoEl.addEventListener('play', onPlay);
        videoEl.addEventListener('pause', onPause);
        setIsShortsFloatingPaused(videoEl.paused);
        return true;
      }

      return !!videoEl;
    };

    attach();
    const interval = setInterval(attach, 200);
    const timeout = setTimeout(() => clearInterval(interval), 10000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);

      if (videoEl) {
        videoEl.removeEventListener('play', onPlay);
        videoEl.removeEventListener('pause', onPause);
      }
    };
  }, [isShortsFloating, uri]);
  React.useEffect(() => {
    if (!isShortsFloating) return;
    let videoEl = null;
    let cleanupFn = null;

    const attachListener = () => {
      // $FlowFixMe
      const el: HTMLVideoElement | null | undefined = document.querySelector(
        '.content__viewer--shorts-floating .vjs-tech'
      );
      if (!el || el === videoEl) return !!videoEl;
      if (cleanupFn) cleanupFn();
      videoEl = el;

      const handleEnded = () => {
        if (autoPlayNextShort && hasNextShort) {
          setTimeout(() => goToNextShort(), 500);
        } else if (videoEl) {
          const v = videoEl;
          setTimeout(() => {
            v.currentTime = 0;
            // $FlowFixMe
            v.play().catch(() => {});
          }, 100);
        }
      };

      videoEl.addEventListener('ended', handleEnded);
      const currentEl = videoEl;

      cleanupFn = () => {
        currentEl.removeEventListener('ended', handleEnded);
        videoEl = null;
      };

      return true;
    };

    attachListener();
    const interval = setInterval(attachListener, 200);
    const timeout = setTimeout(() => clearInterval(interval), 10000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      if (cleanupFn) cleanupFn();
    };
  }, [isShortsFloating, uri, autoPlayNextShort, hasNextShort, goToNextShort]);
  React.useEffect(() => {
    const wrapperNode = shortsFloatingWrapperRef.current;
    if (!(wrapperNode instanceof Element) || !isShortsFloating) return;

    const blockDoubleClickFullscreen = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();

      // Prevent downstream handlers (including VideoJS) from seeing this dblclick.
      if (typeof event.stopImmediatePropagation === 'function') {
        event.stopImmediatePropagation();
      }
    };

    wrapperNode.addEventListener('dblclick', blockDoubleClickFullscreen, true);
    return () => {
      wrapperNode.removeEventListener('dblclick', blockDoubleClickFullscreen, true);
    };
  }, [isShortsFloating]);
  React.useEffect(() => {
    return () => {
      if (uri) {
        // erase the playerHeight data so it can be re-calculated
        initialPlayerHeight.current = undefined;
        setCancelledAutoPlayCountdown(false);
      }
    }; // only if switched videos (uri change or unmount),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uri]);
  React.useEffect(() => {
    if (primaryUri && uri && !collectionId && primaryUri !== uri && !overrideFloating && !floatingPlayerEnabled) {
      doClearPlayingUri();
    }
  }, [collectionId, doClearPlayingUri, floatingPlayerEnabled, overrideFloating, primaryUri, uri]);

  if (!uri || (isFloating && noFloatingPlayer)) {
    return null;
  }

  // ****************************************************************************
  // RENDER
  // ****************************************************************************
  function handleDragStart(e) {
    if (isDraggingVideojsComponent(e)) {
      return false;
    }

    // Not really necessary, but reset just in case 'handleStop' didn't fire.
    setWasDragging(false);
  }

  function handleDragMove(e, ui) {
    if (isDraggingVideojsComponent(e)) {
      return false;
    }

    const { x, y } = position;
    const newX = ui.x;
    const newY = ui.y;

    // Mark as dragging if the position changed and we were not dragging before.
    if (!wasDragging && (newX !== x || newY !== y)) {
      setWasDragging(true);
    }
  }

  function handleDragStop(e, ui) {
    if (isDraggingVideojsComponent(e)) {
      return false;
    }

    // Always clear drag click-shield after drag end.
    setWasDragging(false);
    const { x, y } = ui;
    let newPos = {
      x,
      y,
    };

    if (newPos.x !== position.x || newPos.y !== position.y) {
      newPos = clampFloatingPlayerToScreen(newPos);
      setPosition(newPos);
      relativePosRef.current = calculateRelativePos(newPos.x, newPos.y);
    }
  }

  const minRatio = videoAspectRatio >= 9 / 16 ? videoAspectRatio : 9 / 16;
  const heightForViewer =
    !theaterMode || isMobile ? fileViewerRect?.height : getPossiblePlayerHeight(minRatio * window.innerWidth, isMobile);
  return (
    <VideoRenderFloatingContext.Provider
      value={{
        draggable,
      }}
    >
      {!isAutoplayCountdown && ((uri && fileViewerRect && videoAspectRatio) || collectionSidebarId) ? (
        <PlayerGlobalStyles
          videoAspectRatio={videoAspectRatio}
          theaterMode={theaterMode}
          appDrawerOpen={appDrawerOpen && !isLandscapeRotated && !isTabletLandscape}
          initialPlayerHeight={initialPlayerHeight}
          isFloating={isFloating}
          fileViewerRect={fileViewerRect || mainPlayerDimensions}
          mainFilePlaying={mainFilePlaying}
          isLandscapeRotated={isLandscapeRotated}
          isTabletLandscape={isTabletLandscape}
          isShortVideo={isShortVideo}
        />
      ) : null}

      {wasDragging && <div className="floating-player__drag-backdrop" />}
      <Draggable
        onDrag={handleDragMove}
        onStart={handleDragStart}
        onStop={handleDragStop}
        defaultPosition={position}
        position={
          isFloating
            ? position
            : {
                x: 0,
                y: 0,
              }
        }
        bounds="parent"
        handle=".draggable"
        cancel=".button"
        disabled={noFloatingPlayer || forceDisable}
      >
        <div
          id="abcd"
          className={classnames({
            [CONTENT_VIEWER_CLASS]: !isShortVideo,
            [SHORTS_VIEWER_CLASS]: isShortVideo && !isFloating,
            [FLOATING_PLAYER_CLASS]: isFloating,
            'content__viewer--shorts-floating': isShortsFloating && !isMobile,
            'shorts-floating--paused': isShortsFloatingPaused,
            'shorts-floating--fire-glow': fireGlow,
            'shorts-floating--slime-effect': slimeEffect,
            'content__viewer--inline': !isFloating,
            'content__viewer--secondary': isComment,
            'content__viewer--theater-mode': theaterMode && mainFilePlaying && !isMobile,
            'content__viewer--disable-click': wasDragging,
            'content__viewer--mobile': isMobile && !isLandscapeRotated && !playingUriSource,
            'content__viewer--portrait': isPortraitVideo.current,
            'shorts__viewer--panel-open': isShortVideo && sidePanelOpen && !isMobile,
          })}
          style={
            !isFloating && fileViewerRect
              ? {
                  width: fileViewerRect.width,
                  height: appDrawerOpen ? `${getMaxLandscapeHeight()}px` : heightForViewer,
                  left: fileViewerRect.x,
                  top:
                    isMobile && !playingUriSource
                      ? HEADER_HEIGHT_MOBILE
                      : fileViewerRect.windowOffset + fileViewerRect.top - HEADER_HEIGHT,
                }
              : {}
          }
        >
          <div
            className={classnames('content__wrapper', {
              'content__wrapper--floating': isFloating,
              'content__wrapper--shorts-floating': isShortsFloating,
            })}
            ref={shortsFloatingWrapperRef}
          >
            {!isFloating && isComment && <FileViewerEmbeddedTitle uri={uri} />}

            {isFloating && (
              <Button
                title={__('Close')}
                onClick={() => {
                  if (hasClaimInQueue) {
                    doOpenModal(MODALS.CONFIRM, {
                      title: __('Close Player'),
                      subtitle: __('Are you sure you want to close the player and clear the current Queue?'),
                      onConfirm: (closeModal) => {
                        doSetShowAutoplayCountdownForUri({
                          uri,
                          show: false,
                        });
                        doClearPlayingUri();
                        doClearQueueList();
                        closeModal();
                      },
                    });
                  } else {
                    doClearPlayingUri();
                    doSetShowAutoplayCountdownForUri({
                      uri,
                      show: false,
                    });
                  }
                }}
                icon={ICONS.REMOVE}
                button="primary"
                className="content__floating-close"
              />
            )}

            {autoplayCountdownUri && !showStreamPlaceholder && (
              <div
                className={classnames('content__autoplay-countdown', {
                  draggable,
                  playing: !isAutoplayCountdown,
                })}
              >
                <AutoplayCountdown uri={uri} onCancel={() => setCancelledAutoPlayCountdown(true)} />
              </div>
            )}

            {/* -- Use ref here to not switch video renders while switching from floating/not floating */}
            {uri && (!isAutoplayCountdown || showStreamPlaceholder) && (
              <FloatingRender
                uri={uri}
                draggable={draggable}
                isShortsContext={isShortVideo}
                isFloatingContext={isFloating}
                forceRenderStream={isFloating}
              />
            )}

            {isShortsFloating && (
              <FloatingShortsActions
                uri={uri}
                claimId={claimId}
                channelUrl={channelUrl}
                navigateUrl={navigateUrl}
                onPrevious={hasPreviousShort ? goToPreviousShort : null}
                onNext={hasNextShort ? goToNextShort : null}
                onFireGlow={() => {
                  setFireGlow(false);
                  clearTimeout(fireGlowTimeout.current);
                  requestAnimationFrame(() => {
                    setFireGlow(true);
                    fireGlowTimeout.current = setTimeout(() => setFireGlow(false), 2000);
                  });
                }}
                onSlimeEffect={() => {
                  setSlimeEffect(false);
                  clearTimeout(slimeEffectTimeout.current);
                  requestAnimationFrame(() => {
                    setSlimeEffect(true);
                    slimeEffectTimeout.current = setTimeout(() => setSlimeEffect(false), 3000);
                  });
                }}
              />
            )}

            {isFloating && !isShortsFloating && uri && <FloatingReactions uri={uri} claimId={claimId} />}

            {fireGlow && isShortsFloating && (
              <div className="shorts-floating-flames">
                {Array.from(
                  {
                    length: 50,
                  },
                  (_, i) => (
                    <div
                      key={i}
                      className="shorts-floating-flames__particle"
                      style={{
                        left: `calc(${(i / 50) * 100}% - 35px)`,
                        animationDelay: `${Math.random()}s`,
                      }}
                    />
                  )
                )}
              </div>
            )}

            {isFloating && (
              <div
                className={classnames('content__info', {
                  draggable: !isMobile,
                  'content__info--shorts-floating': isShortsFloating && !isMobile,
                  'content-info__playlist': playingCollection,
                })}
              >
                <div className="content-info__text">
                  <div className="claim-preview__title" title={title || uri}>
                    <Button
                      label={title || uri}
                      navigate={navigateUrl}
                      button="link"
                      className="content__floating-link"
                    />
                  </div>
                  {isShortsFloating ? (
                    channelNavigateUrl ? (
                      <Button navigate={channelNavigateUrl} button="link" className="content__shorts-floating-channel">
                        <ChannelThumbnail key={channelUrl} xxsmall uri={channelUrl} />
                        {shortsMetaLabel && (
                          <span className="content__shorts-floating-subtitle">{shortsMetaLabel}</span>
                        )}
                      </Button>
                    ) : (
                      <div className="content__shorts-floating-channel">
                        <ChannelThumbnail key={channelUrl} xxsmall uri={channelUrl} />
                        {shortsMetaLabel && (
                          <span className="content__shorts-floating-subtitle">{shortsMetaLabel}</span>
                        )}
                      </div>
                    )
                  ) : (
                    <ChannelThumbnail xxsmall uri={channelUrl} />
                  )}
                  {!isShortsFloating && <UriIndicator link uri={uri} />}
                </div>

                {!isShortsFloating && playingCollection && collectionSidebarId !== collectionId && (
                  <React.Suspense fallback={null}>
                    <PlaylistCard
                      id={collectionId}
                      uri={uri}
                      disableClickNavigation
                      doDisablePlayerDrag={setForceDisable}
                      isFloating
                    />
                  </React.Suspense>
                )}
              </div>
            )}
          </div>
        </div>
      </Draggable>
    </VideoRenderFloatingContext.Provider>
  );
}

type GlobalStylesProps = {
  videoAspectRatio: number;
  theaterMode: boolean;
  appDrawerOpen: boolean;
  initialPlayerHeight: ElementRef<any>;
  isFloating: boolean;
  fileViewerRect: any;
  mainFilePlaying: boolean;
  isLandscapeRotated: boolean;
  isTabletLandscape: boolean;
  isShortVideo?: boolean;
};

const PlayerGlobalStyles = (props: GlobalStylesProps) => {
  const {
    videoAspectRatio,
    theaterMode,
    appDrawerOpen,
    initialPlayerHeight,
    isFloating,
    fileViewerRect,
    mainFilePlaying,
    isLandscapeRotated,
    isTabletLandscape,
    isShortVideo,
  } = props;
  const justChanged = React.useRef();
  const isMobile = useIsMobile();
  const isMobilePlayer = isMobile && !isFloating; // to avoid miniplayer -> file page only

  const minRatio = videoAspectRatio >= 9 / 16 ? videoAspectRatio : 9 / 16;
  const heightForViewer = getPossiblePlayerHeight(
    minRatio * (!theaterMode ? fileViewerRect.width : window.innerWidth),
    isMobile
  );
  const widthForViewer = heightForViewer / videoAspectRatio;
  const maxLandscapeHeight = getMaxLandscapeHeight(isMobile ? undefined : widthForViewer);
  const heightResult = appDrawerOpen ? `${maxLandscapeHeight}px` : `${heightForViewer}px`;
  const amountNeededToCenter = getAmountNeededToCenterVideo(heightForViewer, maxLandscapeHeight);
  // forceDefaults = no styles should be applied to any of these conditions
  // !mainFilePlaying = embeds on markdown (comments or posts)
  const forceDefaults = !mainFilePlaying || theaterMode || isFloating || isMobile;
  const videoGreaterThanLandscape = heightForViewer > maxLandscapeHeight;
  // Handles video shrink + center on mobile view
  // direct DOM manipulation due to performance for every scroll
  React.useEffect(() => {
    if (!isMobilePlayer || !mainFilePlaying || isLandscapeRotated || isTabletLandscape) return;
    const viewer = document.querySelector(`.${CONTENT_VIEWER_CLASS}`);

    if (viewer) {
      if (!appDrawerOpen && heightForViewer) viewer.style.height = `${heightForViewer}px`;

      if (!appDrawerOpen) {
        const htmlEl = document.querySelector('html');
        if (htmlEl) htmlEl.scrollTop = 0;
      }

      justChanged.current = true;
    }

    if (appDrawerOpen) return;

    function handleScroll() {
      const rootEl = getRootEl();

      if (justChanged.current) {
        justChanged.current = false;
        return;
      }

      const viewer = document.querySelector(`.${CONTENT_VIEWER_CLASS}`);
      const videoNode = document.querySelector('.vjs-tech');
      const touchOverlay = document.querySelector('.vjs-touch-overlay');

      if (rootEl && viewer) {
        const scrollTop = window.pageYOffset || rootEl.scrollTop;
        const isHigherThanLandscape = scrollTop < initialPlayerHeight.current - maxLandscapeHeight;

        if (videoNode) {
          if (isHigherThanLandscape) {
            if (initialPlayerHeight.current > maxLandscapeHeight) {
              const result = initialPlayerHeight.current - scrollTop;
              const amountNeededToCenter = getAmountNeededToCenterVideo(videoNode.offsetHeight, result);
              videoNode.style.top = `${amountNeededToCenter}px`;
              if (touchOverlay) touchOverlay.style.height = `${result}px`;
              viewer.style.height = `${result}px`;
            }
          } else {
            if (touchOverlay) touchOverlay.style.height = `${maxLandscapeHeight}px`;
            viewer.style.height = `${maxLandscapeHeight}px`;
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll);
    return () => {
      const touchOverlay = document.querySelector('.vjs-touch-overlay');
      if (touchOverlay) touchOverlay.removeAttribute('style');
      window.removeEventListener('scroll', handleScroll);
    };
  }, [
    appDrawerOpen,
    heightForViewer,
    isMobilePlayer,
    mainFilePlaying,
    maxLandscapeHeight,
    initialPlayerHeight,
    isLandscapeRotated,
    isTabletLandscape,
  ]);
  React.useEffect(() => {
    if (videoGreaterThanLandscape && isMobilePlayer) {
      const videoNode = document.querySelector('.vjs-tech');

      if (videoNode) {
        const top = appDrawerOpen ? amountNeededToCenter : 0;
        videoNode.style.top = `${top}px`;
      }
    }

    if (isMobile && isFloating) {
      const viewer = document.querySelector(`.${CONTENT_VIEWER_CLASS}`);
      if (viewer) viewer.removeAttribute('style');
      const touchOverlay = document.querySelector('.vjs-touch-overlay');
      if (touchOverlay) touchOverlay.removeAttribute('style');
      const videoNode = document.querySelector('.vjs-tech');
      if (videoNode) videoNode.removeAttribute('style');
    }
  }, [amountNeededToCenter, appDrawerOpen, isFloating, isMobile, isMobilePlayer, videoGreaterThanLandscape]);
  React.useEffect(() => {
    if (isTabletLandscape) {
      const videoNode = document.querySelector('.vjs-tech');
      if (videoNode) videoNode.removeAttribute('style');
      const touchOverlay = document.querySelector('.vjs-touch-overlay');
      if (touchOverlay) touchOverlay.removeAttribute('style');
    }
  }, [isTabletLandscape]);
  // -- render styles --
  // declaring some style objects as variables makes it easier for repeated cases
  const transparentBackground = {
    background: videoGreaterThanLandscape && mainFilePlaying && !forceDefaults ? 'transparent !important' : undefined,
  };
  const maxHeight = {
    maxHeight: !theaterMode && !isMobile && !isShortVideo ? 'var(--desktop-portrait-player-max-height)' : undefined,
  };
  return (
    <Global
      styles={{
        [`.${PRIMARY_PLAYER_WRAPPER_CLASS}`]: {
          height:
            !theaterMode && mainFilePlaying && fileViewerRect?.height > 0
              ? `${heightResult} !important`
              : isMobile && !isLandscapeRotated && mainFilePlaying
                ? `${heightResult}`
                : undefined,
          opacity: !theaterMode && mainFilePlaying ? '0 !important' : undefined,
        },
        '.file-render--video': { ...transparentBackground, ...maxHeight, video: maxHeight },
        '.content__wrapper': transparentBackground,
        '.video-js': {
          ...transparentBackground,
          '.vjs-touch-overlay': {
            maxHeight: isTabletLandscape ? 'var(--desktop-portrait-player-max-height) !important' : undefined,
          },
        },
        '.vjs-fullscreen': {
          video: {
            top: 'unset !important',
            height: '100% !important',
          },
          '.vjs-touch-overlay': {
            height: '100% !important',
            maxHeight: 'unset !important',
          },
        },
        '.vjs-tech': {
          opacity: '1',
          height: '100%',
          position: 'absolute',
          top: isFloating ? '0px !important' : undefined,
        },
        [`.${CONTENT_VIEWER_CLASS}`]: {
          height:
            (!forceDefaults || isLandscapeRotated) && (!isMobile || isMobilePlayer)
              ? `${heightResult} !important`
              : undefined,
          ...maxHeight,
        },
        '.content__autoplay-countdown': {
          height:
            (!forceDefaults || isLandscapeRotated) && (!isMobile || isMobilePlayer)
              ? `${heightResult} !important`
              : undefined,
          ...maxHeight,
        },
        '.playlist__wrapper': {
          maxHeight:
            !isMobile && !theaterMode && mainFilePlaying
              ? `${heightForViewer}px`
              : isMobile
                ? '100%'
                : fileViewerRect
                  ? `${fileViewerRect.height}px`
                  : undefined,
        },
      }}
    />
  );
};

const FloatingRender = withStreamClaimRender(
  ({
    uri,
    draggable,
    isShortsContext,
    isFloatingContext,
  }: {
    uri: string;
    draggable: boolean;
    isShortsContext?: boolean;
    isFloatingContext?: boolean;
  }) => (
    <VideoRender
      className={classnames({
        draggable,
      })}
      uri={uri}
      isShortsContext={isShortsContext}
      isFloatingContext={isFloatingContext}
    />
  )
);
export default VideoRenderFloating;
