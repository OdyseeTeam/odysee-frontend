import videojs from 'video.js';
import { VJS_COMP } from 'constants/player';
import { platform } from 'util/platform';

const SettingMenuItem = videojs.getComponent('SettingMenuItem');

class KeyboardShortcutsMenuItem extends SettingMenuItem {
  constructor(player, options) {
    super(player, {
      ...options,
      label: __('Keyboard shortcuts'),
      name: VJS_COMP.KEYBOARD_SHORTCUTS_MENU_ITEM,
      icon: '',
    });

    this.addClass('vjs-setting-keyboard-shortcuts');
    this.updateVisibility();
  }

  createEl() {
    const { icon, label } = this.options_;
    return videojs.dom.createEl('li', {
      className: 'vjs-menu-item vjs-setting-menu-item',
      innerHTML: `
        <div class="vjs-icon-placeholder ${icon || ''}"></div>
        <div class="vjs-setting-menu-label">${this.localize(label)}</div>
        <div class="vjs-spacer"></div>
      `,
    });
  }

  handleClick() {
    const player = this.player_;
    if (player && typeof player.toggleKeyboardShortcutsOverlay === 'function') {
      player.toggleKeyboardShortcutsOverlay(true);
    }

    const menuButton = this.menu && this.menu.options_ && this.menu.options_.menuButton;
    if (menuButton && typeof menuButton.hideMenu === 'function') {
      menuButton.hideMenu();
    }
  }

  updateVisibility() {
    if (platform.isMobile()) {
      this.hide();
    } else {
      this.show();
    }
  }
}

videojs.registerComponent(VJS_COMP.KEYBOARD_SHORTCUTS_MENU_ITEM, KeyboardShortcutsMenuItem);
export default KeyboardShortcutsMenuItem;
