/**
 * Caches optimized/transmuxed File objects in IndexedDB so they survive
 * page refreshes. On upload resume, the cached file can be retrieved
 * instead of requiring the user to re-optimize.
 */

const DB_NAME = 'odysee-upload-cache';
const STORE_NAME = 'files';
const HLS_STORE_NAME = 'hls_packages';
const DB_VERSION = 2;
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.addEventListener('upgradeneeded', () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains(HLS_STORE_NAME)) {
        db.createObjectStore(HLS_STORE_NAME);
      }
    });
    request.addEventListener('success', () => resolve(request.result), {
      once: true,
    });
    request.addEventListener('error', () => reject(request.error), {
      once: true,
    });
  });
}

export type CachedHlsTier = {
  name: string;
  height: number;
  width: number;
  bitrate: number;
  blob: Blob;
  fileName: string;
};

export type CachedHlsPackage = {
  masterPlaylist: string;
  playlists: Record<string, string>;
  tiers: CachedHlsTier[];
  cachedAt: number;
};

export type CachedFile = {
  blob: Blob;
  name: string;
  type: string;
  cachedAt: number;
};

/**
 * Store an optimized file in IndexedDB, keyed by the upload guid.
 * The file is stored as a Blob (serializable) with metadata.
 */
export async function cacheOptimizedFile(guid: string, file: File): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const entry: CachedFile = {
      blob: file,
      name: file.name,
      type: file.type,
      cachedAt: Date.now(),
    };

    store.put(entry, guid);
    await new Promise<void>((resolve, reject) => {
      tx.addEventListener('complete', () => resolve(), { once: true });
      tx.addEventListener('error', () => reject(tx.error), { once: true });
    });
    db.close();
  } catch (e) {
    console.warn('[UploadCache] Failed to cache file:', e); // eslint-disable-line no-console
  }
}

/**
 * Retrieve a cached optimized file by upload guid.
 * Returns a File object or null if not found/expired.
 */
export async function getCachedFile(guid: string): Promise<File | null> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    const entry = await new Promise<CachedFile | undefined>((resolve, reject) => {
      const request = store.get(guid);
      request.addEventListener('success', () => resolve(request.result), {
        once: true,
      });
      request.addEventListener('error', () => reject(request.error), {
        once: true,
      });
    });

    db.close();

    if (!entry) return null;

    // Expire old entries
    if (Date.now() - entry.cachedAt > MAX_AGE_MS) {
      removeCachedFile(guid);
      return null;
    }

    return new File([entry.blob], entry.name, { type: entry.type });
  } catch (e) {
    console.warn('[UploadCache] Failed to retrieve cached file:', e); // eslint-disable-line no-console
    return null;
  }
}

/**
 * Remove a cached file after successful upload or expiry.
 */
export async function removeCachedFile(guid: string): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(guid);
    await new Promise<void>((resolve, reject) => {
      tx.addEventListener('complete', () => resolve(), { once: true });
      tx.addEventListener('error', () => reject(tx.error), { once: true });
    });
    db.close();
  } catch {
    // Silently ignore cleanup failures
  }
}

/**
 * Clean up all expired entries.
 */
export async function cleanupExpiredCache(): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const request = store.openCursor();
    request.addEventListener('success', () => {
      const cursor = request.result;
      if (cursor) {
        const entry = cursor.value as CachedFile;
        if (Date.now() - entry.cachedAt > MAX_AGE_MS) {
          cursor.delete();
        }
        cursor.continue();
      }
    });

    await new Promise<void>((resolve, reject) => {
      tx.addEventListener('complete', () => resolve(), { once: true });
      tx.addEventListener('error', () => reject(tx.error), { once: true });
    });
    db.close();
  } catch {
    // Silently ignore
  }
}

export async function cacheHlsPackage(guid: string, pkg: CachedHlsPackage): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(HLS_STORE_NAME, 'readwrite');
    const store = tx.objectStore(HLS_STORE_NAME);

    store.put(pkg, guid);
    await new Promise<void>((resolve, reject) => {
      tx.addEventListener('complete', () => resolve(), { once: true });
      tx.addEventListener('error', () => reject(tx.error), { once: true });
    });
    db.close();
  } catch (e) {
    console.warn('[UploadCache] Failed to cache HLS package:', e); // eslint-disable-line no-console
  }
}

export async function getCachedHlsPackage(guid: string): Promise<CachedHlsPackage | null> {
  try {
    const db = await openDb();
    const tx = db.transaction(HLS_STORE_NAME, 'readonly');
    const store = tx.objectStore(HLS_STORE_NAME);

    const entry = await new Promise<CachedHlsPackage | undefined>((resolve, reject) => {
      const request = store.get(guid);
      request.addEventListener('success', () => resolve(request.result), {
        once: true,
      });
      request.addEventListener('error', () => reject(request.error), {
        once: true,
      });
    });

    db.close();

    if (!entry) return null;

    if (Date.now() - entry.cachedAt > MAX_AGE_MS) {
      removeCachedHlsPackage(guid);
      return null;
    }

    return entry;
  } catch (e) {
    console.warn('[UploadCache] Failed to retrieve cached HLS package:', e); // eslint-disable-line no-console
    return null;
  }
}

export async function removeCachedHlsPackage(guid: string): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(HLS_STORE_NAME, 'readwrite');
    tx.objectStore(HLS_STORE_NAME).delete(guid);
    await new Promise<void>((resolve, reject) => {
      tx.addEventListener('complete', () => resolve(), { once: true });
      tx.addEventListener('error', () => reject(tx.error), { once: true });
    });
    db.close();
  } catch {
    // Silently ignore cleanup failures
  }
}
