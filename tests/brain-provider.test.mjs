import test from "node:test";
import assert from "node:assert/strict";
import { createLocalBrainProvider } from "../js/neural-core/brain-provider.mjs";

test("el proveedor local comprueba compatibilidad, carga una vez y genera", async () => {
  let loads = 0;
  const provider = createLocalBrainProvider({
    loadModule: async () => ({
      checkLocalModelSupport: async () => ({ supported: true }),
      loadLocalModel: async () => { loads += 1; },
      generateLocalResponse: async () => "respuesta local"
    })
  });

  assert.equal(provider.ready, false);
  assert.deepEqual(await provider.checkSupport(), { supported: true });
  await provider.load();
  await provider.load();
  assert.equal(loads, 1);
  assert.equal(provider.ready, true);
  assert.equal(await provider.generate([{ role: "user", content: "hola" }]), "respuesta local");
});

test("no permite generar antes de cargar el cerebro", async () => {
  const provider = createLocalBrainProvider({
    loadModule: async () => ({
      checkLocalModelSupport: async () => ({ supported: true }),
      loadLocalModel: async () => {},
      generateLocalResponse: async () => "respuesta"
    })
  });
  await assert.rejects(
    provider.generate([{ role: "user", content: "hola" }]),
    /todavía no está preparado/
  );
});

test("rechaza la carga si el dispositivo no es compatible", async () => {
  let loads = 0;
  const provider = createLocalBrainProvider({
    loadModule: async () => ({
      checkLocalModelSupport: async () => ({ supported: false, reason: "WebGPU no disponible" }),
      loadLocalModel: async () => { loads += 1; },
      generateLocalResponse: async () => "respuesta"
    })
  });
  await assert.rejects(provider.load(), /WebGPU no disponible/);
  assert.equal(loads, 0);
  assert.equal(provider.ready, false);
});
