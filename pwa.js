/* ev · Service worker: red primero y recursos guardados como respaldo */
const C = "ev-v2";
const FILES = [
  "./", "index.html", "style.css", "core.js", "sphere.js", "ui.js", "screen.js",
  "voice.js", "brain.js", "memoria.js", "acciones.js", "google.js", "herramientas.js",
  "voz.js", "guia.js", "estudio.js", "profunda.js", "jarvis.js", "ajustes.js", "barra.js",
  "copia.js", "hudinfo.js", "extras.js", "pwa.js", "main.js", "manifest.webmanifest", "icono.svg"
];
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(C).then(cache => Promise.all(FILES.map(file => cache.add(file).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== C).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(event.request).then(response => {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(C).then(cache => cache.put(event.request, copy)).catch(() => {});
      }
      return response;
    }).catch(() => caches.match(event.request, { ignoreSearch: true }).then(cached => {
      if (cached) return cached;
      return new Response("Sin conexión y recurso no guardado.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }))
  );
});
