// API pública de E.D.-2 Neural Core 0.1
export { CharTokenizer } from "./tokenizer.js";
export { TinyLanguageModel } from "./model.js";
export { train, makeTrainingPairs } from "./trainer.js";

import { CharTokenizer } from "./tokenizer.js";
import { TinyLanguageModel } from "./model.js";
import { train } from "./trainer.js";

export function createBrain({ text, contextSize = 8, hiddenSize = 48 } = {}) {
  if (typeof text !== "string" || text.length < contextSize + 2) {
    throw new Error("Proporciona un texto de entrenamiento más largo");
  }
  const tokenizer = new CharTokenizer().fit(text);
  if (tokenizer.size < 2) throw new Error("El texto debe contener al menos dos caracteres distintos");
  const model = new TinyLanguageModel({ vocabSize: tokenizer.size, contextSize, hiddenSize });
  return { tokenizer, model };
}

export async function trainBrain(brain, text, options = {}) {
  const ids = brain.tokenizer.encode(text);
  return train(brain.model, ids, options);
}

export function generateText(brain, prefix, options = {}) {
  const { maxTokens = 120, temperature = 0.8 } = options;
  const ids = brain.tokenizer.encode(prefix);
  const output = brain.model.generate(ids, maxTokens, temperature);
  return brain.tokenizer.decode(output);
}

export function exportBrain(brain) {
  return JSON.stringify({
    format: "ed2-brain-bundle", version: 1,
    tokenizer: brain.tokenizer.toJSON(),
    model: brain.model.toJSON()
  });
}

export function importBrain(json) {
  const data = typeof json === "string" ? JSON.parse(json) : json;
  if (!data || data.format !== "ed2-brain-bundle" || data.version !== 1) {
    throw new TypeError("Archivo de cerebro E.D.-2 no válido");
  }
  const tokenizer = CharTokenizer.fromJSON(data.tokenizer);
  const model = new TinyLanguageModel({
    vocabSize: tokenizer.size,
    contextSize: data.model.contextSize,
    hiddenSize: data.model.hiddenSize,
    seedWeights: data.model
  });
  return { tokenizer, model };
}
