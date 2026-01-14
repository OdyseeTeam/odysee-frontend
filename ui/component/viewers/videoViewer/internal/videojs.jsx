// @flow
import 'videojs-contrib-ads'; // must be loaded in this order
import 'videojs-ima'; // loads directly after contrib-ads
import 'videojs-vtt-thumbnails';
import 'video.js/dist/alt/video-js-cdn.min.css';
import './keyboard-shortcuts-overlay.scss';
import './plugins/videojs-mobile-ui/plugin';
import '@silvermine/videojs-chromecast/dist/silvermine-videojs-chromecast.css';
import '@silvermine/videojs-airplay/dist/silvermine-videojs-airplay.css';
import * as ICONS from 'constants/icons';
import { VIDEO_PLAYBACK_RATES, VJS_EVENTS } from 'constants/player';
import * as OVERLAY from './overlays';
import Button from 'component/button';
import classnames from 'classnames';
import events from './videojs-events';
import eventTracking from 'videojs-event-tracking';
import functions from './videojs-functions';
import hlsQualitySelector from './plugins/videojs-hls-quality-selector/plugin';
import keyboardShorcuts from './videojs-shortcuts';
import { ensureKeyboardShortcutsOverlay } from './keyboard-shortcuts-overlay';
import Chromecast from './chromecast';
import playerjs from 'player.js';
import qualityLevels from 'videojs-contrib-quality-levels';
import React, { useEffect, useRef, useState } from 'react';
import i18n from './plugins/videojs-i18n/plugin';
import recsys from './plugins/videojs-recsys/plugin';
import settingsMenu from './plugins/videojs-settings-menu/plugin';
import timeMarkerPlugin from './plugins/videojs-time-marker/plugin';
import watchdog from './plugins/videojs-watchdog/plugin';
import snapshotButton from './plugins/videojs-snapshot-button/plugin';

// import runAds from './ads';
import videojs from 'video.js';
import { useIsMobile } from 'effects/use-screensize';
import { platform } from 'util/platform';
import Lbry from 'lbry';
import { Lbryio } from 'lbryinc';

import { getStripeEnvironment } from 'util/stripe';
import { useHistory } from 'react-router';
const stripeEnvironment = getStripeEnvironment();

require('@silvermine/videojs-chromecast')(videojs);
require('@silvermine/videojs-airplay')(videojs);

export type Player = {
  // -- custom --
  appState?: VideojsClientState,
  claimSrcOriginal: ?{ src: string, type: string },
  claimSrcVhs: ?{ src: string, type: string },
  isLivestream?: boolean,
  chaptersInfo?: Array<{ seconds: number, label: string }>,
  // -- plugins ---
  mobileUi: (any) => void,
  chromecast: (any) => void,
  overlay: (any) => void,
  hlsQualitySelector: ?any,
  i18n: (any) => void,
  // -- base videojs --
  controlBar: {
    addChild: (string | any, ?any, ?number) => void,
    getChild: (string) => void,
    removeChild: (string) => void,
  },
  loadingSpinner: any,
  autoplay: (any) => boolean,
  tech: (?boolean) => { vhs: ?any },
  clearInterval: (id: number) => void,
  currentTime: (?number) => number,
  dispose: () => void,
  duration: () => number,
  ended: () => boolean,
  error: () => any,
  exitFullscreen: () => boolean,
  getChild: (string) => any,
  isFullscreen: () => boolean,
  muted: (?boolean) => boolean,
  on: (string, (any) => void) => void,
  off: (string, ?(any) => void) => void,
  one: (string, (any) => void) => void,
  play: () => Promise<any>,
  playbackRate: (?number) => number,
  keyboardShortcutsOverlay?: {
    open: () => void,
    close: () => void,
    toggle: (forceState?: boolean) => void,
    isOpen: () => boolean,
  },
  toggleKeyboardShortcutsOverlay?: (forceState?: boolean) => void,
  readyState: () => number,
  requestFullscreen: () => boolean,
  setInterval: (any, number) => number,
  src: ({ src: string, type: string }) => ?string,
  currentSrc: () => string,
  userActive: (?boolean) => boolean,
  videoWidth: () => number,
  videoHeight: () => number,
  volume: (?number) => number,
};

type Props = {
  adUrl: ?string,
  allowPreRoll: ?boolean,
  claimId: ?string,
  title: ?string,
  channelTitle: string,
  embedded: boolean, // `/$/embed`
  embeddedInternal: boolean, // Markdown (Posts and Comments)
  internalFeatureEnabled: ?boolean,
  isAudio: boolean,
  poster: ?string,
  shareTelemetry: boolean,
  source: string,
  sourceType: string,
  startMuted: boolean,
  userId: ?number,
  defaultQuality: ?string,
  onPlayerReady: (Player, any) => void,
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
  autoPlayNextShort: boolean,
};

const VIDEOJS_VOLUME_PANEL_CLASS = 'VolumePanel';

const IS_IOS = platform.isIOS();
const IS_MOBILE = platform.isMobile();

const HLS_FILETYPE = 'application/x-mpegURL';

const PLUGIN_MAP = {
  eventTracking: eventTracking,
  hlsQualitySelector: hlsQualitySelector,
  qualityLevels: qualityLevels,
  recsys: recsys,
  i18n: i18n,
  settingsMenu: settingsMenu,
  watchdog: watchdog,
  snapshotButton: snapshotButton,
  timeMarkerPlugin: timeMarkerPlugin,
};

Object.entries(PLUGIN_MAP).forEach(([pluginName, plugin]) => {
  if (!Object.keys(videojs.getPlugins()).includes(pluginName)) {
    videojs.registerPlugin(pluginName, plugin);
  }
});

// ****************************************************************************
// VideoJs
// ****************************************************************************

/*
properties for this component should be kept to ONLY those that if changed should REQUIRE an entirely new videojs element
 */
export default React.memo<Props>(function VideoJs(props: Props) {
  const {
    // adUrl, // TODO: this ad functionality isn't used, can be pulled out
    // allowPreRoll,
    claimId,
    title,
    channelTitle,
    embedded,
    embeddedInternal,
    // internalFeatureEnabled, // for people on the team to test new features internally
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
    autoPlayNextShort,
  } = props;

  const isMobile = useIsMobile();

  const playerRef = useRef();
  const containerRef = useRef();
  const tapToUnmuteRef = useRef();
  const tapToRetryRef = useRef();
  const playerServerRef = useRef();
  const volumePanelRef = useRef();

  const keyDownHandlerRef = useRef();
  const keyUpHandlerRef = useRef();
  const keyStateResetHandlerRef = useRef();
  const videoScrollHandlerRef = useRef();
  const volumePanelScrollHandlerRef = useRef();

  const { videoUrl: livestreamVideoUrl } = activeLivestreamForChannel || {};
  const overrideNativeVhs = !platform.isIOS();

  const {
    location: { search },
  } = useHistory();

  const toggleKeyboardShortcutsOverlay = (forceState?: boolean) => {
    if (playerRef.current && typeof playerRef.current.toggleKeyboardShortcutsOverlay === 'function') {
      playerRef.current.toggleKeyboardShortcutsOverlay(forceState);
    }
  };

  // initiate keyboard shortcuts
  const {
    createKeyDownShortcutsHandler,
    createKeyUpShortcutsHandler,
    createKeyStateResetHandler,
    createVideoScrollShortcutsHandler,
    createVolumePanelScrollShortcutsHandler,
  } = keyboardShorcuts({
    isMobile,
    isLivestreamClaim,
    toggleVideoTheaterMode,
    toggleKeyboardShortcutsOverlay,
    playNext,
    playPrevious,
  });

  const [reload, setReload] = useState('initial');

  const { createVideoPlayerDOM } = functions({ isAudio });
  const urlParams = new URLSearchParams(search);
  const isShortsParam = urlParams.get('view') === 'shorts';

  const { unmuteAndHideHint, retryVideoAfterFailure, initializeEvents } = events({
    tapToUnmuteRef,
    tapToRetryRef,
    setReload,
    playerRef,
    claimValues,
    userId,
    claimId,
    embedded,
    doAnalyticsViewForUri,
    doAnalyticsBuffer,
    claimRewards,
    uri,
    playerServerRef,
    isLivestreamClaim,
    channelTitle,
    isShortsParam,
    autoPlayNextShort,
  });

  const videoJsOptions = {
    preload: 'auto',
    playbackRates: VIDEO_PLAYBACK_RATES,
    responsive: true,
    controls: true,
    html5: {
      ...(videojs.browser.IS_ANY_SAFARI ? { nativeTextTracks: false } : {}),
      vhs: {
        overrideNative: overrideNativeVhs, // !videojs.browser.IS_ANY_SAFARI,
        enableLowInitialPlaylist: false,
        fastQualityChange: true,
        useDtsForTimestampOffset: true,
      },
    },
    liveTracker: {
      trackingThreshold: 0,
      liveTolerance: 10,
    },
    inactivityTimeout: 2000,
    muted: startMuted,
    plugins: { eventTracking: true, overlay: OVERLAY.OVERLAY_DATA },
    controlBar: {
      currentTimeDisplay: true,
      timeDivider: true,
      durationDisplay: true,
      playbackRateMenuButton: false,
      settingMenuButton: true,
      remainingTimeDisplay: true,
      subsCapsButton: !IS_IOS,
    },
    techOrder: ['chromecast', 'html5'],
    ...Chromecast.getOptions(),
    suppressNotSupportedError: true,
    liveui: true,
  };

  // TODO: would be nice to pull this out into functions file
  // Initialize video.js
  function initializeVideoPlayer(domElement) {
    if (!domElement) return;

    const vjs = videojs(domElement, videoJsOptions, async () => {
      const player = playerRef.current;
      const adapter = new playerjs.VideoJSAdapter(player);

      // this seems like a weird thing to have to check for here
      if (!player) return;

      player.appState = {};

      if (typeof player.reloadSourceOnError === 'function') {
        player.reloadSourceOnError({ errorInterval: 10 });
      }

      if (typeof player.mobileUi === 'function') {
        player.mobileUi({
          fullscreen: {
            enterOnRotate: false,
          },
          touchControls: {
            seekSeconds: 10,
          },
        });
      }

      if (typeof player.i18n === 'function') player.i18n();
      if (typeof player.settingsMenu === 'function') player.settingsMenu();
      if (typeof player.timeMarkerPlugin === 'function') player.timeMarkerPlugin();
      if (typeof player.hlsQualitySelector === 'function') {
        player.hlsQualitySelector({ displayCurrentQuality: true });
      }

      // Add recsys plugin
      if (shareTelemetry && typeof player.recsys === 'function') {
        player.recsys({
          videoId: claimId,
          userId: userId,
          embedded: embedded || embeddedInternal,
        });
      }

      // immediately show control bar while video is loading
      player.userActive(true);

      adapter.ready();

      // Initialize Chromecast if plugin is available
      if (typeof player.chromecast === 'function') {
        try {
          Chromecast.initialize(player);
        } catch (e) {
          console.warn('Failed to initialize Chromecast:', e);
        }
      }

      if (typeof player.airPlay === 'function') player.airPlay();

      if (typeof player.watchdog === 'function') {
        player.watchdog({
          timeoutMs: 15000,
          livestreamsOnly: true,
          action: () => setReload(Date.now()),
        });
      }
    });

    // fixes #3498 (https://github.com/lbryio/lbry-desktop/issues/3498)
    // summary: on firefox the focus would stick to the fullscreen button which caused buggy behavior with spacebar
    vjs.on('fullscreenchange', () => document.activeElement && document.activeElement.blur());

    return vjs;
  }

  // useEffect(() => {
  //   if (showQualitySelector) {
  //     // Add quality selector to player
  //     const player = playerRef.current;
  //     if (player) player.hlsQualitySelector({ displayCurrentQuality: true });
  //   }
  // }, [showQualitySelector]);

  useEffect(() => {
    Chromecast.updateTitles(title, channelTitle);
  }, [title, channelTitle]);

  // Update livestream source when activeLivestreamForChannel becomes available
  // This is separate from the main useEffect to avoid player disposal/recreation on embeds
  useEffect(() => {
    const isLivestream = isLivestreamClaim && userClaimId;
    if (!isLivestream || !window.player) return;

    const videoUrl = activeLivestreamForChannel?.videoUrl;
    if (videoUrl && !window.player.currentSrc()) {
      window.player.src({ type: 'application/x-mpegurl', src: videoUrl });
      window.player.load();
    }
  }, [activeLivestreamForChannel, isLivestreamClaim, userClaimId]);

  // This lifecycle hook is only called once (on mount), or when `isAudio` or `source` changes.
  useEffect(() => {
    (async function () {
      let vjsPlayer;
      const vjsParent = document.querySelector('.video-js-parent');

      // Reuse the saved player DOM only when appropriate. Reusing across embed routes
      // has been observed to cause lockups; keep reuse enabled for popout.
      const path = (typeof window !== 'undefined' && window.location && window.location.pathname) || '';
      const isPopoutRoute = path.startsWith('/$/popout');
      const isEmbedRoute = path.startsWith('/$/embed/');
      let canUseOldPlayer = window.oldSavedDiv && vjsParent && (!isEmbedRoute || isPopoutRoute);
      const isLivestream = isLivestreamClaim && userClaimId;

      // initialize videojs if it hasn't been done yet
      if (!canUseOldPlayer) {
        // Dispose old player if it exists to prevent "already initialised" conflicts
        if (window.player && typeof window.player.dispose === 'function') {
          try {
            Chromecast.cleanup(window.player);
            // Cleanup AirPlay plugin (same @silvermine package as Chromecast)
            const airPlayPlugin = window.player.airPlay_;
            if (airPlayPlugin && typeof airPlayPlugin.dispose === 'function') {
              airPlayPlugin.dispose();
            }
            window.player.dispose();
          } catch (e) {
            console.warn('Failed to dispose old player:', e);
          }
          window.player = null;
          window.oldSavedDiv = null;
        }

        const vjsElement = createVideoPlayerDOM(containerRef.current);
        vjsPlayer = initializeVideoPlayer(vjsElement);
        if (!vjsPlayer) {
          return;
        }

        // Add reference to player to global scope
        window.player = vjsPlayer;
        doSetVideoSourceLoaded(uri);
      } else {
        vjsPlayer = window.player;
      }

      // Guard: player must exist before proceeding
      if (!vjsPlayer) {
        return;
      }

      // hide unused elements on livestream
      if (isLivestream) {
        vjsPlayer.addClass('vjs-live');
        vjsPlayer.addClass('vjs-liveui');
        // $FlowIssue
        vjsPlayer.controlBar.currentTimeDisplay?.el().style.setProperty('display', 'none', 'important');
        // $FlowIssue
        vjsPlayer.controlBar.timeDivider?.el().style.setProperty('display', 'none', 'important');
        // $FlowIssue
        vjsPlayer.controlBar.durationDisplay?.el().style.setProperty('display', 'none', 'important');
      } else {
        vjsPlayer.removeClass('vjs-live');
        vjsPlayer.removeClass('vjs-liveui');
        // $FlowIssue
        vjsPlayer.controlBar.currentTimeDisplay?.el().style.setProperty('display', 'block', 'important');
        // $FlowIssue
        vjsPlayer.controlBar.timeDivider?.el().style.setProperty('display', 'block', 'important');
        // $FlowIssue
        vjsPlayer.controlBar.durationDisplay?.el().style.setProperty('display', 'block', 'important');
      }

      // Add recsys plugin
      if (shareTelemetry) {
        vjsPlayer.recsys.options_ = {
          videoId: claimId,
          userId: userId,
          embedded: embedded || embeddedInternal,
        };

        vjsPlayer.recsys.lastTimeUpdate = null;
        vjsPlayer.recsys.currentTimeUpdate = null;
        vjsPlayer.recsys.inPause = false;
        vjsPlayer.recsys.watchedDuration = { total: 0, lastTimestamp: -1 };
      }

      vjsPlayer.bigPlayButton && vjsPlayer.bigPlayButton.hide();

      // I think this is a callback function
      const videoNode = containerRef.current && containerRef.current.querySelector('video, audio');

      // add theatre and autoplay next button and initiate player events
      onPlayerReady(vjsPlayer, videoNode);

      // Set reference in component state
      playerRef.current = vjsPlayer;
      ensureKeyboardShortcutsOverlay(vjsPlayer);

      initializeEvents();

      // volume control div, used for changing volume when scrolled over
      // $FlowIssue
      volumePanelRef.current = playerRef.current?.controlBar?.getChild(VIDEOJS_VOLUME_PANEL_CLASS)?.el();

      const keyDownHandler = createKeyDownShortcutsHandler(playerRef, containerRef);
      const keyUpHandler = createKeyUpShortcutsHandler(playerRef, containerRef);
      const keyStateResetHandler = createKeyStateResetHandler(playerRef);
      const videoScrollHandler = createVideoScrollShortcutsHandler(playerRef, containerRef);
      const volumePanelHandler = createVolumePanelScrollShortcutsHandler(volumePanelRef, playerRef, containerRef);
      window.addEventListener('keydown', keyDownHandler);
      window.addEventListener('keyup', keyUpHandler);
      window.addEventListener('blur', keyStateResetHandler);
      (document: any).addEventListener('visibilitychange', keyStateResetHandler);
      const containerDiv = containerRef.current;
      containerDiv && containerDiv.addEventListener('wheel', videoScrollHandler);
      if (volumePanelRef.current) volumePanelRef.current.addEventListener('wheel', volumePanelHandler);

      keyDownHandlerRef.current = keyDownHandler;
      keyUpHandlerRef.current = keyUpHandler;
      keyStateResetHandlerRef.current = keyStateResetHandler;
      videoScrollHandlerRef.current = videoScrollHandler;
      volumePanelScrollHandlerRef.current = volumePanelHandler;

      // $FlowIssue
      vjsPlayer.controlBar?.show();

      vjsPlayer.poster(poster);
      // Ensure the poster gets shown (sometimes audio player stays blank with autoplay media files enabled)
      setTimeout(() => {
        const setPoster = () => {
          if (vjsPlayer && typeof vjsPlayer.poster === 'function') {
            vjsPlayer.poster('');
            vjsPlayer.poster(poster);
          }
        };
        setPoster();
        // One extra try just in case
        setTimeout(setPoster, 2000);
      }, 1500);

      vjsPlayer.el().childNodes[0].setAttribute('playsinline', '');

      let contentUrl;
      // TODO: pull this function into videojs-functions
      // determine which source to use and load it
      if (isLivestream) {
        vjsPlayer.isLivestream = true;
        vjsPlayer.addClass('livestreamPlayer');

        // get the protected url if needed
        if (isProtectedContent && activeLivestreamForChannel) {
          const protectedLivestreamResponse = await Lbry.get({
            uri: activeLivestreamForChannel.uri,
            base_streaming_url: activeLivestreamForChannel.videoUrl,
            environment: stripeEnvironment,
          });

          // Guard: player may have been disposed during async operation
          if (!vjsPlayer || vjsPlayer.isDisposed()) return;

          vjsPlayer.src({ HLS_FILETYPE, src: protectedLivestreamResponse.streaming_url });
        } else if (livestreamVideoUrl) {
          vjsPlayer.src({ HLS_FILETYPE, src: livestreamVideoUrl });
        }
      } else {
        vjsPlayer.isLivestream = false;
        vjsPlayer.removeClass('livestreamPlayer');

        const response = await fetch(source, { method: 'HEAD', cache: 'no-store' });

        // Guard: player may have been disposed during async operation
        if (!vjsPlayer || vjsPlayer.isDisposed()) return;

        playerServerRef.current = response.headers.get('x-powered-by');
        vjsPlayer.claimSrcOriginal = { type: sourceType, src: source };

        // remove query params for secured endpoints (which have query params on end of m3u8 path)
        let trimmedUrl = new URL(response.url);
        trimmedUrl.hash = '';
        trimmedUrl.search = '';
        trimmedUrl = trimmedUrl.toString();

        // change to m3u8 if applicable
        if (response && response.redirected && response.url && trimmedUrl.endsWith('m3u8') && response.status < 400) {
          vjsPlayer.claimSrcVhs = { type: HLS_FILETYPE, src: response.url };
          vjsPlayer.src(vjsPlayer.claimSrcVhs);

          contentUrl = response.url;
        } else {
          if (source) vjsPlayer.src(vjsPlayer.claimSrcOriginal);
        }

        // Log possible errors
        if (response.status >= 400) {
          Lbryio.call('event', 'desktop_error', {
            error_message: `PlayerSourceLoadError: Url: ${response.url} 
            | Redirected: ${String(response.redirected)}
            | Status: ${response.status}
            | X-Powered-By: ${playerServerRef.current ? playerServerRef.current : 'header missing'}`,
          });
        }
      }

      doSetVideoSourceLoaded(uri);

      // Guard: player may have been disposed during async operations
      if (!vjsPlayer || vjsPlayer.isDisposed()) return;

      // bugfix thumbnails showing up if new video doesn't have them
      if (typeof vjsPlayer.vttThumbnails?.detach === 'function') {
        vjsPlayer.vttThumbnails.detach();
      }

      // initialize hover thumbnails
      if (contentUrl) {
        const trimmedPath = contentUrl.substring(0, contentUrl.lastIndexOf('/'));
        const thumbnailPath = trimmedPath + '/stream_sprite.vtt';

        // progress bar hover thumbnails
        if (!IS_MOBILE) {
          // if src is a function, it's already been initialized
          if (typeof vjsPlayer.vttThumbnails.src === 'function') {
            vjsPlayer.vttThumbnails.src(thumbnailPath);
          } else {
            // otherwise, initialize plugin
            vjsPlayer.vttThumbnails({
              src: thumbnailPath,
              showTimestamp: true,
            });
          }
        }
      }

      // Pass data required by plugins from redux to player, then trigger.
      vjsPlayer.appState = {
        ...vjsPlayer.appState,
        defaultQuality: defaultQuality,
        originalVideoHeight: claimValues?.video?.height,
      };

      vjsPlayer.trigger(VJS_EVENTS.SRC_CHANGED);

      vjsPlayer.load();

      if (isShortsParam && isMobile) {
        vjsPlayer.muted(false);

        vjsPlayer.on('play', () => {
          // $FlowIssue
          vjsPlayer?.muted(false);
        });
        vjsPlayer.on('loadedmetadata', () => {
          // $FlowIssue
          vjsPlayer?.muted(false);
        });
      }

      if (canUseOldPlayer) {
        // $FlowIssue
        document.querySelector('.video-js-parent')?.append(window.oldSavedDiv);
      }

      if (!isAudio) {
        vjsPlayer.snapshotButton({ fileTitle: title, poster });
      }

      // disable right-click (context-menu) for purchased content
      if (isPurchasableContent || isRentableContent || isProtectedContent || isUnlisted || isDownloadDisabled) {
        const player = document.querySelector('video.vjs-tech');
        if (player) player.setAttribute('oncontextmenu', 'return false;');
      }

      // allow tap to unmute if no perms on iOS
      const promise = vjsPlayer.play();

      window.player.userActive(true);

      if (promise !== undefined) {
        promise
          .then((_) => {
            // $FlowIssue
            vjsPlayer?.controlBar.el().classList.add('vjs-transitioning-video');

            // $FlowIssue
            if (isShortsParam && vjsPlayer?.muted()) {
              setTimeout(() => {
                // $FlowIssue
                vjsPlayer?.muted(false);
                // $FlowIssue
                vjsPlayer?.volume(1.0);
              }, 100);
            }
          })
          .catch((error) => {
            const noPermissionError = typeof error === 'object' && error.name && error.name === 'NotAllowedError';

            const attributes = ['font-weight:bold', 'color:pink'];
            console.log(`%c---play() disallowed---\n${error}`, attributes.join(';')); // eslint-disable-line no-console

            if (noPermissionError) {
              if (IS_IOS || isShortsParam) {
                // autoplay not allowed, mute video, play and show 'tap to unmute' button
                // $FlowIssue
                vjsPlayer?.muted(true);
                // $FlowIssue
                const mutedPlayPromise = vjsPlayer?.play();
                if (mutedPlayPromise !== undefined) {
                  mutedPlayPromise
                    .then(() => {
                      const tapToUnmuteButton = document.querySelector('.video-js--tap-to-unmute');
                      // $FlowIssue
                      tapToUnmuteButton?.style.setProperty('visibility', 'visible');
                      // $FlowIssue
                      tapToUnmuteButton?.style.setProperty('display', 'inline', 'important');
                    })
                    .catch((error) => {
                      // $FlowFixMe
                      vjsPlayer?.addClass('vjs-paused');
                      // $FlowFixMe
                      vjsPlayer?.addClass('vjs-has-started');

                      // $FlowFixMe
                      document.querySelector('.vjs-touch-overlay')?.classList.add('show-play-toggle');
                      // $FlowFixMe
                      document.querySelector('.vjs-play-control')?.classList.add('vjs-paused');
                    });
                }
              } else {
                // $FlowIssue
                vjsPlayer?.bigPlayButton?.show();
              }
            }
          });
      }
    })();

    // Cleanup
    return () => {
      window.removeEventListener('keydown', keyDownHandlerRef.current);
      window.removeEventListener('keyup', keyUpHandlerRef.current);
      window.removeEventListener('blur', keyStateResetHandlerRef.current);
      (document: any).removeEventListener('visibilitychange', keyStateResetHandlerRef.current);

      // eslint-disable-next-line react-hooks/exhaustive-deps -- FIX_THIS!
      const containerDiv = containerRef.current;

      // $FlowFixMe
      containerDiv && containerDiv.removeEventListener('wheel', videoScrollHandlerRef.current);

      if (volumePanelRef.current) {
        volumePanelRef.current.removeEventListener('wheel', volumePanelScrollHandlerRef.current);
      }

      const player = playerRef.current;

      if (player) {
        try {
          window.cast.framework.CastContext.getInstance().getCurrentSession().endSession(false);
        } catch {}

        window.player.userActive(false);
        window.player.pause();

        if (IS_IOS) {
          // $FlowIssue
          window.player.controlBar?.playToggle?.hide();
        }

        // this solves an issue with portrait videos
        // $FlowIssue
        const videoDiv = window.player?.tech_?.el(); // video element
        if (videoDiv) videoDiv.style.top = '0px';

        window.player.controlBar.el().classList.add('vjs-transitioning-video');

        window.oldSavedDiv = window.player.el();

        window.player.trigger(VJS_EVENTS.PLAYER_CLOSED);

        // stop streams running in background
        window.player.loadTech_('html5', null);

        window.player.currentTime(0);

        // makes the current time update immediately
        window.player.trigger('timeupdate');

        window.player.claimSrcVhs = null;

        delete window.videoFps;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- @see TODO_NEED_VERIFICATION
  }, [isAudio, source, reload, userClaimId, isLivestreamClaim]);

  return (
    <div className={classnames('video-js-parent', { 'video-js-parent--ios': IS_IOS })} ref={containerRef}>
      {!isShortsParam && (
        <Button
          label={__('Tap to unmute')}
          button="link"
          icon={ICONS.VOLUME_MUTED}
          className="video-js--tap-to-unmute"
          onClick={unmuteAndHideHint}
          ref={tapToUnmuteRef}
        />
      )}
      <Button
        label={__('Retry')}
        button="link"
        icon={ICONS.REFRESH}
        className="video-js--tap-to-unmute"
        onClick={() => retryVideoAfterFailure(true)}
        ref={tapToRetryRef}
      />
    </div>
  );
});
