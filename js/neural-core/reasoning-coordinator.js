// E.D.-2 · Coordinador híbrido neuronal-lógico.
// Solo marca como verificado aquello que el motor determinista haya comprobado.
// No extrae expresiones de prosa ni certifica afirmaciones factuales.
import { evaluateExpression, verifyNumericResult } from "./logic-engine.js";

export function coordinateReasoning({ proposedAnswer, check } = {}) {
  if (typeof proposedAnswer !== "string" || !proposedAnswer.trim()) {
    throw new TypeError("Se necesita una respuesta propuesta no vacía");
  }
  if (!check) {
    return {
      status: "unverified",
      answer: proposedAnswer.trim(),
      verification: null,
      explanation: "No se ha proporcionado una comprobación compatible."
    };
  }
  if (check.type === "expression") {
    const result = evaluateExpression(check.expression);
    return {
      status: "verified",
      answer: proposedAnswer.trim(),
      verification: result,
      explanation: "La expresión se ha calculado con el motor lógico determinista."
    };
  }
  if (check.type === "numeric-answer") {
    const result = verifyNumericResult(check.expression, check.proposed, check.options);
    return {
      status: result.ok ? "verified" : "mismatch",
      answer: proposedAnswer.trim(),
      verification: result,
      explanation: result.ok
        ? "El valor propuesto coincide con el cálculo dentro de la tolerancia indicada."
        : "El valor propuesto no coincide con el cálculo determinista."
    };
  }
  return {
    status: "unverified",
    answer: proposedAnswer.trim(),
    verification: null,
    explanation: "Tipo de comprobación no admitido; no se marca como verificado."
  };
}
