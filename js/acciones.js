/* ev · Acciones por voz: páginas, temporizador, calculadora, notas, estudio y diagnóstico */
const SITES = { maps: "https://www.google.com/maps", traductor: "https://translate.google.com", youtube: "https://www.youtube.com", gmail: "https://mail.google.com", classroom: "https://classroom.google.com", drive: "https://drive.google.com", calendario: "https://calendar.google.com", github: "https://github.com", spotify: "https://open.spotify.com", whatsapp: "https://web.whatsapp.com", wikipedia: "https://es.wikipedia.org", google: "https://www.google.com" };const NUM = { un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, quince: 15, veinte: 20, treinta: 30 };
const NUMRE = /\b(un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|quince|veinte|treinta)\b/g;
function showLink(url, label) {
  const old = $("toast"); if (old) old.remove();
  const d = document.createElement("div"); d.id = "toast";
  d.style.cssText = "position:fixed;top:48px;left:50%;transform:translateX(-50%);z-index:6;background:rgba(20,12,4,.96);border:1px solid #4a3216;border-radius:12px;padding:10px 16px";
  const a = document.createElement("a"); a.href = url; a.target = "_blank"; a.rel = "noopener"; a.textContent = label; a.style.cssText = "color:#ffb347;text-decoration:none";
  d.appendChild(a); document.body.appendChild(d); setTimeout(() => d.remove(), 20000);
}
function openUrl(url, label) { if (!window.open(url, "_blank")) showLink(url, "Abrir " + label); }
function reply(q, text, byText) {
  const long = text.length > 160;
  $("you").textContent = q; showSub(long ? text.slice(0, 157) + "…" : text);
  if (byText || long) { addMsg("u", q); addMsg("e", text); if (long) $("chat").classList.add("open"); }
  speak(text); return true;
}
function calc(x) {
  let e = x.replace(/,/g, ".").replace(/dividido (entre|por)|\bentre\b/g, "/").replace(/\bpor\b|\bx\b/g, "*").replace(/\bmas\b/g, "+").replace(/\bmenos\b/g, "-").replace(/elevado a/g, "**").replace(/al cuadrado/g, "**2").replace(/al cubo/g, "**3").replace(NUMRE, w => NUM[w]);
  if (!/^[0-9+\-*/(). ]+$/.test(e)) return null;
  try { const r = Function('"use strict";return (' + e + ")")(); return Number.isFinite(r) ? String(Math.round(r * 1e6) / 1e6).replace(".", ",") : null; } catch (err) { return null; }
}
function diagnostico() {
  const o = (c, y, f) => (c ? "✔ " + y : "✘ " + f);
  return [
    o(!!navigator.gpu, "WebGPU disponible", "sin WebGPU: el cerebro local no funcionará"),
    o(!!SR, "reconocimiento de voz", "sin reconocimiento de voz"),
    o("documentPictureInPicture" in window, "ventana flotante", "sin ventana flotante"),
    o(!!stream, "pantalla compartida", "pantalla sin compartir"),
    o(!!store.get("ed_k1"), "clave de Gemini guardada", "falta la clave de Gemini"),
    o(!!(store.get("ed_k2") && store.get("ed_vid")), "voz de ElevenLabs lista", "usa la voz del navegador"),
    o(!!llm, "cerebro local cargado", "cerebro local sin cargar"),
    o(typeof gtoken !== "undefined" && !!gtoken, "Google conectado", "Google sin conectar")
  ].join("\n");
}
async function commandHook(text, byText) {
  const n = norm(text).replace(/[¿?¡!.,]/g, " ").replace(/\s+/g, " ").trim();
  let m;
  if (/diagnostico/.test(n)) return reply(text, diagnostico(), byText);
  if (typeof googleCmd === "function") { const g = await googleCmd(n); if (g) return reply(text, g, byText); }
  if ((m = text.match(/^\s*(anota|apunta|recuerda|memoriza)\s+(que\s+)?(.+)/i))) { const a = memList(); a.push(m[3].trim()); memSave(a); return reply(text, "Anotado.", byText); }
  if (/(que recuerdas|mis notas|que sabes de mi)/.test(n)) { const a = memList(); return reply(text, a.length ? a.map((x, i) => (i + 1) + ". " + x).join("\n") : "Todavía no tengo nada anotado.", byText); }
  if (/(olvida todo|borra mis notas|borra la memoria)/.test(n)) { memSave([]); return reply(text, "Memoria borrada.", byText); }
  if (/(sal del|quita el|desactiva el) modo estudio/.test(n)) { setStudy(false); return reply(text, "Modo estudio desactivado.", byText); }
  if (/(activa|pon|entra en)( el)? modo estudio/.test(n)) { setStudy(true); return reply(text, "Modo estudio activado. Pregúntame lo que quieras aprender.", byText); }
  if ((m = n.replace(NUMRE, w => NUM[w]).match(/(temporizador|alarma|avisame|cuenta atras).*?(\d+(?:[.,]\d+)?)\s*(segundo|minuto|hora)/))) {
    const v = parseFloat(m[2].replace(",", ".")), ms = v * { segundo: 1e3, minuto: 6e4, hora: 36e5 }[m[3]], lbl = m[2] + " " + m[3] + (v === 1 ? "" : "s");
    setTimeout(() => { viaText = false; showSub("¡Tiempo!"); speak("Ya pasaron " + lbl + "."); }, ms);
    return reply(text, "Vale, te aviso en " + lbl + ". Deja esta pestaña abierta.", byText);
  }
     if (/\b(abre|abres|abreme|abrir|abras|ve a|ir a|entra en|llevame a|ponme)\b/.test(n)) {
    const k = Object.keys(SITES).find(s => n.includes(s));
    if (k) { openUrl(SITES[k], k); return reply(text, "Abriendo " + k + ".", byText); }
  }
  return false;
}
