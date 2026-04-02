const CACHE_NAME = "yadav-store-cache-v5";
const urlsToCache = [
  "/",
  "/style.css",
  "/script.js",
  "/catalog.js"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        try {
            return cache.addAll(urlsToCache);
        } catch(e) { console.warn(e) }
      })
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

self.addEventListener("fetch", event => {
  // Let the browser handle navigation requests natively
  if (event.request.mode === 'navigate') {
    return;
  }

  // Network First, fallback to cache for other assets
  event.respondWith(
    fetch(event.request).then(response => {
      // Clone response and cache it
      if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
          });
      }
      return response;
    }).catch(() => {
      // If network fails, try cache
      return caches.match(event.request);
    })
  );
});
