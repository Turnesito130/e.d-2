/* ev · Service worker: red primero y recursos guardados como respaldo */
const CACHE_NAME = "ev-v2";
const APP_FILES = [
  "./", "./index.html", "./style.css", "./js/core.js", "./js/sphere.js", "./js/ui.js", "./js/screen.js",
  "./js/voice.js", "./js/brain.js", "./js/memoria.js", "./js/acciones.js", "./js/google.js", "./js/herramientas.js",
  "./js/voz.js", "./js/guia.js", "./js/estudio.js", "./js/profunda.js", "./js/jarvis.js", "./js/ajustes.js", "./js/barra.js",
  "./js/copia.js", "./js/hudinfo.js", "./js/extras.js", "./manifest.webmanifest", "./icono.svg"
];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME)
    .then(cache => Promise.all(APP_FILES.map(path => cache.add(path).catch(() => null))))
    .then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).then(response => {
    if (response && response.ok) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)).catch(() => {});
    }
    return response;
  }).catch(() => caches.match(event.request, { ignoreSearch: true }).then(cached =>
    cached || new Response("Sin conexión: este recurso todavía no está guardado.", {
      status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" }
    })
  )));
});
