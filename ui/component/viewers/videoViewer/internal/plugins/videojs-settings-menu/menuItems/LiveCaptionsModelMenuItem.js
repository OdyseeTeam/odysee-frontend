// @flow
import videojs from 'video.js';

const SettingOptionItem = videojs.getComponent('SettingOptionItem');
const name = 'LiveCaptionsModelMenuItem';
const STORAGE_KEY = 'LIVE_CAPTIONS_MODEL';

const MODELS = [
  {
    id: 'tiny',
    label: __('Whisper tiny (fast)'),
    model: 'Xenova/whisper-tiny.en',
  },
  {
    id: 'base',
    label: __('Whisper base (more accurate)'),
    model: 'Xenova/whisper-base.en',
  },
  {
    id: 'small',
    label: __('Whisper small (best quality)'),
    model: 'Xenova/whisper-small.en',
  },
];

function readStoredId(): string {
  try {
    // $FlowFixMe
    const v = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    const norm = v ? String(v).trim().toLowerCase() : '';
    return MODELS.some((m) => m.id === norm) ? norm : MODELS[0].id;
  } catch {
    return MODELS[0].id;
  }
}

function writeStoredId(id: string) {
  try {
    // $FlowFixMe
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, id);
  } catch {}
}

function applyModel(player: any, id: string) {
  const selected = MODELS.find((m) => m.id === id) || MODELS[0];
  try {
    // $FlowFixMe: plugin exists when videojs-live-captions is imported.
    if (player && typeof player.liveCaptions === 'function') {
      player.liveCaptions({ model: selected.model });
    }
  } catch {}
}

class LiveCaptionsModelMenuItem extends SettingOptionItem {
  constructor(player: any, options: any = {}) {
    const selectedId = readStoredId();
    super(player, {
      ...options,
      name: name,
      label: __('Live captions model'),
      icon: '',
      entries: MODELS.map((m) => ({
        label: m.label,
        value: m.id,
        default: m.id === selectedId,
      })),
    });

    this.addClass('vjs-setting-live-captions-model');
    this.updateVisibility();

    applyModel(player, selectedId);
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

  onChange(...args: Array<any>) {
    super.onChange(...args);
    const selected = this.selected && this.selected.value ? String(this.selected.value) : MODELS[0].id;
    writeStoredId(selected);
    applyModel(this.player_, selected);
  }
}

videojs.registerComponent(name, LiveCaptionsModelMenuItem);
export default LiveCaptionsModelMenuItem;
