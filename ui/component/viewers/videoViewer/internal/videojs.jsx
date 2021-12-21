// @flow
import 'videojs-contrib-ads'; // must be loaded in this order
import 'videojs-ima'; // loads directly after contrib-ads
import 'video.js/dist/alt/video-js-cdn.min.css';
import './plugins/videojs-mobile-ui/plugin';

import * as ICONS from 'constants/icons';
import * as OVERLAY from './overlays';
import Button from 'component/button';
import classnames from 'classnames';
import events from './videojs-events';
import eventTracking from 'videojs-event-tracking';
import functions from './videojs-functions';
import hlsQualitySelector from './plugins/videojs-hls-quality-selector/plugin';
import keyboardShorcuts from './videojs-keyboard-shortcuts';
import LbryVolumeBarClass from './lbry-volume-bar';
import playerjs from 'player.js';
import qualityLevels from 'videojs-contrib-quality-levels';
import React, { useEffect, useRef, useState } from 'react';
import recsys from './plugins/videojs-recsys/plugin';
import runAds from './ads';
import videojs from 'video.js';

export type Player = {
  controlBar: { addChild: (string, any) => void },
  loadingSpinner: any,
  autoplay: (any) => boolean,
  currentTime: (?number) => number,
  dispose: () => void,
  ended: () => boolean,
  error: () => any,
  exitFullscreen: () => boolean,
  getChild: (string) => any,
  isFullscreen: () => boolean,
  mobileUi: (any) => void,
  muted: (?boolean) => boolean,
  on: (string, (any) => void) => void,
  one: (string, (any) => void) => void,
  overlay: (any) => void,
  play: () => Promise<any>,
  playbackRate: (?number) => number,
  readyState: () => number,
  requestFullscreen: () => boolean,
  userActive: (?boolean) => boolean,
  volume: (?number) => number,
};

type Props = {
  adUrl: ?string,
  allowPreRoll: ?boolean,
  autoplay: boolean,
  autoplaySetting: boolean,
  claimId: ?string,
  embedded: boolean,
  internalFeatureEnabled: ?boolean,
  isAudio: boolean,
  poster: ?string,
  replay: boolean,
  shareTelemetry: boolean,
  source: string,
  sourceType: string,
  startMuted: boolean,
  userId: ?number,
  videoTheaterMode: boolean,
  onPlayerReady: (Player, any) => void,
  playNext: () => void,
  playPrevious: () => void,
  toggleVideoTheaterMode: () => void,
};

const videoPlaybackRates = [0.25, 0.5, 0.75, 1, 1.1, 1.25, 1.5, 1.75, 2];

const IS_IOS =
  (/iPad|iPhone|iPod/.test(navigator.platform) ||
    // for iOS 13+ , platform is MacIntel, so use this to test
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) &&
  !window.MSStream;

const VIDEO_JS_OPTIONS = {
  preload: 'auto',
  playbackRates: videoPlaybackRates,
  responsive: true,
  controls: true,
  html5: {
    vhs: {
      overrideNative: !videojs.browser.IS_ANY_SAFARI,
    },
  },
};

if (!Object.keys(videojs.getPlugins()).includes('eventTracking')) {
  videojs.registerPlugin('eventTracking', eventTracking);
}

if (!Object.keys(videojs.getPlugins()).includes('hlsQualitySelector')) {
  videojs.registerPlugin('hlsQualitySelector', hlsQualitySelector);
}

if (!Object.keys(videojs.getPlugins()).includes('qualityLevels')) {
  videojs.registerPlugin('qualityLevels', qualityLevels);
}

if (!Object.keys(videojs.getPlugins()).includes('recsys')) {
  videojs.registerPlugin('recsys', recsys);
}

// ****************************************************************************
// VideoJs
// ****************************************************************************

/*
properties for this component should be kept to ONLY those that if changed should REQUIRE an entirely new videojs element
 */
export default React.memo<Props>(function VideoJs(props: Props) {
  const {
    // adUrl, // TODO: this ad functionality isn't used, can be pulled out
    allowPreRoll,
    autoplay,
    autoplaySetting,
    claimId,
    embedded,
    internalFeatureEnabled, // for people on the team to test new features internally
    isAudio,
    poster,
    replay,
    shareTelemetry,
    source,
    sourceType,
    startMuted,
    userId,
    videoTheaterMode,
    onPlayerReady,
    playNext,
    playPrevious,
    toggleVideoTheaterMode,
  } = props;

  // will later store the videojs player
  const playerRef = useRef();
  const containerRef = useRef();

  const tapToUnmuteRef = useRef();
  const tapToRetryRef = useRef();

  // initiate keyboard shortcuts
  const { initializeKeyboardShortcuts } = keyboardShorcuts({ toggleVideoTheaterMode, playNext, playPrevious });

  const [reload, setReload] = useState('initial');


  const videoJsOptions = {
    ...VIDEO_JS_OPTIONS,
    autoplay: autoplay,
    muted: startMuted,
    sources: [{ src: source, type: sourceType }],
    poster: 'https://spee.ch/3/ed2b688a7fa1d7e0.jpg?quality=85&height=806&width=806', // thumb looks bad in app, and if autoplay, flashing poster is annoying
    // poster,
    plugins: { eventTracking: true, overlay: OVERLAY.OVERLAY_DATA },
    // fixes problem of errant CC button showing up on iOS
    // the true fix here is to fix the m3u8 file, see: https://github.com/lbryio/lbry-desktop/pull/6315
    controlBar: { subsCapsButton: false },
  };

  const { checkIfUsingHls, createVideoPlayerDOM } = functions({ videoJsOptions, isAudio });

  const { unmuteAndHideHint, retryVideoAfterFailure, initializeEvents } = events({
    tapToUnmuteRef,
    tapToRetryRef,
    setReload,
    videoTheaterMode,
    playerRef,
    autoplaySetting,
    replay,
  });

  // Initialize video.js
  function initializeVideoPlayer(el) {
    if (!el) return;

    const vjs = videojs(el, videoJsOptions, () => {
      const player = playerRef.current;

      // instantiate playerjs functionality
      const adapter = new playerjs.VideoJSAdapter(player);

      // this seems like a weird thing to have to check for here
      if (!player) return;

      // run ads (preroll) via google ima functionality
      // runAds(internalFeatureEnabled, allowPreRoll, player, embedded);

      // initialize player events (onPlay etc)
      initializeEvents();

      // Replace volume bar with custom LBRY volume bar
      LbryVolumeBarClass.replaceExisting(player);

      // Add reloadSourceOnError plugin
      player.reloadSourceOnError({ errorInterval: 10 });

      // initialize mobile UI plugin (not running on iOS currently)
      player.mobileUi(); // no-op if desktop

      // Add quality selector to player
      player.hlsQualitySelector({
        displayCurrentQuality: true,
      });

      // Add recsys plugin
      if (shareTelemetry) {
        player.recsys({
          videoId: claimId,
          userId: userId,
          embedded: embedded,
        });
      }

      // set playsinline for mobile
      player.children_[0].setAttribute('playsinline', '');

      player.posterImage.show();

      document.querySelector('.vjs-poster').style.display = 'block';
      document.querySelector('.vjs-poster').style.visibility = 'visible';

      document.querySelector('.vjs-loading-spinner').style.visibility = 'visible';
      document.querySelector('.vjs-loading-spinner').style.display = 'block';

      document.querySelector('video.vjs-tech').style.visibility = 'hidden';

      document.querySelector('video.vjs-tech').parentElement.classList.add('vjs-seeking');

      // I think this is a callback function
      const videoNode = containerRef.current && containerRef.current.querySelector('video, audio');

      player.on('play', function(){
        document.querySelector('video.vjs-tech').parentElement.classList.add('vjs-seeking');
      })

      player.on('canplaythrough', function(){
        document.querySelector('video.vjs-tech').parentElement.classList.remove('vjs-seeking');
        console.log('playing!');
        document.querySelector('video.vjs-tech').style.visibility = 'visible';
        document.querySelector('.vjs-poster').style.display = 'none';
        document.querySelector('.vjs-poster').style.visibility = 'visible';
        document.querySelector('.vjs-loading-spinner').style.visibility = 'hidden';
        document.querySelector('.vjs-loading-spinner').style.display = 'block';


      })

      // callback from parent component, will document better shortly
      onPlayerReady(player, videoNode);

      // initialize playerjs functionality
      adapter.ready();
    });

    // fixes #3498 (https://github.com/lbryio/lbry-desktop/issues/3498)
    // summary: on firefox the focus would stick to the fullscreen button which caused buggy behavior with spacebar
    vjs.on('fullscreenchange', () => document.activeElement && document.activeElement.blur());

    return vjs;
  }

  /** instantiate videoJS and dispose of it when done with code **/
  // This lifecycle hook is only called once (on mount), or when `isAudio` or `source` changes.
  useEffect(() => {
    (async function() {
      const vjsElement = createVideoPlayerDOM(containerRef.current);

      // fetches sourceType via HEAD call and then updates globally defined videoJsOptions
      const { usingHls, hlsSource, hlsSourceType } = await checkIfUsingHls(source, sourceType);

      // update source/sourceType if using HLS
      if (usingHls) {
        videoJsOptions.src = hlsSource;
        videoJsOptions.sourceType = hlsSourceType;
      }

      // take the passed DOM element, create the videojs player and attach it
      const vjsPlayer = initializeVideoPlayer(vjsElement);

      // Add reference to player to global scope
      window.player = vjsPlayer;

      // Set reference in component state
      playerRef.current = vjsPlayer;

      // instantiates keyboard shortcuts
      window.addEventListener('keydown', initializeKeyboardShortcuts(playerRef, containerRef));

      window.player.bigPlayButton.hide();

      // PR #5570: Temp workaround to avoid double Play button until the next re-architecture.
      if (!window.player.paused()) {
        (window.player.bigPlayButton && window.player.bigPlayButton.hide());
      }

      // Cleanup
      return () => {
        // removes keyboard shortcut listeners
        window.removeEventListener('keydown', initializeKeyboardShortcuts);

        // dispose videojs player and remove it from global scope
        const player = playerRef.current;
        if (player) {
          player.dispose();
          window.player = undefined;
        }
      };
    })();
  }, [isAudio, source, reload]);

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
    </div>
  );
});
