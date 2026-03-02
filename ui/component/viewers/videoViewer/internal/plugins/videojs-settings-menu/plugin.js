// @flow
import videojs from 'video.js';
import './videojs-plus/Style/Menu.scss';
import './videojs-plus/Style/VideoJS.scss';
import './videojs-plus/Components/Poster.scss';
import './videojs-plus/Components/SettingMenu/SettingMenuButton';
import type { Player } from '../../videojs';
import { VJS_COMP } from 'constants/player';

// (1) Register settings (must be after all the imports above):
import './menuItems/AutoPlayNextMenuItem';
import './menuItems/KeyboardShortcutsMenuItem';
import './menuItems/SnapshotMenuItem';
import './menuItems/LoopMenuItem';

// (2) Define the display order
const DISPLAY_ORDER = [
  'PlaybackRateSettingItem',
  VJS_COMP.KEYBOARD_SHORTCUTS_MENU_ITEM,
  'AutoPlayNextMenuItem',
  'LoopMenuItem',
  'SnapshotMenuItem',
];

// ****************************************************************************
// settingsMenu
// ****************************************************************************

type Options = {};

const DEFAULT_OPTIONS: Options = {};

const SettingMenuButton = videojs.getComponent('SettingMenuButton');

DISPLAY_ORDER.forEach((x) => {
  SettingMenuButton.prototype.options_.entries.push(x);
});

function onPlayerReady(player: Player, options: Options) {
  // Future placeholder for things like dynamic placement (mobile vs. desktop).
}

function settingsMenu(options: Options) {
  this.ready(() => onPlayerReady(this, videojs.mergeOptions(DEFAULT_OPTIONS, options)));
}

videojs.registerPlugin('settingsMenu', settingsMenu);
export default settingsMenu;
