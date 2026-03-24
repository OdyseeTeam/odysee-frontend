import videojs from 'video.js';
import { VJS_COMP } from 'constants/player';

const SettingOnOffItem = videojs.getComponent('SettingOnOffItem');

class LoopMenuItem extends SettingOnOffItem {
  constructor(player, options) {
    super(player, {
      ...options,
      label: __('Loop'),
      name: VJS_COMP.LOOP_MENU_ITEM,
      icon: '',
    });

    this.addClass('vjs-setting-loop');

    player.on('loadedmetadata', () => {
      this.player_.loop(false);
      this.update(false);
    });
  }

  handleClick() {
    const newState = !this.player_.loop();
    this.player_.loop(newState);
    this.update(newState);
  }

  update(active) {
    super.update(active);
  }
}

videojs.registerComponent(VJS_COMP.LOOP_MENU_ITEM, LoopMenuItem);
export default LoopMenuItem;
