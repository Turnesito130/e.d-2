# E.D.-2 Neural Core — laboratorio experimental

El núcleo neuronal se ejecuta en JavaScript estándar, sin dependencias externas, APIs de IA ni pesos preentrenados.

## Capacidades implementadas

- **Modelo base:** red neuronal pequeña de predicción del siguiente carácter, entrenada por retropropagación.
- **Tokenizador BPE propio:** aprende subpalabras del corpus, sin vocabulario externo; se puede seleccionar con `tokenizerType: "bpe"`. El modo de caracteres sigue disponible por compatibilidad.
- **Estabilidad:** recorte global de gradientes y validaciones de entradas.
- **Optimizador Adam:** momentos y corrección de sesgo implementados desde cero. SGD sigue disponible con `optimizer: "sgd"`.
- **Entrenamiento:** barajado de ejemplos, progreso, pausas para no bloquear la interfaz y parada solicitada.
- **Evaluación:** pérdida, perplejidad y precisión en un conjunto separado mediante `evaluate(model, ids)`.
- **Atención:** función de atención escalada y un bloque experimental causal de una cabeza.
- **Memoria:** almacenamiento local con IndexedDB y alternativa temporal en memoria cuando IndexedDB no está disponible.
- **Persistencia del modelo:** exportación e importación de vocabulario y pesos.

## Uso básico

```js
import { createBrain, trainBrain, generateText, evaluate } from "../js/neural-core/index.js";

const brain = createBrain({
  text: "hola mundo. hola E.D.-2.",
  contextSize: 8,
  hiddenSize: 48
});

const report = await trainBrain(brain, "hola mundo. hola E.D.-2.", {
  epochs: 20,
  learningRate: 0.001,
  optimizer: "adam",
  onProgress: info => console.log(info)
});

console.log(report);
console.log(generateText(brain, "hola", { maxTokens: 40 }));
console.log(evaluate(brain.model, brain.tokenizer.encode("hola mundo.")));
await brain.memory.put("preferencia", "respuestas en español");
```

## Qué significa la atención en esta versión

`TinyAttentionBlock` demuestra proyecciones Q/K/V y atención causal en una cabeza. **Todavía no es un Transformer completo**: no tiene entrenamiento por retropropagación de sus parámetros de atención, embeddings aprendidos, bloques apilados ni generación integrada. Es una pieza experimental para la siguiente fase, no una capacidad de conversación lista para producción.

## Límites honestos

Este modelo es pequeño y aprende patrones locales del texto que se le proporciona. No tiene conocimiento general, no razona como un asistente avanzado y no se vuelve inteligente solo por añadir más épocas. Un Transformer útil requiere datos, memoria, cálculo y entrenamiento considerables. No se debe confundir una prueba técnica con un asistente comparable a ChatGPT.

La memoria usa almacenamiento local del navegador. Si IndexedDB no está disponible, la alternativa Map solo dura mientras viva la página. No se envía información a servidores desde estos módulos.

## Pruebas

Sirve el repositorio con un servidor web estático compatible con módulos ES y abre `neural-core/test.html`. Ejecuta las pruebas desde el botón. GitHub muestra el código, pero su visor de archivos no ejecuta los módulos. Las pruebas aún deben ejecutarse en el Chromebook; no se afirma que hayan pasado hasta hacerlo.

## Próximas fases

1. Ejecutar y corregir las pruebas en navegador.
2. Añadir embeddings aprendidos y entrenamiento completo de atención.
3. Entrenar atención y construir bloques Transformer completos.
4. Integrar recuperación de memoria en el flujo de conversación de E.D.-2.
5. Medir velocidad y consumo real en Chromebook.
