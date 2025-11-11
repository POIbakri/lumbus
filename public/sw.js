// Lumbus Service Worker - Caches install pages dynamically
const CACHE_NAME = 'lumbus-install-v1';

// Install event - skip precaching since install pages are dynamic
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - cache install pages, network-first for everything else
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests - let external requests pass through
  if (url.origin !== location.origin) {
    return;
  }

  // Only cache GET requests for install pages
  if (request.method !== 'GET') {
    return;
  }

  // Cache strategy for install pages
  if (url.pathname.startsWith('/install')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response before caching
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cache if offline
          return caches.match(request);
        })
    );
    return;
  }

  // Network-first for everything else (same-origin only)
  event.respondWith(fetch(request));
});
