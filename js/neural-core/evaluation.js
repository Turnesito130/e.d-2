// Evaluación separada: no modifica los pesos del modelo.
export function evaluate(model, tokenIds) {
  if (!model || typeof model.predict !== "function" || !Array.isArray(tokenIds) ||
      tokenIds.length <= model.contextSize) throw new TypeError("Modelo o conjunto de evaluación no válido");
  let loss = 0, count = 0, correct = 0;
  for (let i = 0; i < tokenIds.length; i++) {
    const context = Array(model.contextSize).fill(0);
    const start = Math.max(0, i - model.contextSize);
    const tail = tokenIds.slice(start, i);
    context.splice(model.contextSize - tail.length, tail.length, ...tail);
    const prediction = model.predict(context);
    const probability = prediction.probabilities[tokenIds[i]];
    loss -= Math.log(Math.max(probability, 1e-12));
    if (prediction.token === tokenIds[i]) correct++;
    count++;
  }
  const averageLoss = loss / count;
  return { loss: averageLoss, perplexity: Math.exp(Math.min(averageLoss, 20)), accuracy: correct / count, tokens: count };
}
