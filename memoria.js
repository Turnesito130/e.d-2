/* ev · Memoria local-first y modo estudio */
const memList = () => {
  try {
    const v = JSON.parse(store.get("ed_mem") || "[]");
    return Array.isArray(v) ? v.filter(x => typeof x === "string").slice(-40) : [];
  } catch (e) { return []; }
};
const memSave = a => store.set("ed_mem", JSON.stringify(a.filter(x => typeof x === "string" && x.trim()).map(x => x.trim()).slice(-40)));
let study = store.get("ed_study") === "1";
function setStudy(on) { study = !!on; store.set("ed_study", study ? "1" : "0"); }
function sysFull() {
  const m = memList();
  const memoryText = m.length ? " Recuerdos guardados: " + m.join(" | ") : "";
  const studyText = study ? " MODO ESTUDIO: explica paso a paso con ejemplos prácticos y termina con una pregunta breve para comprobar comprensión." : "";
  return SYS + memoryText + studyText;
}

/* Copia portable: no incluye claves, tokens ni ajustes privados. */
function exportMemoryBackup() {
  const backup = {
    app: "E.D.-2",
    format: 1,
    exportedAt: new Date().toISOString(),
    memories: memList(),
    studyMode: study
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ed-memoria-" + new Date().toISOString().slice(0, 10) + ".json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return backup.memories.length;
}

async function importMemoryBackup(file) {
  if (!file || file.size > 1024 * 1024) throw new Error("El archivo supera el límite de 1 MB.");
  const data = JSON.parse(await file.text());
  if (!data || data.app !== "E.D.-2" || data.format !== 1 || !Array.isArray(data.memories)) {
    throw new Error("El archivo no es una copia válida de la memoria de E.D.-2.");
  }
  const incoming = data.memories.filter(x => typeof x === "string" && x.trim()).map(x => x.trim());
  const merged = [...new Set([...memList(), ...incoming])].slice(-40);
  memSave(merged);
  if (typeof data.studyMode === "boolean") setStudy(data.studyMode);
  return { imported: incoming.length, total: merged.length };
}
