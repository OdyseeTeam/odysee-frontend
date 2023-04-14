/**
 * This plugin encapsulates the replacement of
 *   "progressControl > seekBar > mouseTimeDisplay"
 * with our custom
 *   "progressControl > timeMarker"
 *
 * The TimeMarker component handles:
 *   - whatever mouseTimeDisplay was handling.
 *   - disables the use of "progressControl > seekBar > mouseTimeDisplay".
 *   - display of chapter titles by looking at `player.parsedChapterInfo`.
 *
 * The change in z-order add some flexibility for future tweaks, but it is
 * primarily to detach itself from the seekBar's clipping region.
 */

// @flow
import videojs from 'video.js';
import type { Player } from '../../videojs';
import TimeMarker from './TimeMarker';
import './TimeMarker.scss';

const defaultOptions = {};

type Options = {};

function onPlayerReady(player: Player, options: Options) {
  const cb = player.getChild('controlBar');
  const pc = cb && cb.getChild('progressControl');
  if (pc) {
    pc.addChild('timeMarker');
  }
}

function timeMarkerPlugin(options: Options) {
  this.ready(() => onPlayerReady(this, videojs.mergeOptions(defaultOptions, options)));
}

videojs.registerComponent('TimeMarker', TimeMarker);
videojs.registerPlugin('timeMarkerPlugin', timeMarkerPlugin);
export default timeMarkerPlugin;
