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
    this.hide();
  }

  handleClick() {
    console.log('SnapshotMenuItem clicked');
    const controlBar = this.player_?.controlBar;
    console.log('controlBar:', controlBar);
    const snapshotButton = controlBar && controlBar.getChild('snapshotButton');
    console.log('snapshotButton:', snapshotButton);
    if (snapshotButton) {
      console.log('Triggering snapshotButton click');
      // TODO: This is a crappy workaround. The snapshot-capturing logic needs
      // to be factored out so both the Button and Menu version can use it.
      // For now, just click the Button version programmatically.
      snapshotButton.trigger('click');

      this.options_.menu.menuButton_.hideMenu();
    } else {
      console.error('snapshotButton not found in controlBar');
    }
  }
}

videojs.registerComponent(name, SnapshotMenuItem);

export default SnapshotMenuItem;
