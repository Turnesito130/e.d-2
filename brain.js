/* ev · Motor de respuesta local. */
let llm = null, llmLoading = null;
async function loadLocal() {
  if (llm) return llm;
  if (llmLoading) return llmLoading;
  llmLoading = (async () => {
    if (!navigator.gpu) throw new Error("este navegador no soporta WebGPU; el motor local no puede iniciarse aquí");
    showSub("Preparando el modelo base local. La primera vez puede tardar.", true);
    const w = await import("https://esm.run/@mlc-ai/web-llm");
    const list = w.prebuiltAppConfig.model_list;
    let id;
    for (const re of [/Qwen2\\.5-1\\.5B-Instruct-q4f16_1/, /Llama-3\\.2-1B-Instruct-q4f16_1/, /Qwen2\\.5-0\\.5B-Instruct-q4f16_1/]) {
      const f = list.find(m => re.test(m.model_id));
      if (f) { id = f.model_id; break; }
    }
    if (!id) id = (list.find(m => m.low_resource_required) || list[0]).model_id;
    llm = await w.CreateMLCEngine(id, {
      initProgressCallback: r => showSub("Preparando motor local: " + Math.round((r.progress || 0) * 100) + " %", true)
    });
    return llm;
  })();
  try { return await llmLoading; } finally { llmLoading = null; }
}
async function* localChunks(text) {
  const msgs = [
    { role: "system", content: sysFull() },
    ...history.map(h => ({ role: h.role === "model" ? "assistant" : "user", content: h.parts[0].text })),
    { role: "user", content: text }
  ];
  const st = await llm.chat.completions.create({ messages: msgs, stream: true, max_tokens: 400, temperature: .7 });
  for await (const ch of st) {
    const c = ch.choices[0] && ch.choices[0].delta && ch.choices[0].delta.content;
    if (c) yield c;
  }
}

/* ---------- Preguntar ---------- */
async function ask(text, byText) {
  if (busy) return;
  viaText = !!byText;
  if (await commandHook(text, byText)) return;
  const needShot = !!stream && wantsScreen.test(text);
  if (needShot) {
    showSub("La comprensión de pantalla todavía no está implementada en el motor independiente de E.D.");
    return;
  }
  busy = true;
  stopVoice(); hideImages(); $("you").textContent = text; setState("think"); showSub("…", true);
  if (byText) { addMsg("u", text); bub = addMsg("e", "…"); } else bub = null;
  let full = "", pend = "", vis = "", sent = 0;
  try {
    await loadLocal();
    const src = localChunks(text);
    for await (const c of src) {
      full += c;
      vis = full.split("[[")[0].replace(/\\[$/, "");
      pend += vis.slice(sent); sent = vis.length;
      showSub(vis, true);
      if (bub) { bub.textContent = vis; $("clog").scrollTop = 1e9; }
      let m;
      while ((m = pend.match(/^(?:[\\s\\S]*?[.!?\\n]|[\\s\\S]{45,}?[,;:])(\\s|$)/))) {
        speak(m[0]); pend = pend.slice(m[0].length);
      }
    }
    if (pend.trim()) speak(pend);
    if (!full) {
      if (bub) bub.textContent = "No recibí respuesta.";
      showSub("No recibí respuesta."); setState("idle");
    }
    history.push({ role: "user", parts: [{ text }] }, { role: "model", parts: [{ text: vis }] });
    history = history.slice(-20); saveChatHistory();
    showSub(vis);
    const mk = full.match(/\\[\\[\\s*im[aá]genes?\\s*:\\s*([^\\]]+)\\]\\]/i);
    if (mk) showImages(mk[1]);
  } catch (e) {
    if (bub) bub.textContent = "Error: " + e.message;
    showSub("Error: " + e.message); setState("idle");
  }
  busy = false;
}
