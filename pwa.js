/* ev · Service worker: primero la red, la copia guardada si no hay internet */
const C = "ev-v1";
const FILES = ["./", "index.html", "style.css", "core.js", "sphere.js", "ui.js", "screen.js", "voice.js", "brain.js", "memoria.js", "acciones.js", "google.js", "herramientas.js", "voz.js", "pwa.js", "main.js", "icono.svg"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(C).then(c => Promise.all(FILES.map(f => c.add(f).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request, { cache: "no-cache" }).then(r => { const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)); return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true })));
});
