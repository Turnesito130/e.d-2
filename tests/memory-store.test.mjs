import test from "node:test";
import assert from "node:assert/strict";
import { createMemoryStore } from "../js/neural-core/memory-store.mjs";

function memoryStorage() {
  const data = new Map();
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}

test("no guarda información sin consentimiento explícito", () => {
  const memory = createMemoryStore({ storage: memoryStorage() });
  assert.throws(() => memory.remember({ content: "Me gusta la astronomía" }), /consentimiento explícito/);
  assert.equal(memory.list().length, 0);
});

test("guarda procedencia, tipo, confianza y fecha", () => {
  const memory = createMemoryStore({ storage: memoryStorage(), now: () => "2026-11-01T10:00:00.000Z" });
  const item = memory.remember({ content: "El proyecto se llama E.D.-2", type: "fact", source: "usuario", confidence: 0.95, consent: true });
  assert.equal(item.type, "fact");
  assert.equal(item.source, "usuario");
  assert.equal(item.confidence, 0.95);
  assert.equal(item.createdAt, "2026-11-01T10:00:00.000Z");
});

test("busca recuerdos relevantes y construye contexto", () => {
  const memory = createMemoryStore({ storage: memoryStorage() });
  memory.remember({ content: "El proyecto E.D.-2 utiliza JavaScript", type: "knowledge", consent: true });
  memory.remember({ content: "Prefiere respuestas breves", type: "preference", consent: true });
  assert.equal(memory.search("proyecto JavaScript")[0].type, "knowledge");
  assert.match(memory.context("proyecto JavaScript"), /JavaScript/);
});

test("permite marcar recuerdos inciertos y retirarlos", () => {
  const memory = createMemoryStore({ storage: memoryStorage() });
  const item = memory.remember({ content: "Hipótesis pendiente de comprobar", type: "hypothesis", consent: true });
  assert.equal(memory.update(item.id, { status: "uncertain" }).status, "uncertain");
  assert.equal(memory.search("hipótesis").length, 0);
  assert.equal(memory.search("hipótesis", { includeUncertain: true }).length, 1);
  assert.equal(memory.forget(item.id), true);
});

test("exporta e importa solo copias con formato válido y consentimiento", () => {
  const first = createMemoryStore({ storage: memoryStorage() });
  first.remember({ content: "Dato de prueba", type: "fact", consent: true });
  const backup = first.exportJSON();
  const second = createMemoryStore({ storage: memoryStorage() });
  assert.throws(() => second.importJSON(backup), /confirmación explícita/);
  assert.equal(second.importJSON(backup, { consent: true }), 1);
  assert.equal(second.list().length, 1);
});
