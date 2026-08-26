// F1 by 324.ing — Service Worker
const CACHE_NAME = "f1-324-v1";

// Static assets to precache
const PRECACHE = [
  "/",
  "/drivers",
  "/teams",
  "/circuits",
  "/season",
  "/news",
  "/og-default.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // Only handle GET requests for same-origin or CDN assets
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Skip: API routes, next internals, external domains (except same origin)
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/") ||
    (url.origin !== self.location.origin)
  ) {
    return;
  }

  // Network-first for HTML pages, cache-first for static assets
  const isPage = !url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2?)$/);

  if (isPage) {
    // Network-first: try network, fall back to cache
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Cache-first: return cached or fetch and cache
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return res;
        });
      })
    );
  }
});
