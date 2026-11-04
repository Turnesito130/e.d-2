/**
 * E.D.-2 · Orquestador híbrido v0.2
 * Une generación neuronal, contexto de memoria y verificación determinista.
 * No ejecuta herramientas por defecto ni convierte una respuesta en "verificada"
 * salvo cuando un verificador compatible confirma exactamente esa comprobación.
 */
import { buildMemoryContext } from "./memory-context.mjs";
import { coordinateReasoning } from "./reasoning-coordinator.js";

function requireText(value, label, max = 4000) {
  if (typeof value !== "string" || !value.trim() || value.length > max) {
    throw new TypeError(label + " debe ser texto no vacío dentro del límite permitido.");
  }
  return value.trim();
}

export function createHybridReasoner({
  generate,
  memory = null,
  runtime = null,
  verify = coordinateReasoning
} = {}) {
  if (typeof generate !== "function") {
    throw new TypeError("Se necesita una función generate para el modelo neuronal.");
  }
  if (typeof verify !== "function") throw new TypeError("verify debe ser una función.");

  return Object.freeze({
    async run(input, options = {}) {
      const question = requireText(input, "La petición", 4000);
      const memoryContext = buildMemoryContext(question, memory, {
        limit: options.memoryLimit ?? 5,
        maxChars: options.maxMemoryChars ?? 1200,
        minRelevance: options.minRelevance ?? 0.15
      });

      const proposal = await generate({
        input: question,
        memoryContext,
        history: Array.isArray(options.history) ? options.history.slice(-8) : []
      });

      const answer = typeof proposal === "string"
        ? proposal
        : proposal && typeof proposal.answer === "string" ? proposal.answer : "";
      requireText(answer, "La respuesta del modelo", 12000);

      const checked = verify({
        proposedAnswer: answer,
        check: proposal && typeof proposal === "object" ? proposal.check : undefined
      });

      let plan = null;
      let execution = null;
      if (options.planTools === true) {
        if (!runtime || typeof runtime.plan !== "function") {
          throw new Error("No hay un runtime de herramientas disponible.");
        }
        plan = runtime.plan(question);
        if (options.executeTools === true) {
          if (typeof runtime.execute !== "function") throw new Error("El runtime no permite ejecutar herramientas.");
          execution = await runtime.execute(plan, {
            approve: typeof options.approve === "function" ? options.approve : async () => false
          });
        }
      }

      return Object.freeze({
        answer: checked.answer,
        status: checked.status,
        verification: checked.verification,
        verificationExplanation: checked.explanation,
        memoryUsed: Boolean(memoryContext),
        memoryContext,
        plan,
        execution
      });
    }
  });
}
