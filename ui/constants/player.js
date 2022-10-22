import * as OVERLAY from 'component/viewers/videoViewer/internal/videojsComponent/internal/overlays';
import { platform } from 'util/platform';
import Chromecast from 'component/viewers/videoViewer/internal/videojsComponent/internal/chromecast';

const IS_IOS = platform.isIOS();
const IS_IPHONE = platform.isIPhone();

export const VIDEOJS_VOLUME_PANEL_CLASS = 'VolumePanel';

export const HLS_FILETYPE = 'application/x-mpegURL';

export const INLINE_PLAYER_WRAPPER_CLASS = 'inline-player__wrapper';
export const FLOATING_PLAYER_CLASS = 'content__viewer--floating';

export const VIDEO_ALMOST_FINISHED_THRESHOLD = 0.8;
export const VIDEO_PLAYBACK_RATES = Object.freeze([0.25, 0.5, 0.75, 1, 1.1, 1.25, 1.5, 1.75, 2]);

// const PLAY_TIMEOUT_ERROR = 'play_timeout_error';
// const PLAY_TIMEOUT_LIMIT = 2000;
export const PLAY_POSITION_SAVE_INTERVAL_MS = 15000;

// Quality Options
export const AUTO = 'auto';
export const ORIGINAL = 'original';
export const VIDEO_QUALITY_OPTIONS = [AUTO, ORIGINAL, 144, 240, 360, 480, 720, 1080];

// Player Position
export const DEFAULT_INITIAL_FLOATING_POS = { x: window.innerWidth, y: window.innerHeight - 500 };

export const DEFAULT_VIDEO_JS_OPTIONS = Object.freeze({
  preload: 'auto',
  playbackRates: VIDEO_PLAYBACK_RATES,
  responsive: true,
  controls: true,
  html5: {
    vhs: {
      overrideNative: !IS_IPHONE,
      enableLowInitialPlaylist: false,
      fastQualityChange: true,
      useDtsForTimestampOffset: true,
    },
  },
  liveTracker: { trackingThreshold: 0, liveTolerance: 10 },
  inactivityTimeout: 2000,
  plugins: { eventTracking: true, overlay: OVERLAY.OVERLAY_DATA },
  controlBar: {
    currentTimeDisplay: true,
    timeDivider: true,
    durationDisplay: true,
    remainingTimeDisplay: true,
    subsCapsButton: !IS_IOS,
  },
  techOrder: ['chromecast', 'html5'],
  ...Chromecast.getOptions(),
  suppressNotSupportedError: true,
  liveui: true,
});
