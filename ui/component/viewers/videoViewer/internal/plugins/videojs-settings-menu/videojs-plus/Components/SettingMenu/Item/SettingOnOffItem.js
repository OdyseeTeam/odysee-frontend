import videojs from 'video.js';
import SettingMenuItem from './SettingMenuItem.js';

class SettingOnOffItem extends SettingMenuItem {
  createEl() {
    const options = this.options_;
    const el = videojs.dom.createEl('li', {
      className: 'vjs-menu-item vjs-setting-onoff-item',
      innerHTML: `
        <div class="vjs-icon-placeholder ${this.options_.icon || ''}"></div>
        <div>${this.localize(options.label)}</div>
        <div class="vjs-spacer"></div>
        <div>
          <div class="vjs-onoff-button"></div>
        </div>
      `
    });

    return el;
  }

  update(active) {
    this.active = typeof active === 'undefined' ? !this.active : active;

    if (this.active) {
      this.addClass('vjs-active');
    } else {
      this.removeClass('vjs-active');
    }
  }

  handleClick() {
    this.update();
  }

  selected() {}
}

videojs.registerComponent('SettingOnOffItem', SettingOnOffItem);

export default SettingOnOffItem;
