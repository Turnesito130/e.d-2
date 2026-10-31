// API pública de E.D.-2 Neural Core 0.1
export { CharTokenizer } from "./tokenizer.js";
export { SubwordTokenizer } from "./subword-tokenizer.js";
export { TinyLanguageModel } from "./model.js";
export { train, makeTrainingPairs } from "./trainer.js";
export { AdamOptimizer } from "./optimizer.js";
export { evaluate } from "./evaluation.js";
export { scaledDotProductAttention, TinyAttentionBlock } from "./attention.js";
export { BrainMemory } from "./memory.js";

import { CharTokenizer } from "./tokenizer.js";
import { SubwordTokenizer } from "./subword-tokenizer.js";
import { TinyLanguageModel } from "./model.js";
import { train } from "./trainer.js";
import { BrainMemory } from "./memory.js";
import { AdamOptimizer } from "./optimizer.js";


export function createBrain({ text, contextSize = 8, hiddenSize = 48, tokenizerType = "char", vocabSize = 512 } = {}) {
  if (typeof text !== "string" || text.length < contextSize + 2) {
    throw new Error("Proporciona un texto de entrenamiento más largo");
  }
  const tokenizer = tokenizerType === "bpe"
    ? new SubwordTokenizer().fit(text, { vocabSize })
    : tokenizerType === "char" ? new CharTokenizer().fit(text)
    : (() => { throw new TypeError("tokenizerType debe ser char o bpe"); })();
  if (tokenizer.size < 2) throw new Error("El texto debe contener al menos dos tokens distintos");
  if (tokenizer.encode(text).length <= contextSize) throw new Error("El corpus produce muy pocos tokens para el tamaño de contexto elegido");
  const model = new TinyLanguageModel({ vocabSize: tokenizer.size, contextSize, hiddenSize });
  return { tokenizer, model, memory: new BrainMemory(), optimizer: new AdamOptimizer() };
}

export async function trainBrain(brain, text, options = {}) {
  const ids = brain.tokenizer.encode(text);
  return train(brain.model, ids, { ...options, optimizer: options.optimizer ?? brain.optimizer ?? "adam" });
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
  const tokenizer = data.tokenizer?.type === "bpe"
    ? SubwordTokenizer.fromJSON(data.tokenizer)
    : CharTokenizer.fromJSON(data.tokenizer);
  const model = new TinyLanguageModel({
    vocabSize: tokenizer.size,
    contextSize: data.model.contextSize,
    hiddenSize: data.model.hiddenSize,
    seedWeights: data.model
  });
  return { tokenizer, model, memory: new BrainMemory(), optimizer: new AdamOptimizer() };
}
