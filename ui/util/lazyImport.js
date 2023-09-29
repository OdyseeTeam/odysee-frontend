import React from 'react';
import * as ACTIONS from 'constants/action_types';
import { URL as SITE_URL } from 'config';

const RETRY_DELAY_MS = 5000;
const RETRY_ATTEMPTS = 3;

/**
 * While there is no way to programmatically clear a user's cache, doing a
 * separate `fetch` with `no-cache` indirectly replaces the cache with a fresh
 * download.
 *
 * This is an opportunistic attempt which fails silently, as some browsers may
 * not return the URL in the error.
 *
 * @param error ChunkLoadError which contains the URL of the failed webpack import.
 * @returns {Promise<void>}
 */
async function bustFileCache(error) {
  try {
    const match = error?.message?.match(new RegExp(`${SITE_URL}(.+?\\.js)`, 'gi'));
    const url = match[0];
    await fetch(url, { cache: 'no-store' });
  } catch (err) {
    console.error('bustFileCache:', err.message); // eslint-disable-line no-console
  }
}

function componentLoader(lazyComponent, attemptsLeft) {
  return new Promise((resolve, reject) => {
    lazyComponent()
      .then(resolve)
      .catch((error) => {
        setTimeout(async () => {
          switch (attemptsLeft) {
            case 0:
              window.store.dispatch({
                type: ACTIONS.RELOAD_REQUIRED,
                data: { reason: 'lazyImportFailed', extra: error },
              });
              console.error(error.message); // eslint-disable-line no-console
              break;

            default:
              if (attemptsLeft === 1) {
                await bustFileCache(error);
              }
              componentLoader(lazyComponent, attemptsLeft - 1).then(resolve, reject);
              break;
          }
        }, RETRY_DELAY_MS);
      });
  });
}

export function lazyImport(componentImport) {
  return React.lazy(() => componentLoader(componentImport, RETRY_ATTEMPTS));
}
