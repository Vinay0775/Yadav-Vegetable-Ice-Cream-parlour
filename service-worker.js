const CACHE_NAME = "yadav-store-cache-v2";
const urlsToCache = [
  "/index.html",
  "/style.css",
  "/script.js",
  "/catalog.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log("Opened PWA cache");
        // We do not fail the install if caches fail in this simple setup
        try {
            return cache.addAll(urlsToCache);
        } catch(e) { console.warn(e) }
      })
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).catch(() => {
            // Optional offline fallback logic could go here
        });
      })
  );
});
