/* ev · Arranque: un toque en la esfera */
let pendingShare = false, pendingQ = "";
async function tap() {
  if (!started) {
    started = true; $("st").textContent = "te escucho"; startRec();
    if (store.get("ed_brain") === "local") loadLocal().catch(e => showSub("Cerebro local: " + e.message));
    speak(store.get("ed_k1") ? "Hola, soy ev. Te escucho." : "Hola, soy ev. Primero necesito tu clave de Gemini.");
    if (!store.get("ed_k1")) openSet();
  } else if (pendingShare) {
    pendingShare = false; await shareScreen();
    if (stream && pendingQ) { const q = pendingQ; pendingQ = ""; ask(q); } else showSub(stream ? "Ya veo tu pantalla." : "No se compartió la pantalla.");
  } else if (state === "speak") { stopVoice(); setState("idle"); }
  else openPip();
}
cv.addEventListener("click", tap);
cv.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tap(); } });
speechSynthesis.onvoiceschanged = () => {};
