/* ev · Modo guía paso a paso (y arreglo de sysFull) */
let guideUntil = 0;
const GUIA_RE = /(como (compro|hago|se hace|puedo|creo|subo|instalo|busco|pago|me registro|saco|abro|configuro)|ayudame (a|con)|guiame|paso a paso|ensename como|explicame como)/;
const GUIA = " MODO GUÍA: el usuario está haciendo una tarea en su pantalla (comprar, usar GitHub, etc.). Mira la captura y da SOLO el siguiente paso, en una frase corta que empiece por «Paso 1:», «Paso 2:»…, diciendo exactamente dónde pulsar. Espera a que diga «listo» o «siguiente» antes del siguiente paso. Si dice «terminé» o «ya está», felicítalo y sal de la guía.";
const sysBase = typeof sysFull === "function" ? sysFull : () => SYS;
sysFull = () => sysBase() + (Date.now() < guideUntil ? GUIA : "");
const wantsBase = wantsScreen.test.bind(wantsScreen);
wantsScreen.test = t => {
  const n = norm(t);
  if (GUIA_RE.test(n)) guideUntil = Date.now() + 6e5;
  if (/(termine|ya esta todo|sal de la guia|para la guia|deja la guia)/.test(n)) guideUntil = 0;
  return Date.now() < guideUntil || wantsBase(t);
};
const hookBase = commandHook;
commandHook = async (text, byText) => {
  const n = norm(text);
  if (!stream && (GUIA_RE.test(n) || /\bpantalla\b/.test(n))) {
    pendingShare = true; pendingQ = text;
    return reply(text, "Para verlo necesito tu pantalla. Toca la esfera y elige Toda la pantalla; yo sigo con tu pregunta.", byText);
  }
  return hookBase(text, byText);
};
