const CACHE_NAME = "yadav-store-cache-v4";
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
  // Let the browser handle navigation requests natively to avoid 308 Redirect crashing
  if (event.request.mode === 'navigate') {
    return; // Do nothing, skips the service worker entirely for page loads!
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).catch(() => {});
      })
  );
});
