/* E.D.-2 · Arranque local */
let pendingShare = false, pendingQ = "";
async function tap() {
  if (!started) {
    started = true; $("st").textContent = "te escucho"; startRec(); startMeter();
    loadEDLocalModel().then(b => showSub(b ? "Cerebro propio cargado y listo." : "Modo local activo; el cerebro propio no se ha podido activar.")).catch(e => showSub("No se pudo activar el cerebro propio: " + e.message));
    speak("Hola, soy E.D. Funcionando en modo local. Te escucho.");
  } else if (pendingShare) {
    pendingShare = false; await shareScreen();
    if (stream) { if (pendingQ) { const q = pendingQ; pendingQ = ""; ask(q); } askFollow(); } else showSub("No se compartió la pantalla.");
  } else if (state === "speak") { stopVoice(); setState("idle"); }
  else openPip();
}
cv.addEventListener("click", tap);
cv.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tap(); } });
speechSynthesis.onvoiceschanged = () => {};
