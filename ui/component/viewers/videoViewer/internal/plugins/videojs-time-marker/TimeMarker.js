// @flow
import videojs from 'video.js';
import type { Player } from '../../videojs';

const Component = videojs.getComponent('Component');

class TimeMarker extends Component {
  constructor(player: Player, options: any) {
    super(player, options);
    this.player = player;
    this.options = options;
    this.registeredEvents = {};
    this._setup();
  }

  createEl() {
    return super.createEl('div', { className: 'vjs-time-marker' });
  }

  _setup() {
    const progressControl = this.player.getChild('controlBar').getChild('progressControl');
    const seekBar = progressControl && progressControl.getChild('seekBar');
    const mouseTimeDisplay = seekBar && seekBar.getChild('mouseTimeDisplay');

    if (!progressControl || !seekBar || !mouseTimeDisplay) {
      return;
    }

    this.progressControl = progressControl;

    mouseTimeDisplay.hide();

    this.registeredEvents.progressControlMouseEnter = () => this.handleMouseEnter();
    this.registeredEvents.progressControlMouseLeave = () => this.handleMouseLeave();

    this.progressControl.on('mouseenter', this.registeredEvents.progressControlMouseEnter);
    this.progressControl.on('mouseleave', this.registeredEvents.progressControlMouseLeave);
  }

  /**
   * Enqueues updates to its own DOM as well as the DOM of its
   * {@link TimeTooltip} child.
   *
   * @param {Object} seekBarRect
   *        The `ClientRect` for the {@link SeekBar} element.
   *
   * @param {number} seekBarPoint
   *        A number from 0 to 1, representing a horizontal reference point
   *        from the left edge of the {@link SeekBar}
   */
  update(seekBarRect: Object, seekBarPoint: number) {
    const tsData = this.player.chaptersInfo;
    const duration = this.player_.duration();
    const time = seekBarPoint * duration;
    const timeTooltip = this.getChild('timeTooltip');

    timeTooltip.updateTime(seekBarRect, seekBarPoint, time, () => {
      // --- vjs-time-marker ---
      this.el_.style.left = `${seekBarRect.width * seekBarPoint}px`;

      // --- vjs-time-tooltip ---
      const playerRect = videojs.dom.findPosition(this.player_.el());
      let tooltipRect = videojs.dom.findPosition(timeTooltip.el_);

      // 1. Handle chapters
      if (tsData) {
        const values = Object.values(tsData);
        // $FlowIssue
        const seconds = values.map((v) => v.seconds);
        const curSeconds = time;
        let i = 0;

        for (; i < seconds.length; ++i) {
          const s0 = seconds[i];
          const s1 = i === seconds.length - 1 ? duration : seconds[i + 1];
          if (curSeconds >= s0 && curSeconds < s1) {
            break;
          }
        }

        if (i < seconds.length) {
          // $FlowIgnore
          const newStr = `${videojs.formatTime(time, duration)}  ${values[i].label}`;
          timeTooltip.write(newStr);
        }
      }

      // 2. Center the tooltip
      tooltipRect = videojs.dom.findPosition(timeTooltip.el_); // recalculate

      const curPx = seekBarRect.width * seekBarPoint;
      const halfWidth = tooltipRect.width / 2;

      if (curPx - halfWidth < playerRect.left) {
        timeTooltip.el_.style.right = `-${tooltipRect.width - curPx}px`;
      } else if (curPx + halfWidth > seekBarRect.width) {
        timeTooltip.el_.style.right = `-${seekBarRect.width * (1 - seekBarPoint)}px`;
      } else {
        timeTooltip.el_.style.right = `-${tooltipRect.width / 2}px`;
      }
    });
  }

  handleMouseEnter() {
    this.mouseMoveCallback = (e) => this.handleMouseMove(e);
    this.registeredEvents.progressControlMouseMove = this.mouseMoveCallback;
    this.progressControl.on('mousemove', this.registeredEvents.progressControlMouseMove);
    this.show();
  }

  handleMouseLeave() {
    if (this.registeredEvents.progressControlMouseMove) {
      this.progressControl.off('mousemove', this.registeredEvents.progressControlMouseMove);
    }
    this.hide();
  }

  handleMouseMove(event: any) {
    const progressControl = this.player.getChild('controlBar').getChild('progressControl');
    const seekBar = progressControl && progressControl.getChild('seekBar');
    const mouseTimeDisplay = seekBar && seekBar.getChild('mouseTimeDisplay');
    const playProgressBar = seekBar && seekBar.getChild('playProgressBar');

    if (!progressControl || !seekBar || !mouseTimeDisplay || !playProgressBar) {
      return;
    }

    const seekBarEl = seekBar.el();
    const seekBarRect = videojs.dom.findPosition(seekBarEl);
    let seekBarPoint = videojs.dom.getPointerPosition(seekBarEl, event).x;

    // The default skin has a gap on either side of the `SeekBar`. This means
    // that it's possible to trigger this behavior outside the boundaries of
    // the `SeekBar`. This ensures we stay within it at all times.
    seekBarPoint = this._clamp(seekBarPoint, 0, 1);

    this.update(seekBarRect, seekBarPoint);

    if (playProgressBar) {
      playProgressBar.update(seekBarRect, seekBar.getProgress());
    }
  }

  _clamp(number: number, min: number, max: number) {
    const n = Number(number);
    return Math.min(max, Math.max(min, isNaN(n) ? min : n));
  }
}

/**
 * Default options.
 */
TimeMarker.prototype.options_ = {
  children: ['timeTooltip'],
};

export default TimeMarker;
