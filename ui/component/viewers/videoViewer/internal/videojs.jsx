// @flow
import 'scss/component/_videojs-skin.scss';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Video } from '@videojs/react/video';
import Hls from 'hls.js';
import Player from './player';
import OdyseeSkin from './OdyseeSkin';
import useResolvedSource from './hooks/useResolvedSource';
import useRecsys from './hooks/useRecsys';
import {
  fullscreenElement as getFullscreenElement,
  requestFullscreen,
  exitFullscreen,
  onFullscreenChange,
} from 'util/full-screen';
import useEventTracking from './hooks/useEventTracking';
import useWatchdog from './hooks/useWatchdog';
import useErrorRecovery from './hooks/useErrorRecovery';
import useLivestreamEdge from './hooks/useLivestreamEdge';
import useMediaSession from './hooks/useMediaSession';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import useAnalytics from './hooks/useAnalytics';
import useChromecast, { isCastSessionActive } from './hooks/useChromecast';
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
  thumbnail: ?string,
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
    thumbnail,
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
  useErrorRecovery(resolvedSource?.src, setReload, setTapToRetryVisible);
  useLivestreamEdge(Boolean(isLivestream));
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
  const { castAvailable, isCasting, castState, castActions } = useChromecast();
  const castStateRef = useRef(castState);
  castStateRef.current = castState;

  const onCastToggle = useCallback(() => {
    if (isCasting) {
      const resumeTime = castStateRef.current.currentTime;
      castActions.stop();
      if (media) {
        media.currentTime = resumeTime;
        media.play();
      }
    } else {
      const cast = window.cast;
      const ctx = cast && cast.framework && cast.framework.CastContext && cast.framework.CastContext.getInstance();
      if (ctx) ctx.requestSession();
    }
  }, [isCasting, castActions, media]);

  const castLoadedSrcRef = useRef(null);
  const castSrc = resolvedSource ? resolvedSource.src : null;
  useEffect(() => {
    if (isCasting && castSrc && castSrc !== castLoadedSrcRef.current) {
      castLoadedSrcRef.current = castSrc;
      const contentType = castSrc.includes('.m3u8') ? 'application/x-mpegURL' : 'video/mp4';
      const currentTime = media ? media.currentTime : 0;
      castActions.loadMedia(castSrc, title, channelTitle, poster, contentType, currentTime);
      if (media) media.pause();
    }
    if (!isCasting) {
      castLoadedSrcRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCasting, castSrc]);

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
      ...(isLivestreamClaim
        ? {
            liveSyncDuration: 4,
            liveMaxLatencyDuration: 10,
          }
        : undefined),
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
    if (isCastSessionActive()) return;

    const docEl = document.documentElement;
    const attemptPlay = () => {
      const playPromise = media.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            if (docEl) docEl.removeAttribute('data-shorts-transitioning');
          })
          .catch((error) => {
            if (docEl) docEl.removeAttribute('data-shorts-transitioning');
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

    const hls = media._hls;
    if (hls) {
      const onReady = () => {
        hls.off(Hls.Events.MANIFEST_PARSED, onReady);
        media.removeEventListener('canplay', onReady);
        attemptPlay();
      };
      hls.on(Hls.Events.MANIFEST_PARSED, onReady);
      media.addEventListener('canplay', onReady, { once: true });
    } else {
      attemptPlay();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media, resolvedSource?.src]);

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
    let videoHoverForwarder: any = null;
    const handleFullscreenChange = () => {
      const fsTarget = document.querySelector('.player-fullscreen-target');

      if (fsTarget && getFullscreenElement() === fsTarget) {
        videoHoverForwarder = (e) => {
          if (e.target && e.target.closest && e.target.closest('.media-default-skin')) return;
          const skin = fsTarget.querySelector('.media-default-skin');
          if (skin) skin.dispatchEvent(new PointerEvent('pointermove', { bubbles: true }));
        };
        // $FlowFixMe
        fsTarget.addEventListener('pointermove', videoHoverForwarder);
      } else if (videoHoverForwarder && fsTarget) {
        fsTarget.removeEventListener('pointermove', videoHoverForwarder);
        videoHoverForwarder = null;
      }
    };

    onFullscreenChange(document, 'add', handleFullscreenChange);
    return () => {
      onFullscreenChange(document, 'remove', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (IS_MOBILE) return;
    const container = containerRef.current;
    if (!container) return;

    const handleDblClick = (e: MouseEvent) => {
      if (e.target instanceof Element && e.target.closest('.media-controls')) return;
      const fsEl = getFullscreenElement();
      if (fsEl) {
        exitFullscreen();
      } else {
        const target = container.closest('.player-fullscreen-target');
        if (target) requestFullscreen(target);
      }
    };

    container.addEventListener('dblclick', handleDblClick);
    return () => container.removeEventListener('dblclick', handleDblClick);
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
        embedded={embedded}
        uri={uri}
        castAvailable={castAvailable}
        isCasting={isCasting}
        onCastToggle={onCastToggle}
        castState={castState}
        castActions={castActions}
      >
        {isCasting && thumbnail && <img src={thumbnail} className="odysee-cast-thumbnail" alt="" />}

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

        {IS_MOBILE && !embedded && (
          <MobileTouchOverlay
            onPlayNext={playNext}
            onPlayPrevious={playPrevious}
            canPlayNext={canPlayNext}
            canPlayPrevious={canPlayPrevious}
            isCasting={isCasting}
            castState={castState}
            castActions={castActions}
          />
        )}
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
