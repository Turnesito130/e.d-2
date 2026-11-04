/**
 * E.D.-2 · Curated training corpus utilities v0.3
 * Prepara y valida ejemplos; NO modifica pesos neuronales ni entrena un modelo.
 */
const DOMAINS = new Set(["science", "mathematics", "history", "technology", "programming", "language", "general"]);
const SPLITS = new Set(["train", "eval"]);
const STATUSES = new Set(["approved", "review", "rejected"]);

function cleanText(value, field, max) {
  if (typeof value !== "string" || !value.trim() || value.length > max) {
    throw new TypeError(field + " debe ser texto no vacío de hasta " + max + " caracteres.");
  }
  return value.trim();
}

export function parseTrainingJsonl(input) {
  if (typeof input !== "string") throw new TypeError("El corpus debe ser texto JSONL.");
  return input.split(/\r?\n/).map(line => line.trim()).filter(Boolean).map((line, index) => {
    try { return JSON.parse(line); }
    catch { throw new SyntaxError("JSONL no válido en la línea " + (index + 1) + "."); }
  });
}

export function validateTrainingExample(example) {
  if (!example || typeof example !== "object" || Array.isArray(example)) {
    throw new TypeError("Cada ejemplo debe ser un objeto.");
  }
  const id = cleanText(example.id, "id", 100);
  const domain = cleanText(example.domain, "domain", 40);
  const question = cleanText(example.question, "question", 2000);
  const answer = cleanText(example.answer, "answer", 6000);
  const split = example.split;
  const status = example.status;
  if (!DOMAINS.has(domain)) throw new TypeError("Dominio no permitido: " + domain);
  if (!SPLITS.has(split)) throw new TypeError("split debe ser train o eval.");
  if (!STATUSES.has(status)) throw new TypeError("Estado del ejemplo no válido.");
  if (split === "eval" && status === "approved" && example.leakageRisk === true) {
    throw new TypeError("Un ejemplo de evaluación marcado con riesgo de fuga no puede aprobarse.");
  }
  return Object.freeze({
    id, domain, question, answer, split, status,
    source: cleanText(example.source || "authored-by-ed2-team", "source", 240),
    reviewedAt: typeof example.reviewedAt === "string" ? example.reviewedAt : null
  });
}

export function inspectTrainingCorpus(examples) {
  if (!Array.isArray(examples)) throw new TypeError("El corpus debe ser una lista.");
  const accepted = [];
  const rejected = [];
  const seen = new Set();
  for (let index = 0; index < examples.length; index += 1) {
    try {
      const item = validateTrainingExample(examples[index]);
      if (seen.has(item.id)) throw new TypeError("ID duplicado: " + item.id);
      seen.add(item.id);
      accepted.push(item);
    } catch (error) {
      rejected.push({ index, reason: error.message });
    }
  }
  return Object.freeze({ accepted, rejected, total: examples.length });
}

export function selectTrainingExamples(examples, { split = "train", approvedOnly = true } = {}) {
  if (!SPLITS.has(split)) throw new TypeError("split debe ser train o eval.");
  const inspected = inspectTrainingCorpus(examples);
  return inspected.accepted.filter(item => item.split === split && (!approvedOnly || item.status === "approved"));
}

export function exportTrainingJsonl(examples) {
  const selected = selectTrainingExamples(examples, { split: "train", approvedOnly: true });
  return selected.map(item => JSON.stringify({
    messages: [
      { role: "user", content: item.question },
      { role: "assistant", content: item.answer }
    ]
  })).join("\n");
}

export function createLoraPreparationManifest({ baseModel, corpusVersion, maxSequenceLength = 2048 } = {}) {
  return Object.freeze({
    format: "ed2-lora-preparation",
    version: 1,
    baseModel: cleanText(baseModel, "baseModel", 200),
    method: "LoRA",
    corpusVersion: cleanText(corpusVersion, "corpusVersion", 80),
    maxSequenceLength: Math.max(256, Math.min(8192, Number(maxSequenceLength) || 2048)),
    trainingSplit: "train",
    evaluationSplit: "eval",
    requiresHumanReview: true,
    changesModelWeights: false,
    note: "Manifiesto de preparación solamente; no inicia entrenamiento ni modifica pesos."
  });
}

export async function evaluateHeldOutExamples({ examples, generate, judge } = {}) {
  if (typeof generate !== "function" || typeof judge !== "function") {
    throw new TypeError("La evaluación requiere funciones independientes generate y judge.");
  }
  const heldOut = selectTrainingExamples(examples, { split: "eval", approvedOnly: true });
  if (!heldOut.length) throw new Error("No hay ejemplos de evaluación aprobados.");
  const results = [];
  for (const item of heldOut) {
    const response = await generate(item.question);
    const assessment = await judge({ question: item.question, expected: item.answer, actual: String(response ?? "") });
    const score = Number(assessment?.score);
    if (!Number.isFinite(score) || score < 0 || score > 1) {
      throw new TypeError("El evaluador debe devolver una puntuación entre 0 y 1.");
    }
    results.push({ id: item.id, score, passed: assessment.passed === true, notes: String(assessment.notes || "").slice(0, 500) });
  }
  const averageScore = results.reduce((sum, item) => sum + item.score, 0) / results.length;
  return Object.freeze({
    evaluated: results.length,
    passed: results.filter(item => item.passed).length,
    averageScore: Number(averageScore.toFixed(3)),
    results
  });
}
