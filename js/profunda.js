/* E.D.-2 · Panel de investigación. No invoca servicios de IA externos. */
let deepOn = false;
function deepResearch(topic) {
  showSub("La investigación asistida está desactivada: E.D.-2 ya no envía consultas a servicios de IA. Puedes abrir una búsqueda web normal.");
  openUrl("https://www.google.com/search?q=" + encodeURIComponent(topic), "buscar el tema");
}
const hookDeep = commandHook;
commandHook = async (text, byText) => {
  const m = text.match(/^\s*(?:haz(?:me)? (?:una )?)?(?:investigaci[oó]n profunda|investiga(?: a fondo| en profundidad)?)\s*(?:sobre|de|del|acerca de)?\s*(.+)?$/i);
  if (m) { if (m[1]) deepResearch(m[1].trim()); else reply(text, "¿Sobre qué quieres buscar información?", byText); return true; }
  return hookDeep(text, byText);
};
