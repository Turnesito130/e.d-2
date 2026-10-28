/* ev · Arranque: un toque en la esfera */
/* ---------- Un solo toque ---------- */
async function tap() {
  if (!started) {
    started = true; $("st").textContent = "te escucho";
    await shareScreen(); startRec();
    if (store.get("ed_brain") === "local") loadLocal().catch(e => showSub("Cerebro local: " + e.message));
    speak(store.get("ed_k1") ? "Hola, soy ev. Te escucho." : "Hola, soy ev. Primero necesito tu clave de Gemini.");
    if (!store.get("ed_k1")) openSet();
  } else if (state === "speak") { stopVoice(); setState("idle"); }
  else if (!stream) { await shareScreen(); }
  else { openPip(); }
}
cv.addEventListener("click", tap);
cv.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tap(); } });
speechSynthesis.onvoiceschanged = () => {};
