/*! K:sw0001:1:63:k0:s1w2 !*/
/**
 * KONOMI Service Worker - Offline Caching
 */
const CACHE_NAME = 'konomi-v1';
const CACHE_URLS = [
  './',
  './index.html',
  './app.html',
  './css/style.css',
  './config.js',
  './core/blocks/block.js',
  './core/templates/atomic.js',
  './core/templates/auto.js',
  './core/compiler/haskell.js',
  './academy/index.html',
  './academy/levels.js',
  './academy/progress.js',
  './academy/gate.js',
  './3d/index.html',
  './3d/world.js',
  './3d/grid.js',
  './3d/chunks.js',
  './3d/repl.html',
  './3d/academy.html',
  './3d/typeflow.html',
  './ml/index.js',
  './ai/index.js'
];

// Install - cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching core assets');
        return cache.addAll(CACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME)
            .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        // Return cached if available
        if (cached) {
          // Update cache in background
          fetch(event.request)
            .then(response => {
              if (response.ok) {
                caches.open(CACHE_NAME)
                  .then(cache => cache.put(event.request, response));
              }
            })
            .catch(() => {});
          return cached;
        }

        // Fetch from network
        return fetch(event.request)
          .then(response => {
            // Cache successful responses
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, clone));
            }
            return response;
          })
          .catch(() => {
            // Offline fallback for HTML pages
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('./index.html');
            }
          });
      })
  );
});

// Handle messages from clients
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
