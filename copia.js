/* ev · Copias de seguridad, importación y búsqueda de memoria */
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

function exportarMemoria() {
  const data = {
    version: 1,
    fecha: new Date().toISOString(),
    notas: memList(),
    tarjetas: (() => { try { const a = JSON.parse(store.get("ed_cards") || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; } })()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob), a = document.createElement("a");
  a.href = url;
  a.download = "copia-ev-" + new Date().toISOString().slice(0, 10) + ".json";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function importarMemoria(file) {
  if (!file || file.size > 2 * 1024 * 1024) { showSub("El archivo supera el límite de 2 MB o no es válido."); return; }
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result || ""));
      if (!data || data.version !== 1 || !Array.isArray(data.notas) || !Array.isArray(data.tarjetas)) throw new Error("formato");
      const notes = data.notas.filter(x => typeof x === "string").map(x => x.trim()).filter(Boolean);
      const cards = data.tarjetas.filter(x => x && typeof x.p === "string" && typeof x.r === "string");
      const mergedNotes = [...new Set([...memList(), ...notes])].slice(-100);
      let oldCards = [];
      try { const parsed = JSON.parse(store.get("ed_cards") || "[]"); if (Array.isArray(parsed)) oldCards = parsed; } catch (e) {}
      const mergedCards = [...oldCards, ...cards].slice(-100);
      memSave(mergedNotes);
      store.set("ed_cards", JSON.stringify(mergedCards));
      showSub("Copia importada: " + mergedNotes.length + " notas y " + mergedCards.length + " tarjetas.");
    } catch (e) { showSub("No pude importar: el archivo no tiene el formato de una copia de ev."); }
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
