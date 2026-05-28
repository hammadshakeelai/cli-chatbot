const CACHE = 'mirage-v2';
const PRECACHE = [
  '/',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
];

// Install: precache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => {
      // Don't block on individual failures
      return Promise.allSettled(
        PRECACHE.map((url) =>
          cache.add(url).catch(() => {
            console.warn('[SW] Failed to precache', url);
          }),
        ),
      );
    }).then(() => self.skipWaiting()),
  );
});

// Activate: clean old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
      ),
    ).then(() => clients.claim()),
  );
});

// Fetch: network-first, fallback to cache, then offline fallback
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Skip non-HTTP(S) requests (e.g. chrome-extension://)
  if (!event.request.url.startsWith('http')) return;

  // Don't cache API calls
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(
          JSON.stringify({ error: 'You are offline. AI chat is unavailable.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful same-origin responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => {
            // Don't cache non-cacheable resources
            if (clone.type === 'basic' || clone.type === 'cors') {
              cache.put(event.request, clone);
            }
          });
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // Offline fallback for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          return new Response('Offline', { status: 503 });
        }),
      ),
  );
});
