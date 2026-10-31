// E.D.-2 Neural Core 0.1 — entrenamiento progresivo

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
  epochs = 10, learningRate = 0.03, onProgress = () => {},
  yieldEvery = 250, shouldStop = () => false
} = {}) {
  if (!Number.isInteger(epochs) || epochs < 1 || epochs > 10000) throw new RangeError("epochs debe estar entre 1 y 10000");
  if (!(learningRate > 0) || !Number.isFinite(learningRate)) throw new RangeError("learningRate no válido");
  if (!Number.isInteger(yieldEvery) || yieldEvery < 1) throw new RangeError("yieldEvery debe ser un entero positivo");

  const pairs = makeTrainingPairs(tokenIds, model.contextSize);
  const history = [];
  let step = 0;
  for (let epoch = 0; epoch < epochs; epoch++) {
    let totalLoss = 0;
    let epochSteps = 0;
    for (const pair of pairs) {
      if (shouldStop()) return { stopped: true, history, steps: step };
      totalLoss += model.trainExample(pair.context, pair.target, learningRate);
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
