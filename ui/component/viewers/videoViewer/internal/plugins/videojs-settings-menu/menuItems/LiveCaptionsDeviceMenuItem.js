// @flow
import videojs from 'video.js';

const SettingOptionItem = videojs.getComponent('SettingOptionItem');
const name = 'LiveCaptionsDeviceMenuItem';
const STORAGE_KEY = 'LIVE_CAPTIONS_DEVICE';

const DEVICES = [
  { id: 'auto', label: __('Auto (best available)'), device: 'auto' },
  { id: 'webgpu', label: __('WebGPU'), device: 'webgpu' },
  { id: 'webgl', label: __('WebGL'), device: 'webgl' },
  { id: 'wasm', label: __('WASM (CPU)'), device: 'wasm' },
];

function readStoredId(): string {
  try {
    // $FlowFixMe
    const v = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    const norm = v ? String(v).trim().toLowerCase() : '';
    return DEVICES.some((d) => d.id === norm) ? norm : DEVICES[0].id;
  } catch {
    return DEVICES[0].id;
  }
}

function writeStoredId(id: string) {
  try {
    // $FlowFixMe
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, id);
  } catch {}
}

function applyDevice(player: any, id: string) {
  const selected = DEVICES.find((d) => d.id === id) || DEVICES[0];
  try {
    // $FlowFixMe: plugin exists when videojs-live-captions is imported.
    if (player && typeof player.liveCaptions === 'function') {
      player.liveCaptions({ device: selected.device });
    }
  } catch {}
}

class LiveCaptionsDeviceMenuItem extends SettingOptionItem {
  constructor(player: any, options: any = {}) {
    const selectedId = readStoredId();
    super(player, {
      ...options,
      name: name,
      label: __('Live captions device'),
      icon: '',
      entries: DEVICES.map((d) => ({
        label: d.label,
        value: d.id,
        default: d.id === selectedId,
      })),
    });

    this.addClass('vjs-setting-live-captions-device');
    this.updateVisibility();

    applyDevice(player, selectedId);
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
    const selected = this.selected && this.selected.value ? String(this.selected.value) : DEVICES[0].id;
    writeStoredId(selected);
    applyDevice(this.player_, selected);
  }
}

videojs.registerComponent(name, LiveCaptionsDeviceMenuItem);
export default LiveCaptionsDeviceMenuItem;
