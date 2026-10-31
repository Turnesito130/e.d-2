/* ev · Panel de estado y contador orientativo de peticiones */
function fechaLocalKey() {
  const d = new Date(), y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}
function usoHoy() {
  try { const value = JSON.parse(store.get("ed_uso_" + fechaLocalKey()) || "{}"); return value && typeof value === "object" ? value : {}; }
  catch (e) { return {}; }
}
function sumaUso(key, amount) {
  const usage = usoHoy(); usage[key] = (Number(usage[key]) || 0) + amount;
  store.set("ed_uso_" + fechaLocalKey(), JSON.stringify(usage));
}
const fetchOriginal = window.fetch.bind(window);
window.fetch = function(input, init) {
  const url = typeof input === "string" ? input : (input && input.url) || "";
  if (url.includes("generativelanguage.googleapis.com")) sumaUso("gemini", 1);
  if (url.includes("api.elevenlabs.io") && init && typeof init.body === "string") {
    try { const body = JSON.parse(init.body); if (typeof body.text === "string") sumaUso("elevenChars", body.text.length); } catch (e) {}
  }
  return fetchOriginal(input, init).then(response => {
    if (response.status === 429 && (url.includes("googleapis.com") || url.includes("elevenlabs.io"))) {
      showSub("Se alcanzó un límite temporal del servicio. Espera un poco o usa la voz del navegador.");
    }
    return response;
  });
};
const hud = document.createElement("div"); hud.id = "hudinfo";
const hudStyle = document.createElement("style");
hudStyle.textContent = "#hudinfo{position:fixed;left:12px;top:12px;z-index:2;padding:8px 11px;border:1px solid rgba(80,215,250,.25);border-radius:9px;background:rgba(1,10,16,.72);color:var(--dim);font:12px/1.5 'Exo 2',system-ui,sans-serif;pointer-events:none;max-width:220px}#hudinfo strong{color:var(--bone);font-size:14px;font-weight:400}";
document.head.appendChild(hudStyle); document.body.appendChild(hud);
let batteryInfo = null;
if (navigator.getBattery) navigator.getBattery().then(b => { batteryInfo = b; b.addEventListener("levelchange", actualizarHud); b.addEventListener("chargingchange", actualizarHud); }).catch(() => {});
function actualizarHud() {
  const d = new Date(), connection = navigator.connection, usage = usoHoy();
  const lines = [
    d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) + " · " + d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" }),
    "Red: " + (navigator.onLine ? (connection && connection.effectiveType ? connection.effectiveType : "conectada") : "sin conexión"),
    "Gemini hoy: " + (usage.gemini || 0) + " peticiones"
  ];
  if (batteryInfo) lines.push("Batería: " + Math.round(batteryInfo.level * 100) + "%" + (batteryInfo.charging ? " · cargando" : ""));
  hud.replaceChildren();
  const strong = document.createElement("strong"); strong.textContent = lines.shift(); hud.appendChild(strong);
  lines.forEach(line => { const div = document.createElement("div"); div.textContent = line; hud.appendChild(div); });
}
actualizarHud();
setInterval(actualizarHud, 15000);
