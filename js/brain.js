/* E.D.-2 · Motor local propio. No usa APIs ni modelos externos. */
let ownBrain = null, ownBrainApi = null, ownBrainReady = false, ownBrainError = "";
async function loadOwnBrain() {
  if (ownBrainReady) return ownBrain;
  const raw = store.get("ed_brain_bundle");
  if (!raw) { ownBrainReady = true; return null; }
  try {
    ownBrainApi = await import("./neural-core/index.js");
    ownBrain = ownBrainApi.importBrain(raw);
    ownBrainReady = true;
    return ownBrain;
  } catch (e) {
    ownBrainError = e.message || String(e);
    throw new Error("No pude cargar el cerebro propio: " + ownBrainError);
  }
}
let edAgentRuntimeModule = null;
let edMemoryStorePromise = null;
let edMemoryContextModule = null;
async function getStructuredMemory() {
  edMemoryStorePromise ||= import("./neural-core/memory-store.mjs")
    .then(({ createMemoryStore }) => createMemoryStore());
  return edMemoryStorePromise;
}
async function getMemoryAwarePrompt(text) {
  try {
    const memory = await getStructuredMemory();
    edMemoryContextModule ||= await import("./neural-core/memory-context.mjs");
    return edMemoryContextModule.augmentPromptWithMemory(text, memory);
  } catch (error) {
    console.warn("E.D. memory context unavailable:", error);
    return text;
  }
}
async function runAgentPlan(text, byText) {
  try {
    edAgentRuntimeModule ||= await import("./neural-core/agent-runtime.mjs");
    const runtime = edAgentRuntimeModule.createAgentRuntime({ tools: {
      calculate: async ({ expression }) => {
        const result = await calc(expression);
        return result === null ? "No pude interpretar el cálculo con seguridad." : result;
      },
      note: async ({ text: note }) => {
        const memory = await getStructuredMemory();
        memory.remember({ content: note, type: "note", source: "user_explicit", confidence: 0.95, consent: true });
        return "He guardado esa nota en la memoria estructurada.";
      },
      memory_search: async ({ query }) => {
        const memory = await getStructuredMemory();
        const found = memory.search(query, { limit: 5, includeUncertain: true });
        return found.length
          ? found.map(item => item.content + " (tipo: " + item.type + ", confianza: " + Math.round(item.confidence * 100) + "%)").join("\n")
          : "No he encontrado recuerdos relacionados.";
      },
      search: async ({ query }) => {
        openUrl("https://www.google.com/search?q=" + encodeURIComponent(query), "la búsqueda");
        return "He preparado la búsqueda en Google.";
      },
      open_url: async ({ url }) => {
        if (!/^https?:\/\//i.test(url)) throw new Error("Dirección no permitida.");
        openUrl(url, "la página solicitada");
        return "He preparado la apertura de la página.";
      },
      timer: async ({ seconds }) => {
        const value = Math.max(1, Math.min(86400, Number(seconds) || 0));
        setTimeout(() => { viaText = false; showSub("¡Tiempo!"); speak("El temporizador ha terminado."); }, value * 1000);
        return "Temporizador iniciado durante " + value + " segundos.";
      }
    } });
    const plan = runtime.plan(text);
    if (!plan.steps.length) return false;
    const outcome = await runtime.execute(plan);
    const answer = outcome.results.map(item =>
      item.status === "completed" ? String(item.value) : item.message || "La acción no se ha ejecutado."
    ).join(" ");
    reply(text, answer || "No había ninguna acción compatible.", byText);
    return true;
  } catch (error) {
    console.error("E.D. Agent Runtime:", error);
    return false;
  }
}
async function ask(text, byText) {
  if (busy) return;
  viaText = !!byText;
  if (await commandHook(text, byText)) return;
  if (await runAgentPlan(text, byText)) return;
  busy = true; stopVoice(); hideImages(); $("you").textContent = text; setState("think");
  if (byText) { addMsg("u", text); bub = addMsg("e", "Procesando localmente…"); $("chat").classList.add("open"); } else bub = null;
  try {
    const brain = await loadOwnBrain();
    let answer;
    if (!brain) {
      const memoryPrompt = await getMemoryAwarePrompt(text);
      const memoryOnly = memoryPrompt !== text;
      answer = memoryOnly
        ? "He encontrado recuerdos relacionados, pero todavía no tengo un modelo conversacional entrenado para razonar con ellos.\n\n" + memoryPrompt.slice(text.length).trim()
        : "Todavía no tengo un cerebro entrenado con el que pueda responder libremente. No voy a fingir que sé hacerlo. Puedo ejecutar mis funciones locales, guardar notas y seguir entrenando mi cerebro propio.";
    } else {
      const prompt = await getMemoryAwarePrompt(text);
      answer = ownBrainApi.generateText(brain, prompt, { maxTokens: 120, temperature: 0.7 });
      if (!answer || !answer.trim()) answer = "No he aprendido todavía a responder a eso. Necesito más entrenamiento.";
    }
    if (bub) bub.textContent = answer;
    showSub(answer);
    if (answer) speak(answer);
    history.push({ role: "user", parts: [{ text }] }, { role: "model", parts: [{ text: answer }] });
    history = history.slice(-12);
  } catch (e) {
    const answer = "No pude usar mi cerebro local: " + e.message;
    if (bub) bub.textContent = answer;
    showSub(answer);
  } finally { busy = false; setState("idle"); }
}
function apiGenerate(text, brain) {
  const ids = brain.tokenizer.encode(text);
  const out = brain.model.generate(ids, 120, 0.7);
  return brain.tokenizer.decode(out);
}
async function trainOwnBrain(text, options = {}) {
  if (typeof text !== "string" || text.trim().length < 20) throw new Error("Necesito al menos 20 caracteres de texto para entrenar.");
  ownBrainApi = await import("./neural-core/index.js");
  const api = ownBrainApi;
  if (!ownBrain) ownBrain = api.createBrain({ text, contextSize: 8, hiddenSize: 48, tokenizerType: "char" });
  const result = await api.trainBrain(ownBrain, text, options);
  store.set("ed_brain_bundle", api.exportBrain(ownBrain));
  ownBrainReady = true;
  return result;
}
