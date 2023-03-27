import videojs from 'video.js';

const MenuItem = videojs.getComponent('MenuItem');

class SettingMenuItem extends MenuItem {
  constructor(player, options) {
    super(
      player,
      videojs.mergeOptions(
        {
          selectable: false
        },
        options
      )
    );

    this.menu = options.menu;
  }
}

videojs.registerComponent('SettingMenuItem', SettingMenuItem);

export default SettingMenuItem;
