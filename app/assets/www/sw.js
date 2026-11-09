/* Service worker (version web / iPhone) : l'application fonctionne hors ligne
   et les photos déjà vues restent disponibles sans connexion. */
const APP = "kf-app-v1.4.1";
const PHOTOS = "kf-photos-v2";
const MAX_PHOTOS = 300; // limite du cache photos (les plus anciennes sont retirées)
const SHELL = ["./", "index.html", "styles.css", "app.js", "content.js", "recipes.js", "photo-keywords.js",
  "icon.png", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png", "manifest.webmanifest"];

self.addEventListener("install", (e) => {
  // cache: "reload" : ne pas pré-cacher une ancienne version gardée par le cache HTTP
  e.waitUntil(caches.open(APP).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== APP && k !== PHOTOS).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  if (url.hostname === "upload.wikimedia.org") {
    // photos : cache d'abord ; on ne garde que les réponses valides, dans la limite de MAX_PHOTOS
    e.respondWith(caches.open(PHOTOS).then((c) => c.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      if (res.ok) e.waitUntil(c.put(e.request, res.clone()).then(() => trim(c)));
      return res;
    }))));
    return;
  }
  if (url.origin === location.origin) {
    e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request)));
  }
});

function trim(cache) {
  return cache.keys().then((keys) => (keys.length > MAX_PHOTOS ? Promise.all(keys.slice(0, keys.length - MAX_PHOTOS).map((k) => cache.delete(k))) : null));
}
