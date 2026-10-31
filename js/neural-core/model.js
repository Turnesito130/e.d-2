// E.D.-2 Neural Core 0.1 — modelo neuronal
// Modelo de caracteres con ventana de contexto y una capa oculta.
// Los pesos se inicializan aleatoriamente: no se descargan modelos ni pesos.

function randn(scale) {
  // Aproximación normal mediante suma de uniformes; suficiente para esta demo pequeña.
  let x = 0;
  for (let i = 0; i < 6; i++) x += Math.random();
  return (x - 3) * scale;
}

function softmax(logits) {
  const max = Math.max(...logits);
  const exps = logits.map(v => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(v => v / sum);
}

export class TinyLanguageModel {
  constructor({ vocabSize, contextSize = 8, hiddenSize = 48, seedWeights = null }) {
    if (!Number.isInteger(vocabSize) || vocabSize < 2) throw new RangeError("vocabSize debe ser al menos 2");
    if (!Number.isInteger(contextSize) || contextSize < 1) throw new RangeError("contextSize no válido");
    if (!Number.isInteger(hiddenSize) || hiddenSize < 2) throw new RangeError("hiddenSize no válido");

    this.vocabSize = vocabSize;
    this.contextSize = contextSize;
    this.hiddenSize = hiddenSize;
    const inputSize = vocabSize * contextSize;
    this.W1 = Array.from({ length: hiddenSize }, () =>
      Array.from({ length: inputSize }, () => randn(Math.sqrt(2 / inputSize))));
    this.b1 = Array(hiddenSize).fill(0);
    this.W2 = Array.from({ length: vocabSize }, () =>
      Array.from({ length: hiddenSize }, () => randn(Math.sqrt(2 / hiddenSize))));
    this.b2 = Array(vocabSize).fill(0);

    if (seedWeights) this.loadWeights(seedWeights);
  }

  _forward(context) {
    if (context.length !== this.contextSize) throw new Error("Longitud de contexto incorrecta");
    const x = Array(this.vocabSize * this.contextSize).fill(0);
    context.forEach((token, pos) => {
      if (!Number.isInteger(token) || token < 0 || token >= this.vocabSize) throw new RangeError("Token inválido");
      x[pos * this.vocabSize + token] = 1;
    });

    const hPre = this.W1.map((row, i) =>
      row.reduce((sum, w, j) => sum + w * x[j], this.b1[i]));
    const h = hPre.map(v => Math.tanh(v));
    const logits = this.W2.map((row, i) =>
      row.reduce((sum, w, j) => sum + w * h[j], this.b2[i]));
    return { x, h, probs: softmax(logits) };
  }

  trainExample(context, target, learningRate = 0.03, gradientClip = 1) {
    if (!Number.isInteger(target) || target < 0 || target >= this.vocabSize) throw new RangeError("Objetivo inválido");
    if (!(learningRate > 0) || !Number.isFinite(learningRate)) throw new RangeError("Tasa de aprendizaje no válida");
    if (!(gradientClip > 0) || !Number.isFinite(gradientClip)) throw new RangeError("Límite de gradiente no válido");
    const { x, h, probs } = this._forward(context);
    const loss = -Math.log(Math.max(probs[target], 1e-12));

    const dLogits = probs.slice();
    dLogits[target] -= 1;
    const dW2 = this.W2.map((row, i) => row.map((_, j) => dLogits[i] * h[j]));
    const db2 = dLogits;
    const dHidden = Array(this.hiddenSize).fill(0);
    for (let j = 0; j < this.hiddenSize; j++) {
      for (let i = 0; i < this.vocabSize; i++) dHidden[j] += this.W2[i][j] * dLogits[i];
    }
    const dPre = dHidden.map((v, j) => v * (1 - h[j] * h[j]));
    const dW1 = this.W1.map((row, i) => row.map((_, j) => dPre[i] * x[j]));
    const db1 = dPre;

    // Recorte global de gradiente: evita actualizaciones enormes e inestables.
    let normSquared = 0;
    for (const group of [dW1, dW2, db1, db2]) {
      for (const row of group) {
        if (Array.isArray(row)) {
          for (const value of row) normSquared += value * value;
        } else normSquared += row * row;
      }
    }
    const gradientNorm = Math.sqrt(normSquared);
    if (!Number.isFinite(gradientNorm)) throw new Error("Gradiente no finito");
    const scale = gradientNorm > gradientClip ? gradientClip / gradientNorm : 1;

    for (let i = 0; i < this.vocabSize; i++) {
      this.b2[i] -= learningRate * db2[i] * scale;
      for (let j = 0; j < this.hiddenSize; j++) this.W2[i][j] -= learningRate * dW2[i][j] * scale;
    }
    for (let i = 0; i < this.hiddenSize; i++) {
      this.b1[i] -= learningRate * db1[i] * scale;
      for (let j = 0; j < x.length; j++) this.W1[i][j] -= learningRate * dW1[i][j] * scale;
    }
    return loss;
  }

  predict(context) {
    const probs = this._forward(context).probs;
    let best = 0;
    for (let i = 1; i < probs.length; i++) if (probs[i] > probs[best]) best = i;
    return { token: best, probabilities: probs };
  }

  sample(context, temperature = 0.8) {
    if (!(temperature > 0) || !Number.isFinite(temperature)) throw new RangeError("Temperatura no válida");
    const probs = this._forward(context).probs.map(p => Math.pow(Math.max(p, 1e-12), 1 / temperature));
    const total = probs.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < probs.length; i++) {
      r -= probs[i];
      if (r <= 0) return i;
    }
    return probs.length - 1;
  }

  generate(prefixIds, maxTokens = 120, temperature = 0.8) {
    if (!Array.isArray(prefixIds) || prefixIds.length === 0) throw new Error("Se necesita un prefijo");
    if (!Number.isInteger(maxTokens) || maxTokens < 0 || maxTokens > 10000) throw new RangeError("maxTokens debe estar entre 0 y 10000");
    if (prefixIds.some(id => !Number.isInteger(id) || id < 0 || id >= this.vocabSize)) throw new RangeError("El prefijo contiene tokens inválidos");
    const output = [...prefixIds];
    for (let i = 0; i < maxTokens; i++) {
      const context = Array(this.contextSize).fill(0);
      const tail = output.slice(-this.contextSize);
      context.splice(this.contextSize - tail.length, tail.length, ...tail);
      output.push(this.sample(context, temperature));
    }
    return output;
  }

  toJSON() {
    return {
      format: "ed2-tiny-lm", version: 1, vocabSize: this.vocabSize,
      contextSize: this.contextSize, hiddenSize: this.hiddenSize,
      W1: this.W1, b1: this.b1, W2: this.W2, b2: this.b2
    };
  }

  loadWeights(data) {
    if (!data || data.format !== "ed2-tiny-lm" || data.version !== 1 ||
        data.vocabSize !== this.vocabSize || data.contextSize !== this.contextSize ||
        data.hiddenSize !== this.hiddenSize) throw new TypeError("Pesos incompatibles");
    const shape = (a, rows, cols) => Array.isArray(a) && a.length === rows &&
      a.every(row => Array.isArray(row) && row.length === cols && row.every(Number.isFinite));
    if (!shape(data.W1, this.hiddenSize, this.vocabSize * this.contextSize) ||
        !Array.isArray(data.b1) || data.b1.length !== this.hiddenSize || !data.b1.every(Number.isFinite) ||
        !shape(data.W2, this.vocabSize, this.hiddenSize) ||
        !Array.isArray(data.b2) || data.b2.length !== this.vocabSize || !data.b2.every(Number.isFinite)) {
      throw new TypeError("Dimensiones o valores de pesos no válidos");
    }
    this.W1 = data.W1.map(row => [...row]);
    this.b1 = [...data.b1];
    this.W2 = data.W2.map(row => [...row]);
    this.b2 = [...data.b2];
  }
}
