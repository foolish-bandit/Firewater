// Service worker with build-hash cache versioning.
// The CACHE_VERSION is replaced at build time by vite to ensure
// old cached assets are invalidated on each deploy.
const CACHE_VERSION = '__BUILD_HASH__';
const CACHE_NAME = `firewater-${CACHE_VERSION}`;

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Clean up old caches from previous versions
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key.startsWith('firewater-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    }).then(() => clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never cache API calls or auth endpoints
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // For navigation requests (HTML), always go network-first
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // For static assets with hash in filename (e.g., index-0pNPWcky.js),
  // use cache-first since the hash guarantees content immutability
  if (url.pathname.match(/\.[a-f0-9]{8,}\./)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Everything else: network-first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
