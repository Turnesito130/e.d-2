/* E.D.-2 · Copias de seguridad, importación y búsqueda de memoria.
   Incluye la memoria antigua, las tarjetas y la memoria estructurada del cerebro. */
function searchMem(q, limit = 5) {
  const words = s => norm(String(s || "")).split(/[^a-z0-9]+/).filter(w => w.length > 2);
  const query = new Set(words(q));
  if (!query.size) return [];
  return memList().map(note => {
    const found = words(note).filter(w => query.has(w)).length;
    return { note, score: found };
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score).slice(0, limit).map(x => x.note);
}
TOOLS.push({
  name: "buscar_memoria",
  description: "Busca notas guardadas que coincidan con una consulta.",
  parameters: { type: "object", properties: { consulta: { type: "string" } }, required: ["consulta"] }
});
const runToolBeforeMemorySearch = runTool;
runTool = async (name, args) => name === "buscar_memoria"
  ? (searchMem(String(args.consulta || "")).join("\n") || "No hay notas relacionadas.")
  : runToolBeforeMemorySearch(name, args);

async function exportarMemoria() {
  try {
    const structuredMemory = await getStructuredMemory();
    const data = {
      format: "ed2-full-backup",
      version: 2,
      fecha: new Date().toISOString(),
      notas: memList(),
      tarjetas: (() => { try { const a = JSON.parse(store.get("ed_cards") || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; } })(),
      memoriaEstructurada: structuredMemory.exportJSON()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url;
    a.download = "copia-ed2-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showSub("Copia completa preparada: memoria antigua, tarjetas y recuerdos estructurados.");
  } catch (error) {
    showSub("No pude crear la copia completa: " + (error?.message || String(error)));
  }
}
function importarMemoria(file) {
  if (!file || file.size > 2 * 1024 * 1024) { showSub("El archivo supera el límite de 2 MB o no es válido."); return; }
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const data = JSON.parse(String(reader.result || ""));
      const legacyFormat = data && data.version === 1 && Array.isArray(data.notas) && Array.isArray(data.tarjetas);
      const fullFormat = data && data.format === "ed2-full-backup" && data.version === 2 &&
        Array.isArray(data.notas) && Array.isArray(data.tarjetas) &&
        typeof data.memoriaEstructurada === "string";
      if (!legacyFormat && !fullFormat) throw new Error("formato");
      if (!window.confirm("¿Quieres importar esta copia y combinarla con los recuerdos actuales? No se borrará la memoria existente.")) return;
      const notes = data.notas.filter(x => typeof x === "string").map(x => x.trim()).filter(Boolean);
      const cards = data.tarjetas.filter(x => x && typeof x.p === "string" && typeof x.r === "string");
      const mergedNotes = [...new Set([...memList(), ...notes])].slice(-100);
      let oldCards = [];
      try { const parsed = JSON.parse(store.get("ed_cards") || "[]"); if (Array.isArray(parsed)) oldCards = parsed; } catch (e) {}
      const mergedCards = [...oldCards, ...cards].slice(-100);
      memSave(mergedNotes);
      store.set("ed_cards", JSON.stringify(mergedCards));
      let structuredCount = 0;
      if (fullFormat) {
        const memory = await getStructuredMemory();
        structuredCount = memory.importJSON(data.memoriaEstructurada, { consent: true });
      }
      showSub("Copia importada: " + mergedNotes.length + " notas antiguas, " + mergedCards.length +
        " tarjetas y " + structuredCount + " recuerdos estructurados nuevos.");
    } catch (e) { showSub("No pude importar: el archivo no tiene un formato válido de copia de E.D.-2. " + (e?.message || "")); }
  };
  reader.onerror = () => showSub("No pude leer el archivo.");
  reader.readAsText(file);
}
const exportButton = document.createElement("button"), importButton = document.createElement("button"), importInput = document.createElement("input");
exportButton.type = importButton.type = "button";
exportButton.className = importButton.className = "sbtn";
exportButton.textContent = "Exportar memoria";
importButton.textContent = "Importar memoria";
importInput.type = "file"; importInput.accept = ".json,application/json"; importInput.hidden = true;
exportButton.addEventListener("click", exportarMemoria);
importButton.addEventListener("click", () => importInput.click());
importInput.addEventListener("change", () => { if (importInput.files && importInput.files[0]) importarMemoria(importInput.files[0]); importInput.value = ""; });
$("save").before(exportButton, importButton, importInput);
