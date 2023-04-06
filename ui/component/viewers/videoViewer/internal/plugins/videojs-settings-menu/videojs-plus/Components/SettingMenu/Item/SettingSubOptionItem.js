import videojs from 'video.js';

import SettingMenuItem from './SettingMenuItem.js';

class SettingSubOptionItem extends SettingMenuItem {
  constructor(player, options) {
    super(player, options);

    this.selectable = true;

    // FIXME: should be remove
    Object.assign(this, options);

    this.addChild('Component', {}, 0);
    this.addClass('vjs-settings-sub-menu-item');
    this.addClass('vjs-settings-sub-menu-option');

    this.update();
  }

  update() {
    this.selected(this.value === this.parent.selected.value);
  }

  handleClick() {
    this.parent.onChange({ index: this.options_.index });
    this.menu.restore();
  }
}

videojs.registerComponent('SettingSubOptionItem', SettingSubOptionItem);

export default SettingSubOptionItem;
