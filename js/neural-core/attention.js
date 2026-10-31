// Bloque experimental de atención causal de una cabeza.
// Es un componente de arquitectura, no un Transformer completo entrenado.
function softmax(values) {
  const max = Math.max(...values);
  const exps = values.map(v => Math.exp(v - max));
  const total = exps.reduce((a, b) => a + b, 0);
  return exps.map(v => v / total);
}
function dot(a, b) {
  if (a.length !== b.length) throw new RangeError("Dimensiones de atención incompatibles");
  return a.reduce((sum, value, i) => sum + value * b[i], 0);
}
export function scaledDotProductAttention(queries, keys, values, { causal = false } = {}) {
  if (!Array.isArray(queries) || !Array.isArray(keys) || !Array.isArray(values) ||
      !queries.length || !keys.length || keys.length !== values.length) {
    throw new TypeError("Matrices de atención no válidas");
  }
  const depth = queries[0].length;
  if (!depth || keys.some(row => row.length !== depth) ||
      queries.some(row => row.length !== depth) ||
      values.some(row => !Array.isArray(row) || row.length !== values[0].length)) {
    throw new RangeError("Dimensiones de atención no válidas");
  }
  const weights = queries.map((query, qi) => {
    const scores = keys.map((key, ki) =>
      causal && ki > qi ? -Infinity : dot(query, key) / Math.sqrt(depth));
    return softmax(scores);
  });
  const output = weights.map(row => values[0].map((_, col) =>
    row.reduce((sum, weight, i) => sum + weight * values[i][col], 0)));
  return { output, weights };
}

export class TinyAttentionBlock {
  constructor({ width = 16 } = {}) {
    if (!Number.isInteger(width) || width < 2 || width > 256) throw new RangeError("width debe estar entre 2 y 256");
    this.width = width;
    const init = () => Array.from({length: width}, () =>
      Array.from({length: width}, () => (Math.random() - 0.5) * Math.sqrt(2 / width)));
    this.Wq = init(); this.Wk = init(); this.Wv = init();
  }
  _project(sequence, weights) {
    return sequence.map(row => weights.map((_, col) =>
      row.reduce((sum, value, i) => sum + value * weights[i][col], 0)));
  }
  forward(sequence) {
    if (!Array.isArray(sequence) || !sequence.length ||
        sequence.some(row => !Array.isArray(row) || row.length !== this.width || row.some(v => !Number.isFinite(v)))) {
      throw new TypeError("Secuencia de embeddings no válida");
    }
    const result = scaledDotProductAttention(
      this._project(sequence, this.Wq),
      this._project(sequence, this.Wk),
      this._project(sequence, this.Wv),
      { causal: true }
    );
    return result.output;
  }
}
