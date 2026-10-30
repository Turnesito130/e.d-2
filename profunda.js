/* ev · Investigación profunda con búsqueda en Google */
let deepOn = false;
const pcss = document.createElement("style");
pcss.textContent = "#rep{position:fixed;top:64px;left:4%;right:4%;bottom:92px;overflow:auto;border:1px solid;border-radius:14px;padding:18px 22px;z-index:5;color:#e8fbff;line-height:1.55}#rhd{display:flex;gap:8px;align-items:center;margin-bottom:10px}#rhd b{flex:1;font-weight:400;font-size:1.15rem}#rhd button{background:transparent;color:var(--amber);border:1px solid var(--amber);border-radius:8px;padding:6px 12px;font:inherit;cursor:pointer}#rep h3{color:var(--amber);font-weight:400;margin:16px 0 4px}#rep li{margin-left:20px}#rep a{display:block;color:var(--amber);font-size:.9rem;margin:3px 0;word-break:break-all}";
document.head.appendChild(pcss);
async function gem(body) {
  const key = store.get("ed_k1"), model = store.get("ed_mod") || "gemini-3.5-flash";
  for (let i = 0; i < 2; i++) {
    const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent", { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key }, body: JSON.stringify(body) });
    if (r.status === 429 && i === 0) { await new Promise(s => setTimeout(s, 8000)); continue; }
    if (!r.ok) throw new Error("Gemini " + r.status);
    return r.json();
  }
}
const gtext = j => ((j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || []).map(p => p.text || "").join("");
const md = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").split("\n").map(l => /^#{1,3} /.test(l) ? "<h3>" + l.replace(/^#+ /, "") + "</h3>" : /^[-*] /.test(l) ? "<li>" + l.slice(2) + "</li>" : l.trim() ? "<p>" + l + "</p>" : "").join("").replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
function showReport(topic, body, sources) {
  let r = $("rep"); if (!r) { r = document.createElement("div"); r.id = "rep"; document.body.appendChild(r); }
  r.innerHTML = ""; const hd = document.createElement("div"); hd.id = "rhd"; const ti = document.createElement("b"); ti.textContent = "Investigación profunda: " + topic;
  const cp = document.createElement("button"); cp.textContent = "Copiar"; cp.onclick = () => navigator.clipboard.writeText(topic + "\n\n" + body).catch(() => {});
  const x = document.createElement("button"); x.textContent = "✕"; x.title = "Cerrar"; x.onclick = () => r.remove(); hd.append(ti, cp, x);
  const bd = document.createElement("div"); bd.innerHTML = md(body);
  const fs = document.createElement("div"); fs.innerHTML = "<h3>Fuentes</h3>";
  sources.forEach(([u, t]) => { const a = document.createElement("a"); a.href = u; a.target = "_blank"; a.rel = "noopener"; a.textContent = t; fs.appendChild(a); });
  r.append(hd, bd, fs);
}
async function deepResearch(topic, byText) {
  if (busy) return;
  if (!store.get("ed_k1")) { openSet(); showSub("Necesito tu clave de Gemini."); return; }
  busy = true; stopVoice(); hideImages(); viaText = !!byText; $("you").textContent = topic; setState("think");
  let prog = "Planeando la investigación"; const t0 = Date.now();
  const tick = setInterval(() => showSub(prog + " · " + Math.round((Date.now() - t0) / 1000) + " s", true), 1000);
  try {
    let qs = [topic];
    try {
      const pj = JSON.parse(gtext(await gem({ contents: [{ role: "user", parts: [{ text: "Tema de investigación: " + topic + '\nDevuelve SOLO un JSON {"preguntas":[...]} con 4 a 6 subpreguntas concretas, en español, que cubran el tema a fondo (conceptos, datos actuales, ejemplos prácticos, riesgos y limitaciones).' }] }], generationConfig: { responseMimeType: "application/json" } })));
      if (Array.isArray(pj.preguntas) && pj.preguntas.length) qs = pj.preguntas.slice(0, 6);
    } catch (e) {}
    const found = [], src = new Map();
    for (let i = 0; i < qs.length; i++) {
      prog = "Investigando " + (i + 1) + "/" + qs.length + ": " + qs[i];
      const j = await gem({ contents: [{ role: "user", parts: [{ text: "Busca en la web y responde en español con datos concretos (cifras, nombres, fechas) y sin relleno: " + qs[i] }] }], tools: [{ google_search: {} }] });
      found.push("### " + qs[i] + "\n" + gtext(j));
      const gc = (j.candidates && j.candidates[0] && j.candidates[0].groundingMetadata && j.candidates[0].groundingMetadata.groundingChunks) || [];
      gc.forEach(c => { if (c.web && c.web.uri) src.set(c.web.uri, c.web.title || c.web.uri); });
    }
    prog = "Redactando el informe";
    const out = gtext(await gem({ contents: [{ role: "user", parts: [{ text: "Tema: " + topic + "\n\nHallazgos:\n" + found.join("\n\n") + "\n\nRedacta un informe en español, claro y bien organizado (títulos con ## y viñetas con -), con conclusiones prácticas. Empieza con una línea «RESUMEN: » de máximo dos frases para leer en voz alta. No inventes datos que no estén en los hallazgos; si algo es incierto, dilo." }] }], generationConfig: { maxOutputTokens: 4000 } }));
    const m = out.match(/RESUMEN:\s*(.+)/), resumen = m ? m[1].trim() : out.slice(0, 200);
    showReport(topic, out.replace(/RESUMEN:.*\n?/, "").trim(), [...src]);
    history.push({ role: "user", parts: [{ text: topic }] }, { role: "model", parts: [{ text: resumen }] }); history = history.slice(-20);
    clearInterval(tick); showSub(resumen); speak(resumen);
  } catch (e) { clearInterval(tick); showSub("No pude investigar: " + e.message); setState("idle"); }
  clearInterval(tick); busy = false;
}
const hookDeep = commandHook;
commandHook = async (text, byText) => {
  const m = text.match(/^\s*(?:haz(?:me)? (?:una )?)?(?:investigaci[oó]n profunda|investiga(?: a fondo| en profundidad)?)\s*(?:sobre|de|del|acerca de)?\s*(.+)?$/i);
  if (m) { if (m[1]) deepResearch(m[1].trim(), byText); else reply(text, "¿Sobre qué quieres que investigue?", byText); return true; }
  const r = await hookDeep(text, byText); if (r) return r;
  if (deepOn && text.length > 8) { deepResearch(text, byText); return true; }
  return false;
};
