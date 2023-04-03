import videojs from 'video.js';

const SettingMenuItem = videojs.getComponent('SettingMenuItem');
const name = 'SnapshotMenuItem';

class SnapshotMenuItem extends SettingMenuItem {
  constructor(player, options) {
    super(player, {
      ...options,
      name: name,
      label: __('Take snapshot'),
      icon: '',
      entries: [],
    });

    this.addClass('vjs-setting-snapshot');

    if (videojs.browser.IS_ANDROID || videojs.browser.IS_IOS) {
      this.hide();
    } else {
      this.show();
    }
  }

  handleClick() {
    const controlBar = this.player_?.controlBar;
    const snapshotButton = controlBar && controlBar.getChild('snapshotButton');
    if (snapshotButton) {
      // TODO: This is a crappy workaround. The snapshot-capturing logic needs
      // to be factored out so both the Button and Menu version can use it.
      // For now, just click the Button version programmatically.
      snapshotButton.trigger('click');

      this.options_.menu.menuButton_.hideMenu();
    }
  }
}

videojs.registerComponent(name, SnapshotMenuItem);

export default SnapshotMenuItem;
