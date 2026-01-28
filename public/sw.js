const CACHE_VERSION = "v1";
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;

// Resources to precache during service worker installation
const PRECACHE_URLS = [
  "/",
  "/welcome",
  "/offline",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) =>
        cache.addAll(PRECACHE_URLS).catch((error) => {
          console.error("Failed to precache:", error);
          // Continue installation even if some resources fail
          return Promise.resolve();
        })
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter((key) => ![STATIC_CACHE, RUNTIME_CACHE].includes(key))
              .map((key) => {
                console.log("Deleting old cache:", key);
                return caches.delete(key);
              })
          )
        ),
      self.clients.claim(),
    ])
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // Handle navigation requests (page loads)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful navigation responses
          if (response.ok) {
            const responseClone = response.clone();
            caches
              .open(RUNTIME_CACHE)
              .then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          // Try to serve from static cache first, then runtime cache, then offline page
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Fallback to offline page
            return caches.match("/offline").then((offlineResponse) => {
              if (offlineResponse) {
                return offlineResponse;
              }
              // If offline page is not cached, return a basic response
              return new Response(
                "<html><body><h1>Offline</h1><p>You are offline and this page is not cached.</p></body></html>",
                {
                  headers: { "Content-Type": "text/html" },
                }
              );
            });
          });
        })
    );
    return;
  }

  // Handle static assets (styles, scripts, images, fonts)
  if (["style", "script", "image", "font"].includes(request.destination)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((response) => {
            if (response.ok) {
              const responseClone = response.clone();
              caches
                .open(RUNTIME_CACHE)
                .then((cache) => cache.put(request, responseClone));
            }
            return response;
          })
          .catch(() => {
            // For failed asset requests, return empty response to avoid errors
            if (request.destination === "image") {
              // Return a transparent 1x1 pixel for images
              return new Response(
                new Uint8Array([
                  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
                  0x80, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21,
                  0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00,
                  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
                  0x01, 0x00, 0x3b,
                ]),
                { headers: { "Content-Type": "image/gif" } }
              );
            }
            return new Response("", {
              status: 408,
              statusText: "Request Timeout",
            });
          });
      })
    );
    return;
  }

  // Handle API requests with cache fallback
  if (url.pathname.startsWith("/api")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches
              .open(RUNTIME_CACHE)
              .then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
  }
});
