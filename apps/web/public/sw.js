/*
 * VittamHub service worker — deliberately tiny. Its only job is to show a
 * branded "can't load right now" page when the site itself can't be
 * reached (no internet, or the host is down), instead of the browser's own
 * error screen. It does not cache pages, data or assets for normal use, so
 * people always get the live site when it's reachable.
 */
const CACHE = "vh-offline-v1";
const OFFLINE_URL = "/offline.html";
const PRECACHE = [OFFLINE_URL, "/brand/vittamhub-logo.png"];
const HOST_UNAVAILABLE = [502, 503, 504];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // The offline page's logo, served from the cache so it shows while offline.
  if (request.method === "GET" && url.origin === self.location.origin && PRECACHE.includes(url.pathname) && url.pathname !== OFFLINE_URL) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
    return;
  }

  if (request.mode !== "navigate") return;

  event.respondWith(
    fetch(request)
      .then((response) => (HOST_UNAVAILABLE.includes(response.status) ? caches.match(OFFLINE_URL).then((page) => page || response) : response))
      .catch(() => caches.match(OFFLINE_URL).then((page) => page || Response.error())),
  );
});
