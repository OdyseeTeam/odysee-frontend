import videojs from 'video.js';
import SettingMenu from './SettingMenu.js';

import './Item/SettingOnOffItem';
import './Item/SettingOptionItem.js';
import './PlaybackRate/PlaybackRateSettingItem.js';
import './Setting.scss';

const MenuButton = videojs.getComponent('MenuButton');

class SettingMenuButton extends MenuButton {
  constructor(player, options) {
    super(player, options);

    // move menu to player
    player.addChild(this.menu);
    player.SettingMenu = this.menu;

    // remove videojs parent child relationship between button and menu
    this.removeChild(this.menu);
  }

  buildCSSClass() {
    return `vjs-setting-button ${super.buildCSSClass()}`;
  }

  buildWrapperCSSClass() {
    return `vjs-setting-button ${super.buildWrapperCSSClass()}`;
  }

  createMenu() {
    const menu = new SettingMenu(this.player_, {
      menuButton: this
    });
    const entries = this.options_.entries || [];

    entries.forEach(componentName => {
      const component = menu.addChild(componentName, {
        menu
      });
      menu[componentName] = component;
    });

    return menu;
  }

  hideMenu() {
    this.unpressButton();
    this.el_.blur();
  }

  pressButton() {
    super.pressButton();

    this.menu.init();
  }

  unpressButton() {
    super.unpressButton();

    this.player_.removeClass('vjs-keep-control-showing');

    this.menu.restore();
  }

  handleClick() {
    this.player_.addClass('vjs-keep-control-showing');

    if (this.buttonPressed_) {
      this.unpressButton();
    } else {
      this.pressButton();
    }

    this.off(document.body, 'click', this.hideMenu);
    // this.off(document.body, 'touchend', this.hideMenu);

    setTimeout(() => {
      this.one(document.body, 'click', this.hideMenu);
      // _this.buttonPressed_ && _this.one(document.body, 'touchend', _this.hideMenu);
    }, 0);
  }
}

SettingMenuButton.prototype.controlText_ = 'Settings';
SettingMenuButton.prototype.options_ = {
  entries: ['PlaybackRateSettingItem']
};

videojs.registerComponent('SettingMenuButton', SettingMenuButton);

export default SettingMenuButton;
