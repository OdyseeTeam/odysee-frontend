// @flow
import videojs from 'video.js';
import type { Player } from '../../videojs';

const Component = videojs.getComponent('Component');

const throttle = function (fn: any, wait: any) {
  let last = window.performance.now();

  // noinspection UnnecessaryLocalVariableJS
  const throttled = function (...args: any) {
    const now = window.performance.now();

    if (now - last >= wait) {
      fn(...args);
      last = now;
    }
  };

  return throttled;
};

// ****************************************************************************
// ProgressNub
// ****************************************************************************

const UPDATE_REFRESH_INTERVAL_MS = 30;

class ProgressNub extends Component {
  constructor(player: Player, options: any) {
    super(player, options);
    this.player = player;
    this.options = options;
    this._setup();
  }

  createEl() {
    return super.createEl('div', { className: 'vjs-progress-nub' });
  }

  _setup() {
    const updateCbOverride = (seekBarRect: Object, seekBarPoint: number) => {
      // 'this' = playProgressBar
      try {
        const progressNub = this.player_.getChild('controlBar').getChild('progressControl').getChild('progressNub');
        if (progressNub) {
          progressNub.el_.style.left = `${seekBarRect.width * seekBarPoint}px`;
        }
      } catch {}
    };

    try {
      const playProgressBar = this.player
        .getChild('controlBar')
        .getChild('progressControl')
        .getChild('seekBar')
        .getChild('playProgressBar');
      if (playProgressBar) {
        playProgressBar.update = throttle(updateCbOverride, UPDATE_REFRESH_INTERVAL_MS);
      }
    } catch {}
  }
}

ProgressNub.prototype.options_ = {
  children: [],
};

export default ProgressNub;
