import { ODYSEE_HYPERBEAM_NODE_API } from 'config';

export const HYPERBEAM_MODE_STORAGE_KEY = 'odysee-hyperbeam-mode';

export const HYPERBEAM_MODES = {
  original: 'original',
  hybrid: 'hybrid',
  hyperbeam: 'hyperbeam',
} as const;

export type HyperbeamMode = (typeof HYPERBEAM_MODES)[keyof typeof HYPERBEAM_MODES];

const CANONICAL_NATIVE_DEVICES = new Set(['~odysee@1.0']);

export function getHyperbeamMode(): HyperbeamMode {
  if (!ODYSEE_HYPERBEAM_NODE_API) return HYPERBEAM_MODES.original;
  if (typeof window === 'undefined') return HYPERBEAM_MODES.hyperbeam;

  const value = window.localStorage.getItem(HYPERBEAM_MODE_STORAGE_KEY);
  if (value === HYPERBEAM_MODES.original || value === HYPERBEAM_MODES.hybrid || value === HYPERBEAM_MODES.hyperbeam) {
    return value;
  }

  return HYPERBEAM_MODES.hyperbeam;
}

export function setHyperbeamMode(mode: HyperbeamMode) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(HYPERBEAM_MODE_STORAGE_KEY, mode);
  window.dispatchEvent(new CustomEvent('odysee-hyperbeam-mode-change', { detail: mode }));
}

export function isHyperbeamEnabled() {
  return Boolean(ODYSEE_HYPERBEAM_NODE_API) && getHyperbeamMode() !== HYPERBEAM_MODES.original;
}

export function isHyperbeamFullMode() {
  return Boolean(ODYSEE_HYPERBEAM_NODE_API) && getHyperbeamMode() === HYPERBEAM_MODES.hyperbeam;
}

export function isHyperbeamHybridMode() {
  return Boolean(ODYSEE_HYPERBEAM_NODE_API) && getHyperbeamMode() === HYPERBEAM_MODES.hybrid;
}

export function isHyperbeamPublicReadDevice(device: string) {
  return CANONICAL_NATIVE_DEVICES.has(device);
}

export function isHyperbeamDeviceEnabled(device: string) {
  if (!isHyperbeamEnabled()) return false;
  return isHyperbeamPublicReadDevice(device);
}

export function shouldSendHyperbeamAuthHeaders() {
  return isHyperbeamFullMode();
}

export function shouldAllowOriginalNetworkFallback() {
  return !isHyperbeamFullMode();
}
