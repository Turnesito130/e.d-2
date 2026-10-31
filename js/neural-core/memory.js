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
