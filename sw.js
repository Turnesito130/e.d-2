/* ev · Service worker: red primero y recursos guardados como respaldo */
const CACHE_NAME = "ev-v2";
const APP_FILES = [
  "./", "./index.html", "./style.css", "./core.js", "./sphere.js", "./ui.js", "./screen.js",
  "./voice.js", "./brain.js", "./memoria.js", "./acciones.js", "./google.js", "./herramientas.js",
  "./voz.js", "./guia.js", "./estudio.js", "./profunda.js", "./jarvis.js", "./ajustes.js", "./barra.js",
  "./copia.js", "./hudinfo.js", "./extras.js", "./manifest.webmanifest", "./icono.svg"
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
