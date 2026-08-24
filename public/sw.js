/**
 * Hand-written service worker.
 *
 * next-pwa is webpack-only and Next 16 builds with Turbopack, so a plain
 * worker avoids coupling the build to a bundler plugin. Scope is deliberately
 * narrow: cache the menu shell and its imagery for offline browsing, and never
 * cache anything that mutates state.
 */
const VERSION = "mist-v1";
const SHELL = `${VERSION}-shell`;
const IMAGES = `${VERSION}-images`;
const SHELL_URLS = ["/tr", "/en", "/tr/menu", "/en/menu", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL).then((c) => c.addAll(SHELL_URLS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Orders, waiter calls and bill requests must never be served from cache.
  if (url.pathname.startsWith("/api/")) return;

  // Photography: cache-first, it never changes under a given URL.
  if (request.destination === "image") {
    event.respondWith(
      caches.open(IMAGES).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        try {
          const res = await fetch(request);
          if (res.ok) cache.put(request, res.clone());
          return res;
        } catch {
          return hit ?? Response.error();
        }
      }),
    );
    return;
  }

  // Pages: network-first so prices are never stale, cache as the offline floor.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(request);
          const cache = await caches.open(SHELL);
          cache.put(request, res.clone());
          return res;
        } catch {
          return (await caches.match(request)) ?? (await caches.match("/tr/menu")) ?? Response.error();
        }
      })(),
    );
  }
});
