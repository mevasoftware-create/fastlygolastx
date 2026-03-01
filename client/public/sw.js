// Service Worker for FastlyGo
// Version: 1.0.3 - Optimized caching strategy for better performance

const CACHE_VERSION = 'v1.0.3';
const CACHE_NAME = `fastlygo-${CACHE_VERSION}`;
const STATIC_CACHE = `fastlygo-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `fastlygo-dynamic-${CACHE_VERSION}`;

// Install event - clean up old caches
self.addEventListener('install', (event) => {
  console.log('[SW] Installing new service worker version:', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith('fastlygo-') && 
                  cacheName !== CACHE_NAME && 
                  cacheName !== STATIC_CACHE && 
                  cacheName !== DYNAMIC_CACHE)
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      // Force the waiting service worker to become the active service worker
      return self.skipWaiting();
    })
  );
});

// Activate event - take control immediately
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating new service worker version:', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith('fastlygo-') && 
                  cacheName !== CACHE_NAME && 
                  cacheName !== STATIC_CACHE && 
                  cacheName !== DYNAMIC_CACHE)
          .map((cacheName) => {
            console.log('[SW] Cleaning up old cache during activation:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - optimized caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip API requests and non-GET requests
  if (request.url.includes('/api/') || request.method !== 'GET') {
    return;
  }

  // Cache-first for static assets (images, fonts, icons)
  if (request.url.match(/\.(jpg|jpeg|png|gif|webp|svg|woff|woff2|ttf|eot|ico)$/)) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          return response;
        }
        return fetch(request).then((fetchResponse) => {
          if (fetchResponse && fetchResponse.status === 200) {
            const responseToCache = fetchResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return fetchResponse;
        }).catch((error) => {
          console.log('[SW] Failed to fetch static asset:', error);
          return new Response('Asset not available', {
            status: 404,
            statusText: 'Not Found'
          });
        });
      })
    );
    return;
  }

  // Stale-while-revalidate for JS/CSS (versioned with hash)
  if (request.url.includes('/assets/') || 
      request.url.endsWith('.js') || 
      request.url.endsWith('.css')) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch((error) => {
            console.log('[SW] Network request failed:', error);
            // Return cached version if network fails
            return cachedResponse || new Response('Network error', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });

          // Return cached response immediately, update in background
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Network-first for HTML pages
  event.respondWith(
    fetch(request).then((response) => {
      if (response && response.status === 200) {
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });
      }
      return response;
    }).catch((error) => {
      console.log('[SW] Network request failed, trying cache:', error);
      return caches.match(request).then(cachedResponse => {
        return cachedResponse || new Response('Network error', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      });
    })
  );
});

// Message event - force update on demand
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('[SW] Clearing cache on demand:', cacheName);
            return caches.delete(cacheName);
          })
        );
      })
    );
  }
});
