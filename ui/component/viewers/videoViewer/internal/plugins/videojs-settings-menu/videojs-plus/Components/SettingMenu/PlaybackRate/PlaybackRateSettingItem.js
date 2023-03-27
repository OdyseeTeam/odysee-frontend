import videojs from 'video.js';
import SettingOptionItem from '../Item/SettingOptionItem.js';
import log from '../../../Utils/Log';

class PlaybackRateSettingItem extends SettingOptionItem {
  constructor(player, options) {
    super(player, {
      ...options,
      label: 'Speed',
      icon: 'vjs-icon-slow-motion-video',
      entries: [
        0.5,
        0.75,
        {
          label: 'Normal',
          value: 1,
          default: true
        },
        1.25,
        1.5,
        2
      ]
    });

    this.addClass('vjs-setting-playback-rate');

    // Since playback rate will be reset to noraml when video source changed
    // So we need to listen on `ratechange`
    player.on('ratechange', () => {
      const rate = player.playbackRate();
      const index = this.entries.findIndex(({ value }) => rate === value);

      if (index > -1) {
        this.select(index);
        this.update(index);
      } else {
        log.warn('Incorrect playbackRate value, setting menu will not updated');
      }
    });
  }

  onChange(...args) {
    super.onChange(...args);
    this.player_.playbackRate(this.selected.value);
  }
}

videojs.registerComponent('PlaybackRateSettingItem', PlaybackRateSettingItem);

export default PlaybackRateSettingItem;
