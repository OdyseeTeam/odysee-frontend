const DYNAMIC_IMPORT_RELOAD_PREFIX = 'dynamic-import-reload:';
const DYNAMIC_IMPORT_ERROR_PATTERNS = [
  /dynamically imported module/i,
  /ChunkLoadError/i,
  /Importing a module script failed/i,
  /Unable to preload CSS/i,
  /[._]result\.default/i,
  /_result is undefined/i,
];

export function getDynamicImportErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error === null || error === undefined) return '';
  if (typeof error === 'object') {
    try {
      return JSON.stringify(error);
    } catch {
      return Object.prototype.toString.call(error);
    }
  }
  if (typeof error === 'symbol') {
    return error.description || error.toString();
  }
  if (typeof error === 'function') {
    return error.name || '[function]';
  }
  if (typeof error === 'number' || typeof error === 'boolean' || typeof error === 'bigint') {
    return error.toString();
  }
  return '';
}

export function shouldReloadForDynamicImportError(error: unknown): boolean {
  const message = getDynamicImportErrorMessage(error);
  return DYNAMIC_IMPORT_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

export function reloadOnceForDynamicImportError(error: unknown): boolean {
  if (!shouldReloadForDynamicImportError(error)) {
    return false;
  }

  const message = getDynamicImportErrorMessage(error);
  const key = `${DYNAMIC_IMPORT_RELOAD_PREFIX}${message}`;

  try {
    if (sessionStorage.getItem(key)) {
      return false;
    }

    sessionStorage.setItem(key, '1');
  } catch {
    return false;
  }

  window.location.replace(window.location.href);
  return true;
}
