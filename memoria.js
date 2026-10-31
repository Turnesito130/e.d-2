/* ev · Memoria y modo estudio */
const memList = () => {
  try {
    const value = JSON.parse(store.get("ed_mem") || "[]");
    return Array.isArray(value) ? value.filter(x => typeof x === "string") : [];
  } catch (e) { return []; }
};
const memSave = notes => {
  const safe = Array.isArray(notes) ? notes.filter(x => typeof x === "string").map(x => x.trim()).filter(Boolean) : [];
  store.set("ed_mem", JSON.stringify(safe.slice(-100)));
};
let study = store.get("ed_study") === "1";
function setStudy(on) { study = !!on; store.set("ed_study", study ? "1" : "0"); }
function sysFull() {
  const memories = memList().slice(-15);
  const memoryText = memories.length ? " Recuerdos relevantes guardados: " + memories.join(" | ") + "." : "";
  const actions = " Tienes acciones propias: abrir páginas (youtube, gmail, classroom, drive, calendario, github, spotify, whatsapp, maps, wikipedia, traductor), temporizadores, calculadora y anotar cosas. Si el usuario te lo pide con otras palabras, interpreta su intención y usa las herramientas disponibles. Nunca afirmes que has abierto una página si la acción no se ha realizado.";
  const studyMode = study ? " MODO ESTUDIO: eres tutora de ingeniería mecatrónica. Explica paso a paso con ejemplos prácticos y analogías sencillas, y termina con una pregunta corta para comprobar que lo ha entendido. Si ayuda ver un componente o un esquema, pon la línea de imágenes." : "";
  return SYS + actions + memoryText + studyMode;
}
