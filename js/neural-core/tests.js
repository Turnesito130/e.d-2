// E.D.-2 Neural Core — pruebas automáticas básicas
import { CharTokenizer } from "./tokenizer.js";
import { makeTrainingPairs, train } from "./trainer.js";
import { createBrain, trainBrain, generateText, exportBrain, importBrain } from "./index.js";

function assert(condition, message) {
  if (!condition) throw new Error("FALLO: " + message);
}
function expectThrow(fn, message) {
  let thrown = false;
  try { fn(); } catch (_) { thrown = true; }
  assert(thrown, message);
}
function meanLoss(model, pairs) {
  return pairs.reduce((sum, pair) => {
    const p = model.predict(pair.context).probabilities[pair.target];
    return sum - Math.log(Math.max(p, 1e-12));
  }, 0) / pairs.length;
}

export async function runCoreTests(onLog = () => {}) {
  const results = [];
  const failures = [];
  const test = async (name, fn) => {
    try {
      await fn();
      results.push(name);
      onLog("✓ " + name);
    } catch (error) {
      failures.push({ name, message: error && error.message ? error.message : String(error) });
      onLog("✗ " + name + ": " + failures[failures.length - 1].message);
    }
  };

  await test("tokenizador: codifica y decodifica texto", () => {
    const tok = new CharTokenizer().fit("E.D.-2 ñ");
    assert(tok.decode(tok.encode("E.D.-2 ñ")) === "E.D.-2 ñ", "ida y vuelta del tokenizador");
  });

  await test("tokenizador: rechaza caracteres desconocidos", () => {
    const tok = new CharTokenizer().fit("abc");
    expectThrow(() => tok.encode("z"), "debe rechazar tokens desconocidos");
  });

  await test("datos: crea contextos y objetivos válidos", () => {
    const pairs = makeTrainingPairs([0, 1, 0, 1, 0], 2);
    assert(pairs.length === 5, "número de ejemplos");
    assert(pairs.every(p => p.context.length === 2 && Number.isInteger(p.target)), "forma de ejemplos");
  });

  await test("modelo: entrena sin valores no finitos y reduce la pérdida", async () => {
    const text = "abababababababababababababababab";
    const brain = createBrain({ text, contextSize: 2, hiddenSize: 16 });
    const ids = brain.tokenizer.encode(text);
    const pairs = makeTrainingPairs(ids, brain.model.contextSize);
    const before = meanLoss(brain.model, pairs);
    await train(brain.model, ids, { epochs: 80, learningRate: 0.08, yieldEvery: 10000 });
    const after = meanLoss(brain.model, pairs);
    assert(Number.isFinite(after), "pérdida final finita");
    assert(after < before, "la pérdida debe bajar (" + before.toFixed(3) + " → " + after.toFixed(3) + ")");
  });

  await test("generación: produce la cantidad solicitada", () => {
    const brain = createBrain({ text: "hola mundo hola mundo", contextSize: 4, hiddenSize: 8 });
    const out = generateText(brain, "hola", { maxTokens: 12, temperature: 0.8 });
    assert(out.length === 16, "longitud generada");
  });

  await test("persistencia: exporta e importa pesos", () => {
    const brain = createBrain({ text: "ed dos aprende", contextSize: 3, hiddenSize: 8 });
    const restored = importBrain(exportBrain(brain));
    assert(JSON.stringify(restored.model.toJSON()) === JSON.stringify(brain.model.toJSON()), "pesos restaurados");
    assert(restored.tokenizer.decode(restored.tokenizer.encode("ed dos")) === "ed dos", "vocabulario restaurado");
  });

  await test("persistencia: rechaza archivos incompatibles", () => {
    expectThrow(() => importBrain('{"format":"otro","version":1}'), "formato incorrecto");
  });


  await test("API pública: entrena un cerebro y devuelve historial", async () => {
    const text = "hola hola";
    const brain = createBrain({ text, contextSize: 2, hiddenSize: 8 });
    const result = await trainBrain(brain, text, { epochs: 2, learningRate: 0.03, yieldEvery: 10000 });
    assert(result.stopped === false, "el entrenamiento debe terminar");
    assert(result.history.length === 2, "debe registrar cada época");
    assert(result.steps === brain.tokenizer.encode(text).length, "número de pasos");
  });

  await test("validación: rechaza textos de entrenamiento demasiado cortos", () => {
    expectThrow(() => createBrain({ text: "a", contextSize: 4 }), "debe rechazar texto corto");
  });

  await test("persistencia: rechaza pesos con dimensiones incorrectas", () => {
    const brain = createBrain({ text: "ed dos aprende", contextSize: 3, hiddenSize: 8 });
    const bundle = JSON.parse(exportBrain(brain));
    bundle.model.W1[0].pop();
    expectThrow(() => importBrain(bundle), "debe rechazar dimensiones incorrectas");
  });


  await test("modelo: rechaza tasa de aprendizaje no válida", () => {
    const brain = createBrain({ text: "hola mundo", contextSize: 2, hiddenSize: 8 });
    expectThrow(() => brain.model.trainExample([0, 0], 0, NaN), "debe rechazar NaN");
  });

  await test("generación: rechaza prefijos con tokens inválidos", () => {
    const brain = createBrain({ text: "hola mundo", contextSize: 2, hiddenSize: 8 });
    expectThrow(() => brain.model.generate([999], 2), "debe rechazar token fuera del vocabulario");
  });

  await test("tokenizador: rechaza vocabularios duplicados", () => {
    expectThrow(() => CharTokenizer.fromJSON({ version: 1, chars: ["a", "a"] }), "debe rechazar duplicados");
  });

  onLog("RESULTADO: " + results.length + " superadas; " + failures.length + " fallidas.");
  return { passed: results, failed: failures };
}
