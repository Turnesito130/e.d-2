// E.D.-2 Neural Core — tokenizador BPE entrenable desde cero.
// Aprende subpalabras a partir del corpus proporcionado. No usa vocabularios externos.

export class SubwordTokenizer {
  constructor({ merges = [], alphabet = [] } = {}) {
    this.alphabet = [...new Set(alphabet)];
    this.merges = merges.map(pair => {
      if (!Array.isArray(pair) || pair.length !== 2 ||
          pair.some(part => typeof part !== "string" || !part.length)) {
        throw new TypeError("Regla BPE no válida");
      }
      return [pair[0], pair[1]];
    });
    this.vocab = [...new Set([...this.alphabet, ...this.merges.map(([a, b]) => a + b)])];
    this.index = new Map(this.vocab.map((piece, id) => [piece, id]));
  }

  fit(text, { vocabSize = 512, minFrequency = 2 } = {}) {
    if (typeof text !== "string" || !text.length) throw new TypeError("El corpus debe ser texto no vacío");
    if (!Number.isInteger(vocabSize) || vocabSize < 2) throw new RangeError("vocabSize debe ser al menos 2");
    if (!Number.isInteger(minFrequency) || minFrequency < 1) throw new RangeError("minFrequency debe ser positivo");

    this.alphabet = [...new Set([...text])];
    let sequences = [...text].map(char => [char]);
    this.merges = [];

    while (this.alphabet.length + this.merges.length < vocabSize) {
      const counts = new Map();
      for (const sequence of sequences) {
        for (let i = 0; i < sequence.length - 1; i++) {
          const key = JSON.stringify([sequence[i], sequence[i + 1]]);
          counts.set(key, (counts.get(key) || 0) + 1);
        }
      }
      let best = null, bestCount = minFrequency - 1;
      for (const [key, count] of counts) {
        if (count > bestCount) {
          best = JSON.parse(key);
          bestCount = count;
        }
      }
      if (!best) break;

      const [left, right] = best;
      this.merges.push(best);
      sequences = sequences.map(sequence => {
        const merged = [];
        for (let i = 0; i < sequence.length; i++) {
          if (i + 1 < sequence.length && sequence[i] === left && sequence[i + 1] === right) {
            merged.push(left + right);
            i++;
          } else merged.push(sequence[i]);
        }
        return merged;
      });
    }

    this.vocab = [...new Set([...this.alphabet, ...this.merges.map(([a, b]) => a + b)])];
    this.index = new Map(this.vocab.map((piece, id) => [piece, id]));
    return this;
  }

  encode(text) {
    if (typeof text !== "string") throw new TypeError("El texto debe ser una cadena");
    let pieces = [...text];
    for (const [left, right] of this.merges) {
      const merged = [];
      for (let i = 0; i < pieces.length; i++) {
        if (i + 1 < pieces.length && pieces[i] === left && pieces[i + 1] === right) {
          merged.push(left + right);
          i++;
        } else merged.push(pieces[i]);
      }
      pieces = merged;
    }
    const ids = pieces.map(piece => this.index.get(piece));
    if (ids.some(id => id === undefined)) {
      throw new Error("El tokenizador no conoce uno o más caracteres; amplía el corpus de entrenamiento");
    }
    return ids;
  }

  decode(ids) {
    return ids.map(id => {
      if (!Number.isInteger(id) || id < 0 || id >= this.vocab.length) {
        throw new RangeError("Token fuera del vocabulario: " + id);
      }
      return this.vocab[id];
    }).join("");
  }

  get size() { return this.vocab.length; }

  toJSON() {
    return { version: 1, type: "bpe", alphabet: [...this.alphabet], merges: this.merges.map(pair => [...pair]) };
  }

  static fromJSON(data) {
    if (!data || data.version !== 1 || data.type !== "bpe" ||
        !Array.isArray(data.alphabet) || !data.alphabet.length ||
        data.alphabet.some(char => typeof char !== "string" || [...char].length !== 1) ||
        new Set(data.alphabet).size !== data.alphabet.length || !Array.isArray(data.merges)) {
      throw new TypeError("Formato BPE no válido");
    }
    const tokenizer = new SubwordTokenizer(data);
    if (tokenizer.merges.some(([a, b]) => !tokenizer.vocab.includes(a) || !tokenizer.vocab.includes(b))) {
      throw new TypeError("La regla BPE usa piezas desconocidas");
    }
    return tokenizer;
  }
}
