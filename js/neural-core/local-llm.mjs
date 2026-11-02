/**
 * E.D.-2 · Inferencia local con WebLLM.
 * Los pesos se descargan desde MLC/Hugging Face una vez y se ejecutan en WebGPU.
 * No se envían mensajes a una API de IA.
 */
const MODEL_ID = "Qwen2.5-1.5B-Instruct-q4f16_1-MLC";
let enginePromise = null;
let engine = null;
export function getLocalModelInfo() { return { model: MODEL_ID, engineLoaded: !!engine, requiresWebGPU: true }; }
export async function checkLocalModelSupport() {
  if (!globalThis.navigator?.gpu) return { supported: false, reason: "Este navegador o dispositivo no ofrece WebGPU." };
  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) return { supported: false, reason: "No se ha encontrado un adaptador gráfico compatible con WebGPU." };
    return { supported: true, reason: "WebGPU disponible." };
  } catch (error) { return { supported: false, reason: error?.message || "No se pudo inicializar WebGPU." }; }
}
export async function loadLocalModel(onProgress = () => {}) {
  if (engine) return engine;
  if (enginePromise) return enginePromise;
  enginePromise = (async () => {
    const capability = await checkLocalModelSupport();
    if (!capability.supported) throw new Error(capability.reason);
    onProgress({ text: "Preparando motor WebGPU…", progress: 0 });
    const { CreateMLCEngine } = await import("https://esm.run/@mlc-ai/web-llm");
    engine = await CreateMLCEngine(MODEL_ID, { initProgressCallback: report => onProgress({
      text: report?.text || "Descargando y preparando el modelo…",
      progress: Number(report?.progress || 0)
    }) });
    onProgress({ text: "Modelo local listo.", progress: 1 });
    return engine;
  })().catch(error => { enginePromise = null; throw error; });
  return enginePromise;
}
export async function generateLocalResponse(messages, options = {}) {
  if (!engine) throw new Error("El modelo local todavía no está cargado.");
  const response = await engine.chat.completions.create({
    messages,
    temperature: options.temperature ?? 0.65,
    max_tokens: options.maxTokens ?? 384
  });
  return response?.choices?.[0]?.message?.content?.trim() || "";
}
