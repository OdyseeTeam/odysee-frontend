/**
 * Caches optimized/transmuxed File objects in IndexedDB so they survive
 * page refreshes. On upload resume, the cached file can be retrieved
 * instead of requiring the user to re-optimize.
 */

const DB_NAME = 'odysee-upload-cache';
const STORE_NAME = 'files';
const DB_VERSION = 1;
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

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
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
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
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
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
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
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
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        const entry = cursor.value as CachedFile;
        if (Date.now() - entry.cachedAt > MAX_AGE_MS) {
          cursor.delete();
        }
        cursor.continue();
      }
    };

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Silently ignore
  }
}
