const CACHE_NAME = 'mini-linkedin-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/login.html',
  '/signup.html',
  '/feed.html',
  '/profile.html',
  '/notifications.html',
  '/edit-profile.html',
  '/css/styles.css',
  '/js/utils.js',
  '/js/feed.js',
  '/js/firebase-config.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js'
];

// Install event - caching assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching Assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate event - cleaning up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing Old Cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Fetch event - serving from cache or network
self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests for simple implementation, 
    // or handle them carefully. Tailwind and FontAwesome are handled here.
    
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
            // Check if we received a valid response
            if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Cache important internal assets on the fly
            const responseToCache = networkResponse.clone();
            if (event.request.url.includes('/css/') || event.request.url.includes('/js/') || event.request.url.includes('/icons/')) {
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });
            }

            return networkResponse;
        }).catch(() => {
            // If network fails and no cache, maybe return a fallback page if it's a navigation request
            if (event.request.mode === 'navigate') {
                return caches.match('/index.html');
            }
        });
      })
    );
});
