    const CACHE_NAME = 'my-pwa-cache-v1'; // Change this when you update assets
    const URLS_TO_CACHE = [
      '/', // Your home page
      '/index.html', // Or your specific entry point
      '/styles/main.css', // Your CSS files
      '/scripts/app.js', // Your JavaScript files
      '/images/logo.png', // Key images
      '/icons/icon-192x192.png' // An icon often used in notifications or UI
      // Add other important assets for your app shell
    ];

    // Install event: Cache core assets
    self.addEventListener('install', event => {
      event.waitUntil(
        caches.open(CACHE_NAME)
          .then(cache => {
            console.log('Opened cache');
            return cache.addAll(URLS_TO_CACHE);
          })
      );
    });

    // Activate event: Clean up old caches
    self.addEventListener('activate', event => {
      event.waitUntil(
        caches.keys().then(cacheNames => {
          return Promise.all(
            cacheNames.map(cacheName => {
              if (cacheName !== CACHE_NAME) { // If it's an old cache
                console.log('ServiceWorker: deleting old cache', cacheName);
                return caches.delete(cacheName);
              }
            })
          );
        })
      );
      return self.clients.claim(); // Ensure new SW takes control immediately
    });

    // Fetch event: Serve cached content when offline, or fetch from network
    self.addEventListener('fetch', event => {
      event.respondWith(
        caches.match(event.request)
          .then(response => {
            // Cache hit - return response
            if (response) {
              return response;
            }
            // Not in cache - fetch from network
            return fetch(event.request).then(
              networkResponse => {
                // Check if we received a valid response
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                  return networkResponse;
                }

                // IMPORTANT: Clone the response. A response is a stream
                // and because we want the browser to consume the response
                // as well as the cache consuming the response, we need
                // to clone it so we have two streams.
                const responseToCache = networkResponse.clone();

                caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(event.request, responseToCache); // Cache the new resource
                  });

                return networkResponse;
              }
            ).catch(error => {
              // Network request failed, and not in cache
              // You could return a custom offline fallback page here if desired
              console.error('Fetching failed:', error);
              // For example: return caches.match('/offline.html');
              throw error;
            });
          })
      );
    });
    
    