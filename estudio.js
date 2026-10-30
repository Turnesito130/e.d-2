/* ev · Estudio (tarjetas, pomodoro) y memoria más lista */
TOOLS.push(
  { name: "guardar_tarjeta", description: "Guarda una tarjeta de estudio (pregunta y respuesta) para repasar después.", parameters: { type: "object", properties: { pregunta: { type: "string" }, respuesta: { type: "string" } }, required: ["pregunta", "respuesta"] } },
  { name: "sacar_tarjeta", description: "Devuelve una tarjeta de estudio al azar para preguntársela al usuario." },
  { name: "olvidar", description: "Borra de la memoria las notas que contengan un texto.", parameters: { type: "object", properties: { texto: { type: "string" } }, required: ["texto"] } },
  { name: "pomodoro", description: "Inicia un ciclo Pomodoro: 25 minutos de estudio y 5 de descanso, con avisos por voz." }
);
function pomo() {
  const say = t => { viaText = false; showSub(t); speak(t); };
  say("Empieza el pomodoro. Veinticinco minutos de estudio.");
  setTimeout(() => { say("Descanso de cinco minutos."); setTimeout(() => say("Se acabó el descanso. Cuando quieras, otra ronda."), 3e5); }, 15e5);
}
const toolBase = runTool;
runTool = async (n, a) => {
  const cards = () => { try { return JSON.parse(store.get("ed_cards") || "[]"); } catch (e) { return []; } };
  if (n === "guardar_tarjeta") { const c = cards(); c.push({ p: a.pregunta, r: a.respuesta }); store.set("ed_cards", JSON.stringify(c.slice(-100))); return "Tarjeta guardada. Total: " + Math.min(c.length, 100); }
  if (n === "sacar_tarjeta") { const c = cards(); return c.length ? JSON.stringify(c[Math.floor(Math.random() * c.length)]) : "No hay tarjetas guardadas todavía."; }
  if (n === "olvidar") { const t = norm(String(a.texto || "")), m = memList(), r = m.filter(x => !norm(x).includes(t)); memSave(r); return "Borradas " + (m.length - r.length) + " notas."; }
  if (n === "pomodoro") { pomo(); return "Pomodoro iniciado: 25 minutos de estudio."; }
  return toolBase(n, a);
};
const sysPrev = sysFull;
sysFull = () => sysPrev() + " Memoria: si el usuario cuenta algo duradero (horario, exámenes, proyectos, gustos), llama a la herramienta anotar sin que lo pida, con una frase corta; no anotes cosas triviales. Tarjetas y tests: usa guardar_tarjeta y sacar_tarjeta, y pregunta UNA cosa cada vez, esperando su respuesta antes de corregir. Resúmenes: si pide resumir lo que ve, resume la captura.";
const wantsPrev = wantsScreen.test;
wantsScreen.test = t => wantsPrev(t) || /resum(e|ir|en)|apuntes/.test(norm(t));
