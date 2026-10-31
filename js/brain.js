/* ev · Cerebros (Gemini y local con WebLLM) y la función de preguntar */
/* ---------- Cerebros: local (WebLLM) y Gemini ---------- */
let llm = null, llmLoading = null;
async function loadLocal() {
  if (llm) return llm;
  if (llmLoading) return llmLoading;
  llmLoading = (async () => {
    if (!navigator.gpu) throw new Error("este navegador no soporta WebGPU");
    showSub("Descargando el cerebro local. La primera vez tarda unos minutos.", true);
    const w = await import("https://esm.run/@mlc-ai/web-llm");
    const list = w.prebuiltAppConfig.model_list, want = store.get("ed_lmod");
    let id = (list.find(m => m.model_id === want) || {}).model_id;
    if (!id) for (const re of [/Qwen2\.5-1\.5B-Instruct-q4f16_1/, /Llama-3\.2-1B-Instruct-q4f16_1/, /Qwen2\.5-0\.5B-Instruct-q4f16_1/]) {
      const f = list.find(m => re.test(m.model_id)); if (f) { id = f.model_id; break; }
    }
    if (!id) id = (list.find(m => m.low_resource_required) || list[0]).model_id;
    llm = await w.CreateMLCEngine(id, { initProgressCallback: r => showSub("Cerebro local: " + Math.round((r.progress || 0) * 100) + " %", true) });
    return llm;
  })();
  try { return await llmLoading; } finally { llmLoading = null; }
}
async function* localChunks(text) {
  const msgs = [{ role: "system", content: sysFull() },
    ...history.slice(-10).map(h => ({ role: h.role === "model" ? "assistant" : "user", content: h.parts[0].text })),
    { role: "user", content: text }];
  const st = await llm.chat.completions.create({ messages: msgs, stream: true, max_tokens: 320, temperature: .7 });
  for await (const ch of st) { const c = ch.choices[0] && ch.choices[0].delta && ch.choices[0].delta.content; if (c) yield c; }
}
async function* geminiChunks(key, text, withShot) {
  const model = store.get("ed_mod") || "gemini-3.5-flash-lite", parts = [{ text }];
  if (withShot) parts.push({ inline_data: { mime_type: "image/jpeg", data: await frame() } });
  const gen = { maxOutputTokens: 192 };
  if (model.includes("2.5")) gen.thinkingConfig = { thinkingBudget: 0 };
  const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":streamGenerateContent?alt=sse", {
    method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({ system_instruction: { parts: [{ text: sysFull() }] }, contents: [...history.slice(-6), { role: "user", parts }], generationConfig: gen })
  });
  if (!r.ok) throw new Error("Gemini " + r.status);
  const rd = r.body.getReader(), dec = new TextDecoder(); let buf = "";
  while (true) {
    const { done, value } = await rd.read(); if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n"); buf = lines.pop();
    for (const l of lines) {
      if (!l.startsWith("data:")) continue;
      let j; try { j = JSON.parse(l.slice(5)); } catch (e) { continue; }
      const c = (j.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("");
      if (c) yield c;
    }
  }
}

/* ---------- Preguntar ---------- */
async function ask(text, byText) {
  if (busy) return; viaText = !!byText;
  if (await commandHook(text, byText)) return;
  const key = store.get("ed_k1"), mode = store.get("ed_brain") || "gemini";
  const needShot = !!stream && wantsScreen.test(text), useLocal = mode === "local" && !needShot;
  if (!useLocal && !key) { openSet(); showSub(mode === "local" ? "Para ver tu pantalla necesito la clave de Gemini." : "Necesito tu clave de Gemini."); return; }
  busy = true; stopVoice(); hideImages(); $("you").textContent = text; setState("think"); showSub("Preparando respuesta…", true);
  if (byText) { addMsg("u", text); bub = addMsg("e", "Estoy pensando…"); $("chat").classList.add("open"); } else bub = null;
  if (!stream && /pantalla/i.test(text)) {
    busy = false; setState("idle"); speak("Toca la esfera y elige tu pantalla para que pueda verla.");
    if (bub) bub.textContent = "Toca la esfera y elige tu pantalla para que pueda verla."; showSub("Toca la esfera para compartir tu pantalla."); return;
  }
  let full = "", pend = "", vis = "", sent = 0;
  try {
    let src;
    if (useLocal) {
      try { await loadLocal(); src = localChunks(text); }
      catch (e) { if (!key) throw e; showSub("El cerebro local falló (" + e.message + "). Uso Gemini.", true); src = geminiChunks(key, text, false); }
    } else src = geminiChunks(key, text, needShot);
    for await (const c of src) {
      full += c; vis = full.split("[[")[0].replace(/\[$/, ""); pend += vis.slice(sent); sent = vis.length; showSub(vis, true);
      if (bub) { bub.textContent = vis; $("clog").scrollTop = $("clog").scrollHeight; }
      let m; while ((m = pend.match(/^(?:[\s\S]*?[.!?\n]|[\s\S]{45,}?[,;:])(\s|$)/))) { speak(m[0]); pend = pend.slice(m[0].length); }
    }
    if (pend.trim()) speak(pend);
    if (!full) { if (bub) bub.textContent = "No recibí respuesta."; showSub("No recibí respuesta."); setState("idle"); }
    history.push({ role: "user", parts: [{ text }] }, { role: "model", parts: [{ text: vis }] });
    history = history.slice(-12); showSub(vis);
    const mk = full.match(/\[\[\s*im[aá]genes?\s*:\s*([^\]]+)\]\]/i); if (mk) showImages(mk[1]);
  } catch (e) { if (bub) bub.textContent = "Error: " + e.message; showSub("Error: " + e.message); setState("idle"); }
  busy = false;
}