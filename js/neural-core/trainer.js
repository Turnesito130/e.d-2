// E.D.-2 Neural Core — entrenamiento progresivo
import { AdamOptimizer } from "./optimizer.js";

export function makeTrainingPairs(tokenIds, contextSize) {
  if (!Array.isArray(tokenIds) || tokenIds.length <= contextSize) {
    throw new Error("El texto de entrenamiento es demasiado corto");
  }
  const pairs = [];
  for (let i = 0; i < tokenIds.length; i++) {
    const context = Array(contextSize).fill(0);
    const start = Math.max(0, i - contextSize);
    const tail = tokenIds.slice(start, i);
    context.splice(contextSize - tail.length, tail.length, ...tail);
    pairs.push({ context, target: tokenIds[i] });
  }
  return pairs;
}

export async function train(model, tokenIds, {
  epochs = 10, learningRate = 0.001, onProgress = () => {},
  yieldEvery = 250, shouldStop = () => false, optimizer = "adam", shuffle = true
} = {}) {
  if (!Number.isInteger(epochs) || epochs < 1 || epochs > 10000) throw new RangeError("epochs debe estar entre 1 y 10000");
  if (!(learningRate > 0) || !Number.isFinite(learningRate)) throw new RangeError("learningRate no válido");
  if (!Number.isInteger(yieldEvery) || yieldEvery < 1) throw new RangeError("yieldEvery debe ser un entero positivo");

  if (typeof onProgress !== "function" || typeof shouldStop !== "function") throw new TypeError("onProgress y shouldStop deben ser funciones");
  const pairs = makeTrainingPairs(tokenIds, model.contextSize);
  const activeOptimizer = optimizer === "adam" ? new AdamOptimizer() :
    optimizer === "sgd" ? null : optimizer;
  if (optimizer !== "adam" && optimizer !== "sgd" &&
      (!optimizer || typeof optimizer.step !== "function")) {
    throw new TypeError("optimizer debe ser 'adam', 'sgd' o implementar step()");
  }
  const history = [];
  let step = 0;
  for (let epoch = 0; epoch < epochs; epoch++) {
    let totalLoss = 0;
    let epochSteps = 0;
    const epochPairs = shuffle ? [...pairs] : pairs;
    if (shuffle) {
      for (let i = epochPairs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [epochPairs[i], epochPairs[j]] = [epochPairs[j], epochPairs[i]];
      }
    }
    for (const pair of epochPairs) {
      if (shouldStop()) return { stopped: true, history, steps: step };
      totalLoss += model.trainExample(pair.context, pair.target, learningRate, 1, activeOptimizer);
      step++;
      epochSteps++;
      if (step % yieldEvery === 0) {
        onProgress({ epoch: epoch + 1, epochs, step, loss: totalLoss / epochSteps });
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    const averageLoss = totalLoss / pairs.length;
    history.push(averageLoss);
    onProgress({ epoch: epoch + 1, epochs, step, loss: averageLoss });
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  return { stopped: false, history, steps: step };
}
