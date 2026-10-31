// E.D.-2 Neural Core 0.1 — tokenizer
// Tokenizador de caracteres entrenable desde cero. Sin dependencias ni servicios externos.

export class CharTokenizer {
  constructor(chars = []) {
    this.chars = [...new Set(chars)];
    this.index = new Map(this.chars.map((ch, i) => [ch, i]));
  }

  fit(text) {
    for (const ch of text) {
      if (!this.index.has(ch)) {
        this.index.set(ch, this.chars.length);
        this.chars.push(ch);
      }
    }
    return this;
  }

  encode(text) {
    const unknown = [];
    const ids = [];
    for (const ch of text) {
      const id = this.index.get(ch);
      if (id === undefined) unknown.push(ch);
      else ids.push(id);
    }
    if (unknown.length) {
      throw new Error(`El tokenizador no conoce estos caracteres: ${[...new Set(unknown)].join("")}`);
    }
    return ids;
  }

  decode(ids) {
    return ids.map(id => {
      if (!Number.isInteger(id) || id < 0 || id >= this.chars.length) {
        throw new RangeError(`Token fuera del vocabulario: ${id}`);
      }
      return this.chars[id];
    }).join("");
  }

  get size() { return this.chars.length; }

  toJSON() { return { version: 1, chars: [...this.chars] }; }

  static fromJSON(data) {
    if (!data || data.version !== 1 || !Array.isArray(data.chars) ||
        data.chars.some(ch => typeof ch !== "string" || [...ch].length !== 1)) {
      throw new TypeError("Formato de tokenizador no válido");
    }
    return new CharTokenizer(data.chars);
  }
}
