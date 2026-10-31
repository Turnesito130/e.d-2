/* ev · Registro del modo sin conexión */
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      if (typeof showSub === "function") showSub("No se pudo activar el modo sin conexión en este navegador.");
    });
  });
}
