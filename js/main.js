/* ev · Arranque: un toque en la esfera */
let pendingShare = false, pendingQ = "";
async function tap() {
  if (!started) {
    started = true; $("st").textContent = "te escucho"; startRec(); startMeter();
    if (store.get("ed_brain") === "local") loadLocal().catch(e => showSub("Cerebro local: " + e.message));
    speak(store.get("ed_k1") ? "Hola, soy E.D. Te escucho." : "Hola, soy E.D. Primero necesito tu clave de Gemini.");
    if (!store.get("ed_k1")) openSet();
  } else if (pendingShare) {
    pendingShare = false; await shareScreen();
    if (stream) { if (pendingQ) { const q = pendingQ; pendingQ = ""; ask(q); } askFollow(); } else showSub("No se compartió la pantalla.");
  } else if (state === "speak") { stopVoice(); setState("idle"); }
  else openPip();
}
cv.addEventListener("click", tap);
cv.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tap(); } });
speechSynthesis.onvoiceschanged = () => {};
