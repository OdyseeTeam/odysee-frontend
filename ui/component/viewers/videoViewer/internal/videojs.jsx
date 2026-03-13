// @flow
import 'scss/component/_videojs-skin.scss';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Video } from '@videojs/react/video';
import Hls from 'hls.js';
import Player from './player';
import OdyseeSkin from './OdyseeSkin';
import useResolvedSource from './hooks/useResolvedSource';
import useRecsys from './hooks/useRecsys';
import useEventTracking from './hooks/useEventTracking';
import useWatchdog from './hooks/useWatchdog';
import useMediaSession from './hooks/useMediaSession';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import useAnalytics from './hooks/useAnalytics';
import MobileTouchOverlay from './components/MobileTouchOverlay';
import { useIsMobile } from 'effects/use-screensize';
import { platform } from 'util/platform';
import classnames from 'classnames';
import * as ICONS from 'constants/icons';
import Button from 'component/button';

const IS_IOS = platform.isIOS();
const IS_MOBILE = platform.isMobile();

type Props = {
  adUrl: ?string,
  claimId: ?string,
  title: ?string,
  channelTitle: string,
  embedded: boolean,
  embeddedInternal: boolean,
  isAudio: boolean,
  poster: ?string,
  shareTelemetry: boolean,
  source: string,
  sourceType: string,
  startMuted: boolean,
  userId: ?number,
  defaultQuality: ?string,
  onPlayerReady: (any, any) => void,
  playNext: () => void,
  playPrevious: () => void,
  toggleVideoTheaterMode: () => void,
  claimRewards: () => void,
  doAnalyticsViewForUri: (string) => void,
  doAnalyticsBuffer: (string, any) => void,
  uri: string,
  claimValues: any,
  isLivestreamClaim: boolean,
  userClaimId: ?string,
  activeLivestreamForChannel: ?LivestreamActiveClaim,
  isPurchasableContent: boolean,
  isRentableContent: boolean,
  isProtectedContent: boolean,
  isDownloadDisabled: boolean,
  isUnlisted: boolean,
  doSetVideoSourceLoaded: (uri: string) => void,
  // Passed from view.jsx
  canPlayNext: boolean,
  canPlayPrevious: boolean,
  autoplayNext: boolean,
  onToggleAutoplayNext: () => void,
  floatingPlayer: boolean,
  onToggleFloatingPlayer: () => void,
  autoplayMedia: boolean,
  onToggleAutoplayMedia: () => void,
  videoTheaterMode: boolean,
  isMarkdownOrComment: boolean,
  isFloating: boolean,
};

function VideoJsInner(props: Props) {
  const {
    claimId,
    title,
    channelTitle,
    embedded,
    embeddedInternal,
    isAudio,
    poster,
    shareTelemetry,
    source,
    sourceType,
    startMuted,
    userId,
    defaultQuality,
    onPlayerReady,
    playNext,
    playPrevious,
    toggleVideoTheaterMode,
    claimValues,
    doAnalyticsViewForUri,
    doAnalyticsBuffer,
    claimRewards,
    uri,
    userClaimId,
    isLivestreamClaim,
    activeLivestreamForChannel,
    isPurchasableContent,
    isRentableContent,
    isProtectedContent,
    isDownloadDisabled,
    isUnlisted,
    doSetVideoSourceLoaded,
    canPlayNext,
    canPlayPrevious,
    autoplayNext,
    onToggleAutoplayNext,
    floatingPlayer,
    onToggleFloatingPlayer,
    autoplayMedia,
    onToggleAutoplayMedia,
    videoTheaterMode,
    isMarkdownOrComment,
    isFloating,
  } = props;

  const isMobile = useIsMobile();
  const store = Player.usePlayer();
  const media = Player.useMedia();
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const [tapToUnmuteVisible, setTapToUnmuteVisible] = useState(false);
  const [tapToRetryVisible, setTapToRetryVisible] = useState(false);
  const readyCalledRef = useRef(false);
  const [reload, setReload] = useState('initial');

  const isLivestream = isLivestreamClaim && userClaimId;

  const resolvedSource = useResolvedSource(
    source,
    sourceType,
    isLivestreamClaim,
    userClaimId,
    isProtectedContent,
    activeLivestreamForChannel,
    uri,
    doSetVideoSourceLoaded
  );

  // Hooks
  useRecsys(claimId, userId, embedded || embeddedInternal, shareTelemetry);
  useEventTracking(
    claimId,
    userId,
    claimValues,
    channelTitle,
    embedded,
    uri,
    isLivestreamClaim,
    doAnalyticsViewForUri,
    doAnalyticsBuffer,
    claimRewards
  );
  useWatchdog(
    Boolean(isLivestream),
    useCallback(() => setReload(Date.now()), []),
    15000
  );
  useMediaSession(claimValues, channelTitle);
  useKeyboardShortcuts({
    containerRef,
    isMobile,
    isLivestreamClaim,
    toggleVideoTheaterMode,
    playNext,
    playPrevious,
  });
  useAnalytics();

  // Initial setup when media element becomes available
  useEffect(() => {
    if (!media || readyCalledRef.current) return;
    readyCalledRef.current = true;

    // Set initial state
    const state = store.state;
    if (startMuted) state.toggleMuted();

    // Call onPlayerReady with a compatible API object
    const playerApi = {
      currentTime: (val) => {
        if (val !== undefined) {
          media.currentTime = val;
          return val;
        }
        return media.currentTime;
      },
      muted: (val) => {
        if (val !== undefined) {
          if (val !== state.muted) state.toggleMuted();
          return val;
        }
        return state.muted;
      },
      volume: (val) => {
        if (val !== undefined) {
          state.setVolume(val);
          return val;
        }
        return state.volume;
      },
      playbackRate: (val) => {
        if (val !== undefined) {
          state.setPlaybackRate(val);
          return val;
        }
        return state.playbackRate;
      },
      on: (event, fn) => media.addEventListener(event, fn),
      off: (event, fn) => media.removeEventListener(event, fn),
      one: (event, fn) => media.addEventListener(event, fn, { once: true }),
      pause: () => media.pause(),
      play: () => media.play(),
      controlBar: { addChild: () => {}, getChild: () => null, removeChild: () => {} },
    };

    window.player = playerApi;
    window.dispatchEvent(new CustomEvent('playerReady'));
    onPlayerReady(playerApi, media);
    if (window.pendingSeekTime != null) {
      media.currentTime = window.pendingSeekTime;
      delete window.pendingSeekTime;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media]);

  // Reset ready state when source changes
  useEffect(() => {
    readyCalledRef.current = false;
  }, [source, reload]);

  // Attach hls.js for HLS sources
  useEffect(() => {
    if (!media || !resolvedSource || !resolvedSource.src) return;
    const src = resolvedSource.src;
    const isHls = src.includes('.m3u8') || src.includes('m3u8');
    if (!isHls || !Hls.isSupported()) return;

    const hls = new Hls({
      backBufferLength: 30,
      capLevelToPlayerSize: true,
      capLevelOnFPSDrop: true,
    });
    hls.attachMedia(media);
    hls.loadSource(src);
    media._hls = hls;

    return () => {
      hls.destroy();
      delete media._hls;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media, resolvedSource?.src]);

  // Auto-play on source load
  useEffect(() => {
    if (!media || !resolvedSource) return;

    const attemptPlay = () => {
      const playPromise = media.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          if (error.name === 'NotAllowedError') {
            if (IS_IOS) {
              media.muted = true;
              const mutedPromise = media.play();
              if (mutedPromise !== undefined) {
                mutedPromise.then(() => setTapToUnmuteVisible(true)).catch(() => {});
              }
            }
          }
        });
      }
    };

    attemptPlay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media, resolvedSource?.src]);

  useEffect(() => {
    if (!media) return;
    const isShorts = !!document.querySelector('.shorts-page__container');
    if (isShorts) media.loop = true;
  }, [media]);

  // Enable metadata tracks (thumbnails) - plain Video doesn't do this automatically
  useEffect(() => {
    if (!media) return;
    const enableTracks = () => {
      for (let i = 0; i < media.textTracks.length; i++) {
        const track = media.textTracks[i];
        if (track.kind === 'metadata' && track.mode === 'disabled') {
          track.mode = 'hidden';
        }
      }
    };
    enableTracks();
    media.textTracks.addEventListener('addtrack', enableTracks);
    return () => media.textTracks.removeEventListener('addtrack', enableTracks);
  }, [media]);

  useEffect(() => {
    // $FlowFixMe
    let hoverForwarder: any = null;
    // $FlowFixMe
    let videoHoverForwarder: any = null;
    const restorePlayer = () => {
      // $FlowFixMe
      const player: any = document.querySelector('.shorts__viewer');
      if (!player || !player._originalParent) return;
      const shortsContainer = document.querySelector('.shorts-page__container');
      if (hoverForwarder && shortsContainer) {
        shortsContainer.removeEventListener('pointermove', hoverForwarder);
        hoverForwarder = null;
      }
      if (player._originalNextSibling && player._originalNextSibling.parentElement === player._originalParent) {
        player._originalParent.insertBefore(player, player._originalNextSibling);
      } else {
        player._originalParent.appendChild(player);
      }
      if (player._savedStyle !== undefined) {
        player.style.cssText = player._savedStyle;
        delete player._savedStyle;
      }
      delete player._originalParent;
      delete player._originalNextSibling;
    };

    const restoreVideoPlayer = () => {
      // $FlowFixMe
      const viewer: any = document.querySelector('.content__viewer');
      if (!viewer || !viewer._originalParent) return;
      const container = window.__videoFullscreenContainer;
      if (videoHoverForwarder && container) {
        container.removeEventListener('pointermove', videoHoverForwarder);
        videoHoverForwarder = null;
      }
      if (viewer._originalNextSibling && viewer._originalNextSibling.parentElement === viewer._originalParent) {
        viewer._originalParent.insertBefore(viewer, viewer._originalNextSibling);
      } else {
        viewer._originalParent.appendChild(viewer);
      }
      if (viewer._savedStyle !== undefined) {
        viewer.style.cssText = viewer._savedStyle;
        delete viewer._savedStyle;
      }
      delete viewer._originalParent;
      delete viewer._originalNextSibling;
    };

    // $FlowFixMe
    window.enterShortsFullscreen = () => {
      const shortsContainer = document.querySelector('.shorts-page__container');
      // $FlowFixMe
      const player: any = document.querySelector('.shorts__viewer');
      if (!shortsContainer || !player) return;
      player._originalParent = player.parentElement;
      player._originalNextSibling = player.nextSibling;
      player._savedStyle = player.style.cssText;
      const videoSection = shortsContainer.querySelector('.shorts-page__video-section');
      if (videoSection) videoSection.insertBefore(player, videoSection.firstChild);
      // $FlowFixMe
      shortsContainer.requestFullscreen();
    };

    // $FlowFixMe
    window.exitShortsFullscreen = () => {
      // $FlowFixMe
      document.exitFullscreen();
    };

    // $FlowFixMe
    window.enterPlayerFullscreen = () => {
      const container = window.__videoFullscreenContainer;
      // $FlowFixMe
      const viewer: any = document.querySelector('.content__viewer');
      if (!container || !viewer) return;
      viewer._originalParent = viewer.parentElement;
      viewer._originalNextSibling = viewer.nextSibling;
      viewer._savedStyle = viewer.style.cssText;
      viewer.style.cssText = '';
      const playerSection = container.querySelector('.video-fullscreen-container__player-section');
      if (playerSection) playerSection.appendChild(viewer);
      // $FlowFixMe
      container.requestFullscreen().catch(() => {
        if (viewer._originalParent) {
          if (viewer._originalNextSibling && viewer._originalNextSibling.parentElement === viewer._originalParent) {
            viewer._originalParent.insertBefore(viewer, viewer._originalNextSibling);
          } else {
            viewer._originalParent.appendChild(viewer);
          }
          if (viewer._savedStyle !== undefined) viewer.style.cssText = viewer._savedStyle;
          delete viewer._originalParent;
          delete viewer._originalNextSibling;
          delete viewer._savedStyle;
        }
      });
    };

    // $FlowFixMe
    window.exitPlayerFullscreen = () => {
      // $FlowFixMe
      if (document.fullscreenElement) document.exitFullscreen();
    };

    const handleFullscreenChange = () => {
      const shortsContainer = document.querySelector('.shorts-page__container');
      const videoContainer = window.__videoFullscreenContainer;

      // $FlowFixMe
      if (shortsContainer && document.fullscreenElement === shortsContainer) {
        hoverForwarder = (e) => {
          if (e.target && e.target.closest && e.target.closest('.media-default-skin')) return;
          const skin = shortsContainer.querySelector('.media-default-skin');
          if (skin) skin.dispatchEvent(new PointerEvent('pointermove', { bubbles: true }));
        };
        // $FlowFixMe
        shortsContainer.addEventListener('pointermove', hoverForwarder);
      } else if (shortsContainer) {
        restorePlayer();
      }

      // $FlowFixMe
      if (videoContainer && document.fullscreenElement === videoContainer) {
        videoHoverForwarder = (e) => {
          if (e.target && e.target.closest && e.target.closest('.media-default-skin')) return;
          const skin = videoContainer.querySelector('.media-default-skin');
          if (skin) skin.dispatchEvent(new PointerEvent('pointermove', { bubbles: true }));
        };
        videoContainer.addEventListener('pointermove', videoHoverForwarder);
      } else if (videoHoverForwarder && videoContainer) {
        videoContainer.removeEventListener('pointermove', videoHoverForwarder);
        videoHoverForwarder = null;
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      delete window.enterShortsFullscreen;
      delete window.exitShortsFullscreen;
      delete window.enterPlayerFullscreen;
      delete window.exitPlayerFullscreen;
      restorePlayer();
      restoreVideoPlayer();
    };
  }, []);

  // Disable context menu for protected content
  useEffect(() => {
    if (!media) return;
    if (isPurchasableContent || isRentableContent || isProtectedContent || isUnlisted || isDownloadDisabled) {
      media.setAttribute('oncontextmenu', 'return false;');
    }
  }, [media, isPurchasableContent, isRentableContent, isProtectedContent, isUnlisted, isDownloadDisabled]);

  const unmuteAndHideHint = useCallback(() => {
    if (media) {
      media.muted = false;
      if (media.volume === 0) media.volume = 1.0;
    }
    setTapToUnmuteVisible(false);
  }, [media]);

  const retryVideoAfterFailure = useCallback(() => {
    setReload(Date.now());
    setTapToRetryVisible(false);
  }, []);

  return (
    <div className={classnames('video-js-parent', { 'video-js-parent--ios': IS_IOS })} ref={containerRef}>
      <OdyseeSkin
        isLivestream={Boolean(isLivestream)}
        isMarkdownOrComment={isMarkdownOrComment}
        onToggleTheaterMode={toggleVideoTheaterMode}
        videoTheaterMode={videoTheaterMode}
        onToggleAutoplayNext={onToggleAutoplayNext}
        autoplayNext={autoplayNext}
        floatingPlayer={floatingPlayer}
        onToggleFloatingPlayer={onToggleFloatingPlayer}
        autoplayMedia={autoplayMedia}
        onToggleAutoplayMedia={onToggleAutoplayMedia}
        onPlayNext={playNext}
        onPlayPrevious={playPrevious}
        canPlayNext={canPlayNext}
        canPlayPrevious={canPlayPrevious}
        defaultQuality={defaultQuality}
        originalVideoWidth={claimValues?.video?.width}
        originalVideoHeight={claimValues?.video?.height}
        title={title}
        description={claimValues?.description}
        isFloating={isFloating}
      >
        {resolvedSource && (
          <Video
            ref={videoRef}
            src={resolvedSource.src}
            poster={isAudio ? poster : ''}
            playsInline
            crossOrigin="anonymous"
            className={classnames({ livestreamPlayer: isLivestream })}
          >
            {resolvedSource.thumbnailBasePath && !IS_MOBILE && (
              <track
                kind="metadata"
                label="thumbnails"
                default
                src={resolvedSource.thumbnailBasePath + '/stream_sprite.vtt'}
              />
            )}
          </Video>
        )}

        {isMobile && <MobileTouchOverlay />}
      </OdyseeSkin>

      {tapToUnmuteVisible && (
        <Button
          label={__('Tap to unmute')}
          button="link"
          icon={ICONS.VOLUME_MUTED}
          className="video-js--tap-to-unmute"
          onClick={unmuteAndHideHint}
        />
      )}
      {tapToRetryVisible && (
        <Button
          label={__('Retry')}
          button="link"
          icon={ICONS.REFRESH}
          className="video-js--tap-to-unmute"
          onClick={retryVideoAfterFailure}
        />
      )}
    </div>
  );
}

// $FlowFixMe
export default React.memo(function VideoJs(props: Props) {
  return (
    <Player.Provider>
      <VideoJsInner {...props} />
    </Player.Provider>
  );
});
