/* Service worker (version web / iPhone) : l'application fonctionne hors ligne
   et les photos déjà vues restent disponibles sans connexion. */
const APP = "kf-app-v1.2.0";
const PHOTOS = "kf-photos-v1";
const SHELL = ["./", "index.html", "styles.css", "app.js", "content.js", "recipes.js", "photo-keywords.js",
  "icon.png", "icon-192.png", "icon-512.png", "apple-touch-icon.png", "manifest.webmanifest"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(APP).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== APP && k !== PHOTOS).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  if (url.hostname === "upload.wikimedia.org") {
    // photos : cache d'abord, réseau ensuite
    e.respondWith(caches.open(PHOTOS).then((c) => c.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      if (res.ok || res.type === "opaque") c.put(e.request, res.clone());
      return res;
    }))));
    return;
  }
  if (url.origin === location.origin) {
    e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request)));
  }
});
