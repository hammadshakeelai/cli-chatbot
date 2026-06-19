// Self-destructing service worker: v2 dropped offline caching (it caused
// stale-app bugs). This unregisters any previously installed worker and
// clears old caches so every visitor gets the live app.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((c) => c.navigate(c.url).catch(() => {}));
    })(),
  );
});
