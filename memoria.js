/* ev · Memoria y modo estudio */
const memList = () => { try { return JSON.parse(store.get("ed_mem") || "[]"); } catch (e) { return []; } };
const memSave = a => store.set("ed_mem", JSON.stringify(a.slice(-40)));
let study = store.get("ed_study") === "1";
function setStudy(on) { study = on; store.set("ed_study", on ? "1" : "0"); }
function sysFull() {
  const m = memList();
    return SYS + " Tienes acciones propias: abrir páginas (youtube, gmail, classroom, drive, calendario, github, spotify, whatsapp, maps, wikipedia, traductor), temporizadores, calculadora y anotar cosas. Si el usuario te lo pide con otras palabras, dile que lo diga así: «abre youtube», «temporizador de 5 minutos», «cuánto es 5 por 3», «anota que…». Nunca digas que no puedes abrir páginas." + (m.length
    (study ? " MODO ESTUDIO: eres tutora de ingeniería mecatrónica. Explica paso a paso con ejemplos prácticos y analogías sencillas, y termina con una pregunta corta para comprobar que lo ha entendido. Si ayuda ver un componente o un esquema, pon la línea de imágenes." : "");
}
