/* ev · Herramientas: Gemini decide qué acción usar (function calling) */
const TOOLS = [
  { name: "abrir_pagina", description: "Abre una página web (youtube, gmail, classroom, drive, calendario, github, spotify, whatsapp, maps, wikipedia, traductor) o una dirección.", parameters: { type: "object", properties: { sitio: { type: "string", description: "Nombre del sitio o dirección web" } }, required: ["sitio"] } },
  { name: "buscar_google", description: "Busca algo en Google en una pestaña nueva.", parameters: { type: "object", properties: { consulta: { type: "string" } }, required: ["consulta"] } },
  { name: "temporizador", description: "Pone un temporizador que avisa por voz.", parameters: { type: "object", properties: { segundos: { type: "number" }, etiqueta: { type: "string" } }, required: ["segundos"] } },
  { name: "anotar", description: "Guarda una nota o algo que el usuario quiere que recuerdes.", parameters: { type: "object", properties: { texto: { type: "string" } }, required: ["texto"] } },
  { name: "calcular", description: "Calcula una expresión matemática con números y los símbolos + - * / ( ) **.", parameters: { type: "object", properties: { expresion: { type: "string" } }, required: ["expresion"] } },
  { name: "modo_estudio", description: "Activa o desactiva el modo estudio.", parameters: { type: "object", properties: { activar: { type: "boolean" } }, required: ["activar"] } },
  { name: "correos_sin_leer", description: "Lista los correos sin leer de Gmail del usuario." },
  { name: "tareas_pendientes", description: "Lista las próximas tareas de Google Classroom del usuario." },
  { name: "buscar_drive", description: "Busca archivos por nombre en el Drive del usuario.", parameters: { type: "object", properties: { texto: { type: "string" } }, required: ["texto"] } }
];
async function runTool(name, a) {
  try {
    if (name === "abrir_pagina") {
      const s = norm(String(a.sitio || "")), k = Object.keys(SITES).find(x => s.includes(x));
      const url = k ? SITES[k] : /\./.test(s) ? "https://" + s.replace(/^https?:\/\//, "") : "https://www.google.com/search?q=" + encodeURIComponent(a.sitio || "");
      openUrl(url, k || s); return "Abierta: " + url + ". Si no se abrió sola, hay un enlace arriba para pulsar.";
    }
    if (name === "buscar_google") { openUrl("https://www.google.com/search?q=" + encodeURIComponent(a.consulta || ""), "la búsqueda"); return "Búsqueda abierta."; }
    if (name === "temporizador") {
      const ms = Math.max(1, Number(a.segundos) || 1) * 1000, l = a.etiqueta || "El temporizador";
      setTimeout(() => { viaText = false; showSub("¡Tiempo!"); speak(l + ": ya terminó el tiempo."); }, ms); return "Temporizador puesto.";
    }
    if (name === "anotar") { const m = memList(); m.push(String(a.texto || "")); memSave(m); return "Anotado."; }
    if (name === "calcular") { const r = calc(String(a.expresion || "")); return r === null ? "Expresión no válida." : r; }
    if (name === "modo_estudio") { setStudy(!!a.activar); return "Modo estudio " + (a.activar ? "activado" : "desactivado") + "."; }
    if (typeof gtoken === "undefined" || !gtoken) return "Google no está conectado. Dile al usuario que pulse el botón G de abajo a la derecha.";
    if (name === "correos_sin_leer") return await gmailUnread();
    if (name === "tareas_pendientes") return await classroomTasks();
    if (name === "buscar_drive") return await driveSearch(String(a.texto || ""));
    return "Herramienta desconocida.";
  } catch (e) { return "Error: " + e.message; }
}
async function* geminiChunks(key, text, withShot) {
  const model = store.get("ed_mod") || "gemini-3.5-flash", parts = [{ text }];
  if (withShot) parts.push({ inline_data: { mime_type: "image/jpeg", data: await frame() } });
  const gen = { maxOutputTokens: 192 };
  if (model.includes("2.5")) gen.thinkingConfig = { thinkingBudget: 0 };
  // Contexto corto: reduce tokens enviados y acelera el primer fragmento.\n  const contents = [...history.slice(-6), { role: "user", parts }];
  for (let round = 0; round < 4; round++) {
    const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":streamGenerateContent?alt=sse", {
      method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({ system_instruction: { parts: [{ text: typeof sysFull === "function" ? sysFull() : SYS }] }, contents, tools: [{ functionDeclarations: TOOLS }], generationConfig: gen })
    });
    if (!r.ok) throw new Error("Gemini " + r.status);
    const rd = r.body.getReader(), dec = new TextDecoder(), got = [], calls = []; let buf = "";
    while (true) {
      const { done, value } = await rd.read(); if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n"); buf = lines.pop();
      for (const l of lines) {
        if (!l.startsWith("data:")) continue;
        let j; try { j = JSON.parse(l.slice(5)); } catch (e) { continue; }
        for (const p of (j.candidates?.[0]?.content?.parts || [])) {
          got.push(p); if (p.text) yield p.text; if (p.functionCall) calls.push(p.functionCall);
        }
      }
    }
    if (!calls.length) return;
    contents.push({ role: "model", parts: got });
    const res = [];
    for (const c of calls) res.push({ functionResponse: { name: c.name, response: { result: await runTool(c.name, c.args || {}) } } });
    contents.push({ role: "user", parts: res });
  }
}
