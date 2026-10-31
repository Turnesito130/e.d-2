/* ev · Selección de voz del navegador */
function vocesEspanol() {
  return speechSynthesis.getVoices().filter(v => /^es/i.test(v.lang));
}
const pickVoiceAnterior = pickVoice;
pickVoice = () => {
  const selected = store.get("ed_voice");
  return vocesEspanol().find(v => v.name === selected) || pickVoiceAnterior();
};
function cambiarVoz() {
  const voices = vocesEspanol();
  if (!voices.length) { showSub("Chrome todavía no ha cargado voces en español. Inténtalo en unos segundos."); return; }
  const current = store.get("ed_voice"), index = voices.findIndex(v => v.name === current), next = voices[(index + 1) % voices.length];
  store.set("ed_voice", next.name);
  showSub("Voz seleccionada: " + next.name);
  speak("Esta es mi nueva voz.");
}
const commandHookAntesVoz = commandHook;
commandHook = async (text, byText) => {
  const n = norm(text);
  if (/\b(cambia|cambiar|elige|selecciona) (de )?voz\b/.test(n)) { cambiarVoz(); return true; }
  if (/\b(que voz tengo|voz actual)\b/.test(n)) {
    const selected = store.get("ed_voice");
    return reply(text, selected || ((pickVoice() || {}).name) || "La voz predeterminada del navegador.", byText);
  }
  return commandHookAntesVoz(text, byText);
};
speechSynthesis.addEventListener && speechSynthesis.addEventListener("voiceschanged", () => {});
