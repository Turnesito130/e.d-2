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
async function ask(text, byText) {
  if (busy) return;
  viaText = !!byText;
  if (await commandHook(text, byText)) return;
  busy = true; stopVoice(); hideImages(); $("you").textContent = text; setState("think");
  if (byText) { addMsg("u", text); bub = addMsg("e", "Procesando localmente…"); $("chat").classList.add("open"); } else bub = null;
  try {
    const brain = await loadOwnBrain();
    let answer;
    if (!brain) {
      answer = "Todavía no tengo un cerebro entrenado con el que pueda responder libremente. No voy a fingir que sé hacerlo. Puedo ejecutar mis funciones locales, guardar notas y seguir entrenando mi cerebro propio.";
    } else {
      answer = ownBrainApi.generateText(brain, text, { maxTokens: 120, temperature: 0.7 });
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
  const api = await import("./neural-core/index.js");
  if (!ownBrain) ownBrain = api.createBrain({ text, contextSize: 8, hiddenSize: 48, tokenizerType: "char" });
  const result = await api.trainBrain(ownBrain, text, options);
  store.set("ed_brain_bundle", api.exportBrain(ownBrain));
  ownBrainReady = true;
  return result;
}
