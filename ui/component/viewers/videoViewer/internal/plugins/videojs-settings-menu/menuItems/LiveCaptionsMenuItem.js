import videojs from 'video.js';
import { VJS_COMP, VJS_EVENTS } from 'constants/player';

const SettingOnOffItem = videojs.getComponent('SettingOnOffItem');
const name = VJS_COMP.LIVE_CAPTIONS_MENU_ITEM;

class LiveCaptionsMenuItem extends SettingOnOffItem {
  constructor(player) {
    super(player, {
      name: name,
      label: __('Live captions (local)'),
      icon: '',
    });

    this.addClass('vjs-setting-live-captions');
    this.updateVisibility();

    player.on(VJS_EVENTS.LIVE_CAPTIONS_STATE, (_, enabled) => {
      this.update(enabled);
    });

    try {
      const api = player.__liveCaptionsApi;
      if (api && typeof api.isEnabled === 'function') {
        this.update(api.isEnabled());
      }
    } catch {}
  }

  handleClick() {
    // $FlowFixMe: plugin exists when videojs-live-captions is imported.
    const api = this.player_ && this.player_.liveCaptions && this.player_.liveCaptions();
    if (api && typeof api.toggle === 'function') {
      api.toggle();
      if (typeof api.isEnabled === 'function') {
        this.update(api.isEnabled());
      }
    }
  }

  updateVisibility() {
    if (!IS_WEB) {
      this.hide();
      return;
    }
    const IS_MOBILE = videojs.browser.IS_ANDROID || videojs.browser.IS_IOS;
    if (IS_MOBILE) {
      this.hide();
    } else {
      this.show();
    }
  }

  update(active) {
    super.update(active);
  }
}

videojs.registerComponent(name, LiveCaptionsMenuItem);
export default LiveCaptionsMenuItem;
