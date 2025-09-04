// Filter out noisy console messages in Cordova
export function setupCordovaConsoleFilter() {
  if (!window.cordova) return;

  const originalWarn = console.warn;
  const originalError = console.error;
  const originalLog = console.log;

  const filterPatterns = [
    'requestStorageAccess',
    'document.hasStorageAccess',
    'NotAllowedError',
    'permissionState was prompt',
  ];

  const shouldFilter = (args) => {
    const message = args[0];
    if (typeof message === 'string') {
      return filterPatterns.some((pattern) => message.includes(pattern));
    }
    return false;
  };

  console.warn = function (...args) {
    if (!shouldFilter(args)) {
      originalWarn.apply(console, args);
    }
  };

  console.error = function (...args) {
    if (!shouldFilter(args)) {
      originalError.apply(console, args);
    }
  };

  console.log = function (...args) {
    if (!shouldFilter(args)) {
      originalLog.apply(console, args);
    }
  };
}
