// ****************************************************************************
// ****************************************************************************
export const LS = Object.freeze({
  AUTH_IN_PROGRESS: 'authInProgress',
  CHANNEL_LIVE_STATUS: 'channel-live-status',
  GDPR_REQUIRED: 'gdprRequired',
  // <-- should be using 'locale/get', right?
  SHARE_INTERNAL: 'shareInternal',
  TUS_LOCKED_UPLOADS: 'tusLockedUploads',
  TUS_REFRESH_LOCK: 'tusRefreshLock',
  TUS_REMOVED_UPLOADS: 'tusRemovedUploads',
  IS_NEW_ACCOUNT: 'is_new_account',
});
// ****************************************************************************
// ****************************************************************************
const TEST_KEY = '__E1648C16E620203B60C99B285B255C47899B9A76A52387B77B61456D6601CC7B__';
export function isLocalStorageAvailable() {
  try {
    window.localStorage.setItem(TEST_KEY, TEST_KEY);
    window.localStorage.removeItem(TEST_KEY);
    return true;
  } catch (e) {
    return false;
  }
}
export function isSessionStorageAvailable() {
  try {
    window.sessionStorage.setItem(TEST_KEY, TEST_KEY);
    window.sessionStorage.removeItem(TEST_KEY);
    return true;
  } catch (e) {
    return false;
  }
}
export function getLocalStorageSummary() {
  try {
    const count = window.localStorage.length;
    const estimatedSize = JSON.stringify(window.localStorage).length;
    return `${count} items; ${estimatedSize} bytes`;
  } catch (e) {
    return 'inaccessible';
  }
}
// ****************************************************************************
// Wrapper for localStorage/sessionStorage
// ****************************************************************************
// Wrapper for local/sessionStorage that helps to suppress errors.
// !! Use this only in areas where the error does not matter,
// !! or the null return value is handled with a fallback.
export const LocalStorage = storageFactory(() => window.localStorage, 'localStorage');
export const SessionStorage = storageFactory(() => window.sessionStorage, 'sessionStorage');

// ****************************************************************************
// Internal
// ****************************************************************************
function storageFactory(getStorage: () => Storage, name: string) {
  // Adapted from https://github.com/MichalZalecki/storage-factory.
  // Changes:
  // - No in-memory fallback, at least for now. Not sure what will happen when
  //   quota is exceeded during use ... will it be mixing storages?
  // - Skip the 'write-read-erase' test sequence, which makes dev tool's storage
  //   viewer blink. The failure to call the function itself should be sufficient.
  function clear(): void {
    try {
      getStorage().clear();
    } catch (_) {
      // storage access may fail in restricted environments
    }
  }

  function getItem(name: string): string | null | undefined {
    try {
      return getStorage().getItem(name);
    } catch (_) {
      // storage access may fail in restricted environments
    }

    return null;
  }

  function key(index: number): string | null | undefined {
    try {
      return getStorage().key(index);
    } catch (_) {
      // storage access may fail in restricted environments
    }
  }

  function removeItem(name: string): void {
    try {
      getStorage().removeItem(name);
    } catch (_) {
      // storage access may fail in restricted environments
    }
  }

  function setItem(name: string, value: string): void {
    try {
      getStorage().setItem(name, value);
    } catch (_) {
      // storage access may fail in restricted environments
    }
  }

  function length(): number | null | undefined {
    try {
      return getStorage().length;
    } catch (_) {
      // storage access may fail in restricted environments
    }
  }

  return {
    getItem,
    setItem,
    removeItem,
    clear,
    key,

    get length() {
      return length();
    },
  };
}
