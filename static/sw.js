// Minimal service worker — clears old caches and takes control immediately.
// The real SW (from web/src/service-worker.ts) is built separately for
// production. This file acts as a safe fallback/cleanup worker.

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.map((name) => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', () => {});
