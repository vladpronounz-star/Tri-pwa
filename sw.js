/* TRI V4.2 shell cache. Never opens, migrates, or deletes IndexedDB. */
const SHELL_CACHE = "tri-shell-v4.2.0";
const SHELL = ["./", "./index.html", "./manifest.json", "./icons/icon-192.png", "./icons/icon-512.png"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(SHELL_CACHE).then(cache => cache.addAll(SHELL)));
  // A running session keeps its current worker until the user accepts the update.
});

self.addEventListener("message", event => {
  if (event.data?.type === "ACTIVATE_UPDATE") self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
  // Existing caches and all IndexedDB data remain untouched.
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(caches.open(SHELL_CACHE).then(cache => cache.put("./index.html", copy)));
        }
        return response;
      }).catch(async () => (await (await caches.open(SHELL_CACHE)).match("./index.html")) || Response.error())
    );
    return;
  }
  if (SHELL.some(path => new URL(path, self.location.href).href === url.href)) {
    event.respondWith(caches.open(SHELL_CACHE).then(cache => cache.match(request).then(cached => cached || fetch(request))));
  }
});
