import videojs from 'video.js';

const MenuItem = videojs.getComponent('MenuItem');

class SettingMenuItem extends MenuItem {
  constructor(player, options) {
    super(
      player,
      videojs.mergeOptions(
        {
          selectable: false,
        },
        options
      )
    );

    this._menu = (options && options.menu) || null;

    // Lazily resolve the menu (SettingMenuButton moves the menu to the player after the MenuButton base ctor).
    Object.defineProperty(this, 'menu', {
      configurable: true,
      get: () => {
        if (this._menu) return this._menu;
        try {
          const resolved =
            (player && player.SettingMenu) ||
            (player && typeof player.getChild === 'function' ? player.getChild('SettingMenu') : null);
          if (resolved) this._menu = resolved;
        } catch {}
        return this._menu;
      },
      set: (v) => {
        this._menu = v;
      },
    });
  }
}

videojs.registerComponent('SettingMenuItem', SettingMenuItem);

export default SettingMenuItem;
