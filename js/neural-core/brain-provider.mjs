// E.D.-2 · Interfaz común del cerebro local. No incorpora proveedores remotos.
export function createLocalBrainProvider({ loadModule = () => import("./local-llm.mjs") } = {}) {
  if (typeof loadModule !== "function") throw new TypeError("loadModule debe ser una función");

  let modulePromise = null;
  let engine = null;
  let loadingPromise = null;

  async function getEngineModule() {
    modulePromise ||= Promise.resolve().then(loadModule);
    const module = await modulePromise;
    if (!module || typeof module.checkLocalModelSupport !== "function" ||
        typeof module.loadLocalModel !== "function" ||
        typeof module.generateLocalResponse !== "function") {
      throw new TypeError("El motor local no implementa la interfaz requerida");
    }
    return module;
  }

  return Object.freeze({
    id: "local-webllm",
    get ready() { return Boolean(engine); },

    async checkSupport() {
      const module = await getEngineModule();
      return module.checkLocalModelSupport();
    },

    async load(onProgress = () => {}) {
      if (engine) return true;
      if (loadingPromise) return loadingPromise;
      loadingPromise = (async () => {
        const module = await getEngineModule();
        const support = await module.checkLocalModelSupport();
        if (!support?.supported) throw new Error(support?.reason || "Este dispositivo no es compatible con el motor local");
        await module.loadLocalModel(onProgress);
        engine = module;
        return true;
      })();
      try {
        return await loadingPromise;
      } finally {
        loadingPromise = null;
      }
    },

    async generate(messages, options = {}) {
      if (!engine) throw new Error("El cerebro local todavía no está preparado");
      if (!Array.isArray(messages) || messages.length === 0) {
        throw new TypeError("Se necesita una conversación válida");
      }
      return engine.generateLocalResponse(messages, options);
    }
  });
}
