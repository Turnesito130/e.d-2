// Memoria local del navegador. IndexedDB primero; Map temporal como alternativa.
export class BrainMemory {
  constructor({ name = "ed2-brain-memory", store = "memories" } = {}) {
    this.name = name; this.store = store; this.fallback = new Map(); this.dbPromise = null;
  }
  _db() {
    if (!("indexedDB" in globalThis)) return Promise.resolve(null);
    if (!this.dbPromise) this.dbPromise = new Promise(resolve => {
      const request = indexedDB.open(this.name, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.store)) db.createObjectStore(this.store);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    });
    return this.dbPromise;
  }
  async put(key, value) {
    if (typeof key !== "string" || !key.trim()) throw new TypeError("La clave debe ser texto");
    const db = await this._db();
    if (!db) { this.fallback.set(key, value); return false; }
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.store, "readwrite");
      tx.objectStore(this.store).put(value, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }
  async get(key) {
    const db = await this._db();
    if (!db) return this.fallback.get(key);
    return new Promise((resolve, reject) => {
      const request = db.transaction(this.store, "readonly").objectStore(this.store).get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  async delete(key) {
    const db = await this._db();
    if (!db) return this.fallback.delete(key);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.store, "readwrite");
      tx.objectStore(this.store).delete(key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }
  // Recuperación local por similitud léxica TF-IDF/coseno; no requiere servicios externos.
  async search(query, { limit = 5, minScore = 0.02 } = {}) {
    if (typeof query !== "string" || !query.trim()) throw new TypeError("La consulta debe ser texto");
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new RangeError("limit debe estar entre 1 y 100");
    const keys = await this.list();
    const docs = [];
    for (const key of keys) {
      const value = await this.get(key);
      const text = typeof value === "string" ? value :
        typeof value?.text === "string" ? value.text :
        typeof value?.content === "string" ? value.content : "";
      if (text.trim()) docs.push({ key, value, text, terms: this._terms(text) });
    }
    const q = this._terms(query);
    if (!q.size || !docs.length) return [];
    const df = new Map();
    for (const d of docs) for (const term of d.terms.keys()) df.set(term, (df.get(term) || 0) + 1);
    const vector = (terms) => {
      const out = new Map();
      for (const [term, count] of terms) {
        const idf = Math.log(1 + docs.length / (1 + (df.get(term) || 0)));
        out.set(term, (1 + Math.log(count)) * idf);
      }
      return out;
    };
    const qv = vector(q);
    const norm = (v) => Math.sqrt([...v.values()].reduce((s,x)=>s+x*x,0));
    const qn = norm(qv) || 1;
    return docs.map(d => {
      const dv = vector(d.terms);
      let dot = 0;
      for (const [term, weight] of qv) dot += weight * (dv.get(term) || 0);
      const score = dot / (qn * (norm(dv) || 1));
      return { key: d.key, value: d.value, text: d.text, score };
    }).filter(x => x.score >= minScore).sort((a,b)=>b.score-a.score).slice(0,limit);
  }

  _terms(text) {
    const normalized = text.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const tokens = normalized.match(/[\p{L}\p{N}]{2,}/gu) || [];
    const counts = new Map();
    for (const token of tokens) counts.set(token, (counts.get(token) || 0) + 1);
    return counts;
  }

  async buildContext(query, { limit = 5, maxChars = 4000 } = {}) {
    if (!Number.isInteger(maxChars) || maxChars < 1) throw new RangeError("maxChars no válido");
    const hits = await this.search(query, { limit });
    let used = 0;
    const selected = [];
    for (const hit of hits) {
      const item = "[" + hit.key + "] " + hit.text;
      if (used + item.length > maxChars) continue;
      selected.push({ key: hit.key, text: hit.text, score: hit.score });
      used += item.length;
    }
    return selected;
  }

  async list() {
    const db = await this._db();
    if (!db) return [...this.fallback.keys()];
    return new Promise((resolve, reject) => {
      const request = db.transaction(this.store, "readonly").objectStore(this.store).getAllKeys();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}
