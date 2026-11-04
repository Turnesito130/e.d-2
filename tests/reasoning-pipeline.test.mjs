import test from "node:test";
import assert from "node:assert/strict";
import { createHybridReasoner } from "../js/neural-core/reasoning-pipeline.mjs";

test("combina propuesta neuronal con verificación determinista", async () => {
  const reasoner = createHybridReasoner({
    generate: async () => ({
      answer: "El resultado es 14.",
      check: { type: "numeric-answer", expression: "2 + 3 * 4", proposed: 14 }
    })
  });
  const result = await reasoner.run("¿Cuánto es 2 + 3 * 4?");
  assert.equal(result.status, "verified");
  assert.equal(result.verification.expected, 14);
  assert.equal(result.memoryUsed, false);
});

test("no declara verificada una respuesta sin comprobación compatible", async () => {
  const reasoner = createHybridReasoner({ generate: async () => "La respuesta parece correcta." });
  const result = await reasoner.run("Explícame la fotosíntesis");
  assert.equal(result.status, "unverified");
  assert.equal(result.verification, null);
});

test("rechaza propuestas vacías", async () => {
  const reasoner = createHybridReasoner({ generate: async () => " " });
  await assert.rejects(() => reasoner.run("Hola"), /respuesta del modelo/);
});

test("no planifica ni ejecuta herramientas si no se solicita", async () => {
  let planned = false;
  const runtime = {
    plan: () => { planned = true; return { steps: [] }; },
    execute: async () => { throw new Error("No debería ejecutarse"); }
  };
  const reasoner = createHybridReasoner({ generate: async () => "Respuesta", runtime });
  const result = await reasoner.run("Hola");
  assert.equal(planned, false);
  assert.equal(result.plan, null);
  assert.equal(result.execution, null);
});

test("exige runtime si se solicita planificar herramientas", async () => {
  const reasoner = createHybridReasoner({ generate: async () => "Respuesta" });
  await assert.rejects(() => reasoner.run("Busca algo", { planTools: true }), /runtime de herramientas/);
});

test("limita el historial entregado al generador a ocho turnos", async () => {
  let received;
  const reasoner = createHybridReasoner({
    generate: async args => { received = args; return "Listo"; }
  });
  await reasoner.run("Continúa", { history: Array.from({ length: 12 }, (_, i) => i) });
  assert.deepEqual(received.history, [4, 5, 6, 7, 8, 9, 10, 11]);
});
