import videojs from 'video.js';
import SettingOptionItem from '../Item/SettingOptionItem.js';
import log from '../../../Utils/Log';

class PlaybackRateSettingItem extends SettingOptionItem {
  constructor(player, options) {
    super(player, {
      ...options,
      label: __('Speed --[playback rate]--'),
      icon: 'vjs-icon-slow-motion-video',
      entries: [
        // NOTE: Entries must match `VIDEO_PLAYBACK_RATES[]`
        2,
        1.75,
        1.5,
        1.25,
        1.1,
        {
          label: __('Normal --[x1 playback rate]--'),
          value: 1,
          default: true,
        },
        0.75,
        0.5,
        0.25,
      ],
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
