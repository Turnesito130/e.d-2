import test from "node:test";
import assert from "node:assert/strict";
import { planTask, validatePlan, classifyRisk, createAgentRuntime, RISK_LEVELS } from "../js/neural-core/agent-runtime.mjs";

test("crea un plan de cálculo válido sin ejecutar nada", () => {
  const plan = planTask("Calcula 12 por 3");
  assert.equal(plan.steps.length, 1);
  assert.equal(plan.steps[0].tool, "calculate");
  assert.equal(validatePlan(plan), true);
});

test("solo interpreta una nota cuando el usuario lo pide explícitamente", () => {
  const plan = planTask("Recuerda que mi proyecto se llama E.D.");
  assert.equal(plan.steps[0].tool, "note");
  assert.equal(plan.steps[0].args.text, "mi proyecto se llama E.D.");
});

test("clasifica acciones externas y destructivas como críticas", () => {
  assert.equal(classifyRisk("send_message"), RISK_LEVELS.CRITICAL);
  assert.equal(classifyRisk("file_write"), RISK_LEVELS.HIGH);
  assert.equal(classifyRisk("calculate"), RISK_LEVELS.LOW);
});

test("no ejecuta herramientas no registradas", async () => {
  const runtime = createAgentRuntime();
  const result = await runtime.execute(planTask("Busca en Google la fotosíntesis"));
  assert.equal(result.results[0].status, "unavailable");
});

test("las acciones de riesgo alto requieren aprobación explícita", async () => {
  const runtime = createAgentRuntime({ tools: { file_write: async () => "escrito" } });
  const plan = Object.freeze({ id: "p1", goal: "guardar archivo", steps: [Object.freeze({ id: "s1", tool: "file_write", args: Object.freeze({}), risk: "high", description: "escribir" })] });
  let called = false;
  const result = await runtime.execute(plan, { approve: async () => false });
  assert.equal(result.results[0].status, "approval_required");
  assert.equal(called, false);
});

test("rechaza planes manipulados con riesgo rebajado", async () => {
  const runtime = createAgentRuntime({ tools: { file_write: async () => "escrito" } });
  const plan = { id: "p2", goal: "x", steps: [{ id: "s1", tool: "file_write", args: {}, risk: "low", description: "x" }] };
  await assert.rejects(() => runtime.execute(plan), /Plan no válido/);
});
