// @flow
import 'videojs-contrib-ads'; // must be loaded in this order
import 'videojs-ima'; // loads directly after contrib-ads
import 'videojs-vtt-thumbnails';
import 'video.js/dist/alt/video-js-cdn.min.css';
import './internal/plugins/videojs-mobile-ui/plugin';
import '@silvermine/videojs-chromecast/dist/silvermine-videojs-chromecast.css';
import '@silvermine/videojs-airplay/dist/silvermine-videojs-airplay.css';

import * as ICONS from 'constants/icons';

import { useIsMobile } from 'effects/use-screensize';
import { useHistory } from 'react-router-dom';
import { platform } from 'util/platform';
import { DEFAULT_VIDEO_JS_OPTIONS, VIDEOJS_VOLUME_PANEL_CLASS } from 'constants/player';
import { EmbedContext } from 'page/embedWrapper/view';

import Button from 'component/button';
import classnames from 'classnames';
import events from './internal/videojs-events';
import eventTracking from 'videojs-event-tracking';
import hlsQualitySelector from './internal/plugins/videojs-hls-quality-selector/plugin';
import keyboardShorcuts from './internal/videojs-shortcuts';
import LbryPlaybackRateMenuButton from './internal/lbry-playback-rate';
import Chromecast from './internal/chromecast';
import playerjs from 'player.js';
import qualityLevels from 'videojs-contrib-quality-levels';
import React from 'react';
import i18n from './internal/plugins/videojs-i18n/plugin';
import recsys from './internal/plugins/videojs-recsys/plugin';
import watchdog from './internal/plugins/videojs-watchdog/plugin';
import videojs from 'video.js';
import usePersistedState from 'effects/use-persisted-state';
import useFetchStreamingSrc from './internal/effects/use-fetch-src';

require('@silvermine/videojs-chromecast')(videojs);
require('@silvermine/videojs-airplay')(videojs);

const IS_IOS = platform.isIOS();
const IS_IPHONE = platform.isIPhone();

const PLUGIN_MAP = {
  eventTracking,
  hlsQualitySelector,
  qualityLevels,
  recsys,
  i18n,
  watchdog,
};

type Props = {
  uri: string,
  startMuted: boolean,
  onPlayerReady: (Player, any) => void,
  playNext: () => void,
  playPrevious: () => void,
  // -- redux --
  claimId: ?string,
  claimValues: any,
  title: ?string,
  channelTitle: ?string,
  userId: ?number,
  activeLivestreamForChannel: any,
  defaultQuality: ?string,
  isPurchasableContent: boolean,
  isRentableContent: boolean,
  isProtectedContent: boolean,
  isLivestreamClaim: boolean,
  channelClaimId: ?string,
  isAudio: ?boolean,
  thumbnail: ?string,
  isMarkdownOrComment: boolean,
  windowPlayerObj: any,
  doAnalyticsBuffer: (string, any) => void,
  doAnalyticsView: (string, number) => void,
  doClaimEligiblePurchaseRewards: () => void,
  doToast: (params: { message: string, linkText: string, linkTarget: string }) => void,
  doSetWindowPlayerObj: (element: any) => void,
  toggleVideoTheaterMode: () => void,
};

// properties for this component should be kept to ONLY those that if changed should REQUIRE an entirely new videojs element
export default React.memo<Props>(function VideoJs(props: Props) {
  const {
    uri,
    startMuted,
    onPlayerReady,
    playNext,
    playPrevious,
    // -- redux --
    claimId,
    claimValues,
    title,
    channelTitle,
    userId,
    activeLivestreamForChannel,
    defaultQuality,
    isPurchasableContent,
    isRentableContent,
    isProtectedContent,
    isLivestreamClaim,
    channelClaimId,
    isAudio,
    thumbnail,
    isMarkdownOrComment,
    windowPlayerObj,
    doAnalyticsBuffer,
    doAnalyticsView,
    doClaimEligiblePurchaseRewards,
    doToast,
    doSetWindowPlayerObj,
    toggleVideoTheaterMode,
  } = props;

  const embedded = React.useContext(EmbedContext);

  const {
    location: { search },
  } = useHistory();

  const urlParams = new URLSearchParams(search);
  const autoplayParam = urlParams.get('autoplay');
  const autoplay = !embedded || autoplayParam;

  // used to notify about default quality setting
  // if already has a quality set, no need to notify
  const [initialQualityChange, setInitialQualityChange] = usePersistedState('initial-quality-change', !!defaultQuality);
  const [playerElement, setPlayerElement] = React.useState();
  const [playerObj, setPlayerObj] = React.useState();
  const [reload, setReload] = React.useState('initial');

  const isMobile = useIsMobile();

  const alreadyInitialized = React.useRef(Boolean(windowPlayerObj));

  const containerRef = React.useRef<any>();
  const tapToUnmuteRef = React.useRef();
  const tapToRetryRef = React.useRef();
  const playerServerRef = React.useRef();
  const volumePanelRef = React.useRef();

  const keyDownHandlerRef = React.useRef();
  const videoScrollHandlerRef = React.useRef();
  const volumePanelScrollHandlerRef = React.useRef();

  const { url: livestreamVideoUrl } = activeLivestreamForChannel || {};
  const showQualitySelector = (!isLivestreamClaim && !IS_IPHONE) || livestreamVideoUrl;
  const isLivestream = isLivestreamClaim && channelClaimId;
  const playerPoster = isAudio || !autoplay ? thumbnail : '';
  const videoHeight = claimValues?.video?.height;

  const {
    createKeyDownShortcutsHandler,
    createVideoScrollShortcutsHandler,
    createVolumePanelScrollShortcutsHandler,
  } = keyboardShorcuts({ isMobile, toggleVideoTheaterMode, playNext, playPrevious });

  const { unmuteAndHideHint, retryVideoAfterFailure, initializeEvents } = events({
    tapToUnmuteRef,
    tapToRetryRef,
    setReload,
    player: windowPlayerObj,
    claimValues,
    userId,
    claimId,
    embedded,
    doAnalyticsView,
    doAnalyticsBuffer,
    doClaimEligiblePurchaseRewards,
    uri,
    playerServerRef,
    isLivestreamClaim,
    channelTitle,
  });

  const videoJsOptions = React.useMemo(
    () => ({ ...DEFAULT_VIDEO_JS_OPTIONS, ...{ muted: startMuted, bigPlayButton: embedded } }),
    [embedded, startMuted]
  );

  // -- Initialize videoJs Player --
  React.useEffect(() => {
    if (playerElement && !alreadyInitialized.current) {
      const vjs = videojs(playerElement, videoJsOptions, () => {
        Object.entries(PLUGIN_MAP).forEach(([pluginName, plugin]) => {
          if (!Object.keys(videojs.getPlugins()).includes(pluginName)) {
            videojs.registerPlugin(pluginName, plugin);
          }
        });

        alreadyInitialized.current = true;
      });

      setPlayerObj(vjs);
      doSetWindowPlayerObj(vjs);
      initializeVjsPlugins(vjs);
      initializeVjsProperties(vjs);
      initializeEvents(vjs);
    }

    return () => {
      cleanUpVideoJsProperties(playerObj);
      doSetWindowPlayerObj(undefined);
      setPlayerObj(undefined);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doSetWindowPlayerObj, playerElement, videoJsOptions]);
  // -------------------------------

  const initializeVjsPlugins = React.useCallback(
    (vjs: any) => {
      const adapter = new playerjs.VideoJSAdapter(vjs);

      // Add reloadSourceOnError plugin
      vjs.reloadSourceOnError({ errorInterval: 10 });

      // Initialize mobile UI.
      vjs.mobileUi({ fullscreen: { enterOnRotate: false }, touchControls: { seekSeconds: 10 } });

      vjs.i18n();

      // Add quality selector to player
      if (showQualitySelector) {
        vjs.hlsQualitySelector({
          displayCurrentQuality: true,
          originalHeight: videoHeight,
          defaultQuality,
          initialQualityChange,
          setInitialQualityChange,
          doToast,
        });
      }

      // Add recsys plugin
      vjs.recsys({
        videoId: claimId,
        userId: userId,
        embedded: embedded || isMarkdownOrComment,
        options_: { videoId: claimId, userId: userId, embedded: embedded || isMarkdownOrComment },
        lastTimeUpdate: null,
        currentTimeUpdate: null,
        inPause: false,
        watchedDuration: { total: 0, lastTimestamp: -1 },
      });

      adapter.ready();

      Chromecast.initialize(vjs);

      vjs.airPlay();
      vjs.watchdog({ timeoutMs: 30000, livestreamsOnly: true, action: () => setReload(Date.now()) });
    },
    [
      claimId,
      videoHeight,
      defaultQuality,
      doToast,
      embedded,
      initialQualityChange,
      isMarkdownOrComment,
      setInitialQualityChange,
      showQualitySelector,
      userId,
    ]
  );

  React.useEffect(() => {
    Chromecast.updateTitles(title, channelTitle);
  }, [title, channelTitle]);

  const initializeVjsProperties = React.useCallback(
    (vjs: any) => {
      const containerDiv = containerRef.current;

      // immediately show control bar while video is loading
      vjs.userActive(true);

      LbryPlaybackRateMenuButton.replaceExisting(vjs);

      // fixes #3498 (https://github.com/lbryio/lbry-desktop/issues/3498)
      // summary: on firefox the focus would stick to the fullscreen button which caused buggy behavior with spacebar
      vjs.on('fullscreenchange', () => document.activeElement && document.activeElement.blur());

      // hide unused elements on livestream
      if (isLivestream) {
        vjs.addClass('vjs-live');
        vjs.addClass('vjs-liveui');

        vjs.controlBar.currentTimeDisplay &&
          vjs.controlBar.currentTimeDisplay.el().style.setProperty('display', 'none', 'important');

        vjs.controlBar.timeDivider && vjs.controlBar.timeDivider.el().style.setProperty('display', 'none', 'important');

        vjs.controlBar.durationDisplay &&
          vjs.controlBar.durationDisplay.el().style.setProperty('display', 'none', 'important');
      } else {
        vjs.removeClass('vjs-live');
        vjs.removeClass('vjs-liveui');

        vjs.controlBar.currentTimeDisplay &&
          vjs.controlBar.currentTimeDisplay.el().style.setProperty('display', 'block', 'important');

        vjs.controlBar.timeDivider &&
          vjs.controlBar.timeDivider.el().style.setProperty('display', 'block', 'important');

        vjs.controlBar.durationDisplay &&
          vjs.controlBar.durationDisplay.el().style.setProperty('display', 'block', 'important');
      }

      if (vjs.bigPlayButton) {
        if (!embedded) {
          vjs.bigPlayButton.hide();
        } else {
          vjs.bigPlayButton.show();
        }
      }

      // add theatre and autoplay next button and initiate player events
      onPlayerReady(vjs, playerElement);

      // volume control div, used for changing volume when scrolled over
      volumePanelRef.current =
        vjs.controlBar &&
        vjs.controlBar.getChild(VIDEOJS_VOLUME_PANEL_CLASS) &&
        vjs.controlBar.getChild(VIDEOJS_VOLUME_PANEL_CLASS).el();

      const keyDownHandler = createKeyDownShortcutsHandler(vjs);
      const videoScrollHandler = createVideoScrollShortcutsHandler(vjs);
      const volumePanelHandler = createVolumePanelScrollShortcutsHandler(volumePanelRef, vjs);

      window.addEventListener('keydown', keyDownHandler);

      containerDiv && containerDiv.addEventListener('wheel', videoScrollHandler);

      if (volumePanelRef.current) volumePanelRef.current.addEventListener('wheel', volumePanelHandler);

      keyDownHandlerRef.current = keyDownHandler;
      videoScrollHandlerRef.current = videoScrollHandler;
      volumePanelScrollHandlerRef.current = volumePanelHandler;

      vjs.controlBar && vjs.controlBar.show();

      vjs.poster(playerPoster);

      vjs.el().childNodes[0].setAttribute('playsinline', '');

      // disable right-click (context-menu) for purchased content
      if (isPurchasableContent || isRentableContent || isProtectedContent) {
        vjs.setAttribute('oncontextmenu', 'return false;');
      }
    },
    [
      createKeyDownShortcutsHandler,
      createVideoScrollShortcutsHandler,
      createVolumePanelScrollShortcutsHandler,
      embedded,
      isLivestream,
      isProtectedContent,
      isPurchasableContent,
      isRentableContent,
      onPlayerReady,
      playerElement,
      playerPoster,
    ]
  );

  const cleanUpVideoJsProperties = React.useCallback((vjs: any) => {
    const containerDiv = containerRef.current;

    window.removeEventListener('keydown', keyDownHandlerRef.current);

    containerDiv && containerDiv.removeEventListener('wheel', videoScrollHandlerRef.current);

    if (volumePanelRef.current) {
      volumePanelRef.current.removeEventListener('wheel', volumePanelScrollHandlerRef.current);
    }

    const chapterMarkers = document.getElementsByClassName('vjs-chapter-marker');
    while (chapterMarkers.length > 0) {
      chapterMarkers[0].parentNode && chapterMarkers[0].parentNode.removeChild(chapterMarkers[0]);
    }

    if (vjs) {
      try {
        window.cast.framework.CastContext.getInstance().getCurrentSession().endSession(false);
      } catch {}

      vjs.switchedFromDefaultQuality = false;

      vjs.userActive(false);
      vjs.pause();

      if (IS_IOS) {
        vjs.controlBar && vjs.controlBar.playToggle && vjs.controlBar.playToggle.hide();
      }

      // this solves an issue with portrait videos
      const videoDiv = vjs.tech_ && vjs.tech_.el(); // video element
      if (videoDiv) videoDiv.style.top = '0px';

      vjs.controlBar.el().classList.add('vjs-transitioning-video');

      vjs.trigger('playerClosed');

      // stop streams running in background
      vjs.loadTech_('html5', null);

      vjs.currentTime(0);

      // makes the current time update immediately
      vjs.trigger('timeupdate');

      vjs.claimSrcVhs = null;

      delete window.videoFps;
    }
  }, []);

  // --- FETCH STREMING SRC ---
  useFetchStreamingSrc(uri, playerObj, reload, autoplay, playerServerRef);
  // --------------------------

  const playerRefCb = React.useCallback((elem) => {
    if (elem) setPlayerElement(elem);
  }, []);

  return (
    <div className={classnames('video-js-parent', { 'video-js-parent--ios': IS_IOS })} ref={containerRef}>
      <Button
        label={__('Tap to unmute')}
        button="link"
        icon={ICONS.VOLUME_MUTED}
        className="video-js--tap-to-unmute"
        onClick={unmuteAndHideHint}
        ref={tapToUnmuteRef}
      />
      <Button
        label={__('Retry')}
        button="link"
        icon={ICONS.REFRESH}
        className="video-js--tap-to-unmute"
        onClick={retryVideoAfterFailure}
        ref={tapToRetryRef}
      />

      <div data-vjs-player>
        <video ref={playerRefCb} className="video-js vjs-big-play-centered" />
      </div>
    </div>
  );
});
