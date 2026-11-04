import test from "node:test";
import assert from "node:assert/strict";
import {
  parseTrainingJsonl, inspectTrainingCorpus, selectTrainingExamples,
  exportTrainingJsonl, createLoraPreparationManifest, evaluateHeldOutExamples
} from "../js/neural-core/training-corpus.mjs";

const examples = [
  { id:"a", domain:"science", question:"Q", answer:"A", split:"train", status:"approved" },
  { id:"b", domain:"science", question:"Q2", answer:"A2", split:"eval", status:"approved" },
  { id:"c", domain:"science", question:"Q3", answer:"A3", split:"train", status:"review" }
];

test("parsea JSONL y detecta líneas mal formadas", () => {
  assert.equal(parseTrainingJsonl(JSON.stringify(examples[0])+"\n").length, 1);
  assert.throws(() => parseTrainingJsonl("{mal\n"), /línea 1/);
});
test("valida ejemplos y detecta IDs duplicados sin detener el lote", () => {
  const result = inspectTrainingCorpus([examples[0], examples[0], { ...examples[1], domain:"inventado" }]);
  assert.equal(result.accepted.length, 1);
  assert.equal(result.rejected.length, 2);
});
test("solo exporta ejemplos aprobados del conjunto train", () => {
  const rows = exportTrainingJsonl(examples).split("\n");
  assert.equal(rows.length, 1);
  assert.equal(JSON.parse(rows[0]).messages[1].content, "A");
});
test("mantiene separado el conjunto de evaluación", () => {
  assert.deepEqual(selectTrainingExamples(examples, { split:"eval" }).map(x => x.id), ["b"]);
});
test("el manifiesto LoRA declara que no entrena ni cambia pesos", () => {
  const manifest = createLoraPreparationManifest({ baseModel:"Qwen", corpusVersion:"0.3" });
  assert.equal(manifest.method, "LoRA");
  assert.equal(manifest.changesModelWeights, false);
});
test("evalúa ejemplos reservados con evaluador independiente", async () => {
  const result = await evaluateHeldOutExamples({
    examples,
    generate: async () => "respuesta",
    judge: async () => ({ score:0.9, passed:true, notes:"correcta" })
  });
  assert.equal(result.evaluated, 1);
  assert.equal(result.passed, 1);
  assert.equal(result.averageScore, 0.9);
});
test("rechaza puntuaciones fuera de rango", async () => {
  await assert.rejects(() => evaluateHeldOutExamples({
    examples,
    generate: async () => "x",
    judge: async () => ({ score:2 })
  }), /entre 0 y 1/);
});
