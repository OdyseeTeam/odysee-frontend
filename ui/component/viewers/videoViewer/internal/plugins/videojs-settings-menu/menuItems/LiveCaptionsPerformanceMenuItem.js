// @flow
import videojs from 'video.js';

const SettingOptionItem = videojs.getComponent('SettingOptionItem');
const name = 'LiveCaptionsPerformanceMenuItem';
const STORAGE_KEY = 'LIVE_CAPTIONS_PRESET';

const PRESETS = [
  {
    id: 'balanced',
    label: __('Balanced'),
    options: {
      windowSeconds: 4,
      stepSeconds: 2,
      skipSilence: true,
      maxDutyCycle: 1,
      returnTimestamps: true,
    },
  },
  {
    id: 'low_latency',
    label: __('Low latency'),
    options: {
      windowSeconds: 3,
      stepSeconds: 1,
      skipSilence: true,
      maxDutyCycle: 1,
      returnTimestamps: false,
    },
  },
  {
    id: 'low_cpu',
    label: __('Low CPU'),
    options: {
      windowSeconds: 3,
      stepSeconds: 3,
      skipSilence: true,
      maxDutyCycle: 0.6,
      returnTimestamps: false,
    },
  },
  {
    id: 'accurate',
    label: __('More accurate'),
    options: {
      windowSeconds: 6,
      stepSeconds: 2,
      skipSilence: true,
      maxDutyCycle: 1,
      returnTimestamps: true,
    },
  },
];

function readStoredPresetId(): string {
  try {
    // $FlowFixMe
    const v = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    const norm = v ? String(v).trim().toLowerCase() : '';
    return PRESETS.some((p) => p.id === norm) ? norm : PRESETS[0].id;
  } catch {
    return PRESETS[0].id;
  }
}

function writeStoredPresetId(id: string) {
  try {
    // $FlowFixMe
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, id);
  } catch {}
}

function applyPreset(player: any, id: string) {
  const preset = PRESETS.find((p) => p.id === id) || PRESETS[0];
  try {
    // $FlowFixMe: plugin exists when videojs-live-captions is imported.
    if (player && typeof player.liveCaptions === 'function') {
      player.liveCaptions(preset.options);
    }
  } catch {}
}

class LiveCaptionsPerformanceMenuItem extends SettingOptionItem {
  constructor(player: any, options: any = {}) {
    const selectedId = readStoredPresetId();
    super(player, {
      ...options,
      name: name,
      label: __('Live captions performance'),
      icon: '',
      entries: PRESETS.map((p) => ({
        label: p.label,
        value: p.id,
        default: p.id === selectedId,
      })),
    });

    this.addClass('vjs-setting-live-captions-performance');
    this.updateVisibility();

    applyPreset(player, selectedId);
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
    const selected = this.selected && this.selected.value ? String(this.selected.value) : PRESETS[0].id;
    writeStoredPresetId(selected);
    applyPreset(this.player_, selected);
  }
}

videojs.registerComponent(name, LiveCaptionsPerformanceMenuItem);
export default LiveCaptionsPerformanceMenuItem;
