/* ev · Memoria persistente y modo estudio */
const memList = () => {
  try { const v = JSON.parse(store.get("ed_mem") || "[]"); return Array.isArray(v) ? v : []; }
  catch (e) { return []; }
};
const memSave = a => store.set("ed_mem", JSON.stringify(a.slice(-40)));
let study = store.get("ed_study") === "1";
function setStudy(on) { study = !!on; store.set("ed_study", study ? "1" : "0"); }
function sysFull() {
  const m = memList();
  const memoryText = m.length ? " Recuerdos guardados: " + m.map(x => typeof x === "string" ? x : JSON.stringify(x)).join(" | ") : "";
  const studyText = study ? " MODO ESTUDIO: explica paso a paso con ejemplos prácticos y termina con una pregunta breve para comprobar comprensión." : "";
  return SYS + memoryText + studyText;
};
