import videojs from 'video.js';
import { VJS_COMP } from 'constants/player';

const SettingMenuButton = videojs.getComponent('SettingMenuButton');
const SettingOnOffItem = videojs.getComponent('SettingOnOffItem');
const name = VJS_COMP.AUTOPLAY_NEXT_MENU_ITEM;

class AutoPlayNextMenuItem extends SettingOnOffItem {
  constructor(player) {
    super(player, {
      name: name,
      label: __('Autoplay next'),
      icon: '',
    });

    this.updateVisibility();
    this.addClass('vjs-setting-autoplay-next');

    player.on(`${VJS_COMP.AUTOPLAY_NEXT_BUTTON}::onState`, (_, onState) => {
      this.update(onState);
    });
  }

  handleClick() {
    const controlBar = this.player_?.controlBar;
    const button = controlBar && controlBar.getChild(VJS_COMP.AUTOPLAY_NEXT_BUTTON);
    if (button) {
      button.trigger('click');
    }
  }

  updateVisibility() {
    this.show();
  }

  update(active) {
    super.update(active);
  }
}

SettingMenuButton.prototype.options_.entries.splice(0, 0, name);
videojs.registerComponent(name, AutoPlayNextMenuItem);

export default AutoPlayNextMenuItem;
