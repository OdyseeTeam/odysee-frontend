// @flow
import videojs from 'video.js';
import './videojs-plus/Style/Menu.scss';
import './videojs-plus/Style/VideoJS.scss';
import './videojs-plus/Components/Poster.scss';
import './videojs-plus/Components/SettingMenu/SettingMenuButton';
import type { Player } from '../../videojs';

// Register new settings here (needs to come after all the above imports):
import './menuItems/SnapshotMenuItem';

type Options = {};

const DEFAULT_OPTIONS: Options = {};

function onPlayerReady(player: Player, options: Options) {
  // Future placeholder for things like dynamic placement (mobile vs. desktop).
}

function settingsMenu(options: Options) {
  this.ready(() => onPlayerReady(this, videojs.mergeOptions(DEFAULT_OPTIONS, options)));
}

videojs.registerPlugin('settingsMenu', settingsMenu);
export default settingsMenu;
