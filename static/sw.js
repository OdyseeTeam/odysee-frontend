const NOTIFICATION_ICON = '/public/pwa/icon-512.png';
const NOTIFICATION_BADGE = '/public/pwa/icon-96-alpha.png';

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

self.addEventListener('push', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const payload = event.data ? event.data.json() : null;
        const data = payload?.data;

        if (!data?.title || !data?.body || !data?.link) return;

        await self.registration.showNotification(data.title, {
          body: data.body,
          data: {
            url: data.link,
          },
          badge: NOTIFICATION_BADGE,
          icon: NOTIFICATION_ICON,
        });
      } catch {}
    })()
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const notificationUrl = event.notification?.data?.url;
      if (!notificationUrl) return;

      await self.clients.claim();

      const clientList = await self.clients.matchAll({
        includeUncontrolled: true,
        type: 'window',
      });
      const existingClient = Array.isArray(clientList) && clientList.length > 0 ? clientList[0] : null;

      if (!existingClient) {
        await self.clients.openWindow(notificationUrl);
        return;
      }

      await existingClient.focus();
      await existingClient.navigate(notificationUrl);
    })()
  );
});

self.addEventListener('fetch', () => {});
