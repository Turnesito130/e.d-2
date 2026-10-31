import assert from "node:assert/strict";
import { coordinateReasoning } from "./reasoning-coordinator.js";

const verified = coordinateReasoning({ proposedAnswer: "14", check: { type: "expression", expression: "2 + 3 * 4" } });
assert.equal(verified.status, "verified");
assert.equal(verified.verification.value, 14);
const match = coordinateReasoning({ proposedAnswer: "2", check: { type: "numeric-answer", expression: "8 / 4", proposed: 2 } });
assert.equal(match.status, "verified");
const mismatch = coordinateReasoning({ proposedAnswer: "3", check: { type: "numeric-answer", expression: "8 / 4", proposed: 3 } });
assert.equal(mismatch.status, "mismatch");
assert.equal(coordinateReasoning({ proposedAnswer: "No lo sé" }).status, "unverified");
assert.equal(coordinateReasoning({ proposedAnswer: "quizá", check: { type: "web-fact" } }).status, "unverified");
assert.throws(() => coordinateReasoning({ proposedAnswer: "" }), /respuesta propuesta/);
console.log("reasoning-coordinator: todas las pruebas han pasado");
