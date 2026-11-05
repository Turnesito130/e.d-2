/* E.D.-2 · Modo guía honesto: guía tareas descritas por texto; no simula visión. */
let guideUntil = 0;
const GUIA_RE = /(como (compro|hago|se hace|puedo|creo|subo|instalo|busco|pago|me registro|saco|abro|configuro)|ayudame (a|con)|guiame|paso a paso|ensename como|explicame como)/;
const GUIA_SCREEN_RE = /(?:mira|lee|describe|analiza|interpreta|que aparece|que pone|que ves).{0,45}(?:pantalla|captura|imagen|ventana|documento|pagina)|(?:pantalla|captura|imagen|ventana|documento|pagina).{0,45}(?:mira|lee|describe|analiza|interpreta|que pone|que aparece)/i;
const GUIA = " MODO GUÍA: acompaña al usuario paso a paso usando únicamente lo que describa por texto. No afirmes ver su pantalla ni inventes botones o estados. Si faltan detalles, pregunta qué aparece. Da un solo paso cada vez y espera «listo» o «siguiente».";
const sysBase = typeof sysFull === "function" ? sysFull : () => SYS;
sysFull = () => sysBase() + (Date.now() < guideUntil ? GUIA : "");
const wantsBase = wantsScreen.test.bind(wantsScreen);
wantsScreen.test = t => wantsBase(t);
const hookBase = commandHook;
commandHook = async (text, byText) => {
  const n = norm(text);
  if (GUIA_SCREEN_RE.test(n)) {
    return reply(text, "Todavía no puedo interpretar capturas ni ver el contenido de tu pantalla: el motor visual de E.D. aún no está implementado. Descríbeme lo que aparece o copia aquí el texto y te guiaré paso a paso.", byText);
  }
  if (GUIA_RE.test(n)) guideUntil = Date.now() + 6e5;
  if (/(termine|ya esta todo|sal de la guia|para la guia|deja la guia)/.test(n)) guideUntil = 0;
  return hookBase(text, byText);
};
