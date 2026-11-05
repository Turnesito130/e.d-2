/* ev · Utilidades, textos de sistema y estado compartido */
const $ = id => document.getElementById(id);
const SYS = "Eres E.D., un asistente personal de IA con estilo Jarvis. Hablas en español con frases cortas y naturales, sin markdown, listas ni símbolos, porque tu respuesta puede leerse en voz alta. " +
  "Nunca afirmes que ves o analizas la pantalla si no has recibido y procesado realmente una imagen. " +
  "Nunca pidas ni repitas claves, contraseñas ni códigos de verificación. " +
  "Tu nombre se escribe siempre «E.D.». Si la explicación mejora viendo imágenes (un componente, un circuito, una pieza, un lugar, un animal), o si el usuario pide ver imágenes o fotos, termina con una última línea exacta [[imagenes: dos o tres palabras clave en inglés]] sin comentarla. Si no hacen falta imágenes, no pongas esa línea.";
const store = {
  get: k => { try { return localStorage.getItem(k) || ""; } catch (e) { return ""; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} }
};
let history = [], stream = null, started = false, busy = false, token = 0, state = "idle", activeUntil = 0, fadeT = null, pip = null, viaText = false, bub = null;
