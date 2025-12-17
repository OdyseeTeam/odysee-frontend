// @flow
import videojs from 'video.js';

const SettingOptionItem = videojs.getComponent('SettingOptionItem');
const name = 'LiveCaptionsWasmThreadsMenuItem';
const STORAGE_KEY = 'LIVE_CAPTIONS_WASM_THREADS';

const THREAD_OPTIONS = [
  { id: 'auto', label: __('Auto'), threads: null },
  { id: '1', label: __('1'), threads: 1 },
  { id: '2', label: __('2'), threads: 2 },
  { id: '4', label: __('4'), threads: 4 },
  { id: '8', label: __('8'), threads: 8 },
];

function readStoredId(): string {
  try {
    // $FlowFixMe
    const v = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    const norm = v ? String(v).trim().toLowerCase() : '';
    return THREAD_OPTIONS.some((o) => o.id === norm) ? norm : THREAD_OPTIONS[0].id;
  } catch {
    return THREAD_OPTIONS[0].id;
  }
}

function writeStoredId(id: string) {
  try {
    // $FlowFixMe
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, id);
  } catch {}
}

function applyThreads(player: any, id: string) {
  const selected = THREAD_OPTIONS.find((o) => o.id === id) || THREAD_OPTIONS[0];
  try {
    // $FlowFixMe: plugin exists when videojs-live-captions is imported.
    if (player && typeof player.liveCaptions === 'function') {
      player.liveCaptions({ wasmNumThreads: selected.threads });
    }
  } catch {}
}

class LiveCaptionsWasmThreadsMenuItem extends SettingOptionItem {
  constructor(player: any, options: any = {}) {
    const selectedId = readStoredId();
    super(player, {
      ...options,
      name: name,
      label: __('Live captions WASM threads'),
      icon: '',
      entries: THREAD_OPTIONS.map((o) => ({
        label: o.label,
        value: o.id,
        default: o.id === selectedId,
      })),
    });

    this.addClass('vjs-setting-live-captions-wasm-threads');
    this.updateVisibility();

    applyThreads(player, selectedId);
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
    const selected = this.selected && this.selected.value ? String(this.selected.value) : THREAD_OPTIONS[0].id;
    writeStoredId(selected);
    applyThreads(this.player_, selected);
  }
}

videojs.registerComponent(name, LiveCaptionsWasmThreadsMenuItem);
export default LiveCaptionsWasmThreadsMenuItem;
