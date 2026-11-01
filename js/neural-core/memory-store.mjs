/**
 * E.D.-2 Structured Memory v0.1
 * Memoria local con procedencia, confianza, fechas, consentimiento y búsqueda.
 * No interpreta recuerdos como instrucciones ejecutables.
 */
const DEFAULT_KEY = "ed_structured_memory_v1";
const TYPES = new Set(["fact", "preference", "goal", "knowledge", "hypothesis", "event", "note"]);
const STATUSES = new Set(["active", "uncertain", "superseded"]);

function normalizeText(value, max = 1200) {
  if (typeof value !== "string") throw new TypeError("El contenido debe ser texto.");
  const clean = value.trim();
  if (!clean || clean.length > max) throw new TypeError("Contenido vacío o demasiado largo.");
  return clean;
}
function tokens(value) {
  return normalizeText(value, 3000).toLocaleLowerCase("es").normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").match(/[a-z0-9]{2,}/g) || [];
}
function safeConfidence(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0.5;
  return Math.max(0, Math.min(1, n));
}

export function createMemoryStore({ storage, key = DEFAULT_KEY, now = () => new Date().toISOString() } = {}) {
  const backend = storage || (typeof localStorage !== "undefined" ? localStorage : null);
  if (!backend || typeof backend.getItem !== "function" || typeof backend.setItem !== "function") {
    throw new TypeError("Se necesita un almacenamiento compatible con localStorage.");
  }
  function read() {
    try {
      const parsed = JSON.parse(backend.getItem(key) || "[]");
      return Array.isArray(parsed) ? parsed.filter(item => item && typeof item.id === "string" && typeof item.content === "string") : [];
    } catch { return []; }
  }
  function write(items) {
    backend.setItem(key, JSON.stringify(items.slice(-1000)));
  }
  function remember(input = {}) {
    if (input.consent !== true) throw new Error("Se necesita consentimiento explícito para guardar un recuerdo.");
    const content = normalizeText(input.content);
    const type = TYPES.has(input.type) ? input.type : "note";
    const source = normalizeText(input.source || "user_explicit", 160);
    const confidence = safeConfidence(input.confidence ?? 0.8);
    const items = read();
    const duplicate = items.find(item => item.status === "active" && item.content.toLocaleLowerCase("es") === content.toLocaleLowerCase("es"));
    if (duplicate) {
      duplicate.updatedAt = now();
      duplicate.source = source;
      duplicate.confidence = confidence;
      write(items);
      return { ...duplicate, duplicate: true };
    }
    const item = {
      id: "edmem-" + Math.random().toString(36).slice(2, 10),
      content, type, source, confidence, status: "active",
      createdAt: now(), updatedAt: now()
    };
    items.push(item);
    write(items);
    return { ...item };
  }
  function search(query, { limit = 8, includeUncertain = false } = {}) {
    const queryTokens = [...new Set(tokens(query))];
    if (!queryTokens.length) return [];
    return read().map(item => {
      if (item.status !== "active" && !(includeUncertain && item.status === "uncertain")) return null;
      const contentTokens = new Set(tokens(item.content + " " + item.type));
      const matches = queryTokens.filter(token => contentTokens.has(token)).length;
      if (!matches) return null;
      const coverage = matches / queryTokens.length;
      const precision = matches / Math.max(1, contentTokens.size);
      return { ...item, relevance: Number((coverage * 0.75 + precision * 0.25).toFixed(3)) };
    }).filter(Boolean).sort((a, b) => b.relevance - a.relevance || b.updatedAt.localeCompare(a.updatedAt)).slice(0, Math.max(1, Math.min(20, limit)));
  }
  function update(id, patch = {}) {
    const items = read();
    const index = items.findIndex(item => item.id === id);
    if (index < 0) return null;
    const old = items[index];
    const next = { ...old };
    if (patch.content !== undefined) next.content = normalizeText(patch.content);
    if (patch.type !== undefined) {
      if (!TYPES.has(patch.type)) throw new TypeError("Tipo de recuerdo no válido.");
      next.type = patch.type;
    }
    if (patch.confidence !== undefined) next.confidence = safeConfidence(patch.confidence);
    if (patch.status !== undefined) {
      if (!STATUSES.has(patch.status)) throw new TypeError("Estado de recuerdo no válido.");
      next.status = patch.status;
    }
    if (patch.source !== undefined) next.source = normalizeText(patch.source, 160);
    next.updatedAt = now();
    items[index] = next;
    write(items);
    return { ...next };
  }
  function forget(id) {
    const items = read();
    const next = items.filter(item => item.id !== id);
    write(next);
    return next.length !== items.length;
  }
  function list({ status = "active", limit = 100 } = {}) {
    return read().filter(item => status === "all" || item.status === status).slice(-Math.max(1, Math.min(500, limit))).map(item => ({ ...item }));
  }
  function context(query, { limit = 5, maxChars = 1400 } = {}) {
    const found = search(query, { limit });
    let result = "";
    for (const item of found) {
      const line = "- [" + item.type + "; confianza " + Math.round(item.confidence * 100) + "%; fuente " + item.source + "] " + item.content;
      if (result.length + line.length > maxChars) break;
      result += (result ? "\n" : "") + line;
    }
    return result;
  }
  function exportJSON() {
    return JSON.stringify({ format: "ed2-structured-memory", version: 1, memories: read() }, null, 2);
  }
  function importJSON(input, { consent = false } = {}) {
    if (consent !== true) throw new Error("La importación necesita confirmación explícita.");
    const parsed = typeof input === "string" ? JSON.parse(input) : input;
    if (!parsed || parsed.format !== "ed2-structured-memory" || parsed.version !== 1 || !Array.isArray(parsed.memories)) {
      throw new TypeError("Copia de memoria no válida.");
    }
    const current = read();
    const known = new Set(current.map(item => item.id));
    const incoming = parsed.memories.filter(item =>
      item && typeof item.id === "string" && typeof item.content === "string" &&
      TYPES.has(item.type) && typeof item.source === "string" &&
      Number.isFinite(item.confidence) && STATUSES.has(item.status) &&
      typeof item.createdAt === "string" && !known.has(item.id)
    );
    write([...current, ...incoming]);
    return incoming.length;
  }
  return Object.freeze({ remember, search, update, forget, list, context, exportJSON, importJSON });
}
