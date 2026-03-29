const CACHE_NAME = 'blueprint-cache-v1';

// SECURITY: Only cache static assets, never cache authenticated routes
// Use network-first strategy to ensure fresh content
const STATIC_CACHE_URLS = [
  '/static/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(STATIC_CACHE_URLS);
      })
  );
  // Activate immediately without waiting
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // SECURITY: Never cache API requests or authenticated content
  if (request.url.includes('/api/') || request.url.includes('/dashboard') || request.url.includes('/auth')) {
    event.respondWith(fetch(request));
    return;
  }

  // For static assets: cache-first strategy
  if (request.url.match(/\.(js|css|png|jpg|jpeg|gif|webp|svg|ico|woff2?)$/)) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // For navigation requests: network-first strategy
  // This ensures users always get fresh content after logout
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(request);
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Claim all clients immediately
  self.clients.claim();
});
