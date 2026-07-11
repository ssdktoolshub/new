// SSDK Tools Hub Service Worker - Coordinates offline caching and instant asset delivery

const CACHE_NAME = "ssdk-cache-v1";
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./assets/css/ssdk-style.css",
  "./assets/images/logo.png",
  "./core/core.js",
  "./core/bootstrap.js",
  "./core/sdk.js",
  "./engines/config-engine.js",
  "./engines/theme-engine.js",
  "./engines/router-engine.js",
  "./engines/tool-engine.js",
  "./engines/search-engine.js",
  "./engines/history-engine.js",
  "./engines/favorites-engine.js",
  "./engines/seo-engine.js",
  "./engines/homepage-engine.js",
  "./engines/analytics-engine.js",
  "./engines/notification-engine.js",
  "./engines/recommendation-engine.js",
  "./engines/firebase-engine.js",
  "./engines/python-engine.js",
  "./engines/ai-engine.js",
  "./engines/plugin-engine.js",
  "./engines/update-engine.js",
  "./engines/category-engine.js",
  "./components/glass-components.js"
];

// Install Event - Pre-cache core files
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[ServiceWorker] Pre-caching static app shell");
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up expired cache buckets
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[ServiceWorker] Removing expired cache:", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Cache-first with Network fallback for assets, Network-first for JSON configs
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  
  // Ignore Firestore / Firebase network queries
  if (url.origin.includes("firebase") || url.origin.includes("googleapis")) {
    return;
  }

  const isConfigJson = url.pathname.includes("/json/");

  if (isConfigJson) {
    // Network-first strategy for configs so updates are instantly reflected
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, response.clone());
            return response;
          });
        })
        .catch(() => {
          return caches.match(e.request);
        })
    );
  } else {
    // Cache-first strategy for core static scripts and CSS assets
    e.respondWith(
      caches.match(e.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(e.request).then((response) => {
          // Cache newly fetched assets dynamically if valid
          if (response && response.status === 200 && response.type === "basic") {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, responseToCache);
            });
          }
          return response;
        });
      })
    );
  }
});
