const CACHE_NAME = "vale-metro-control-v9";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.webmanifest",
  "./src/main.js",
  "./src/simulation.js",
  "./assets/vale-metro-control-logo.png",
  "./assets/control-room-concept.png",
  "./assets/camila-rocha-mentor.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const isNavigation = event.request.mode === "navigate" || new URL(event.request.url).pathname.endsWith(".html");
  const fromNetwork = fetch(event.request).then((response) => {
    const copy = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
    return response;
  });
  event.respondWith(isNavigation
    ? fromNetwork.catch(() => caches.match(event.request).then((cached) => cached || caches.match("./index.html")))
    : caches.match(event.request).then((cached) => cached || fromNetwork.catch(() => caches.match("./index.html"))));
});
