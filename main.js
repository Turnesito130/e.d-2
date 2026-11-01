/* ev · Arranque: un toque en la esfera */
let pendingShare = false, pendingQ = "";
async function tap() {
  if (!started) {
    started = true;
    $("st").textContent = "te escucho";
    startRec(); startMeter();
    speak("Hola, soy E.D. Te escucho.");
  } else if (pendingShare) {
    pendingShare = false; await shareScreen();
    if (stream) {
      if (pendingQ) { const q = pendingQ; pendingQ = ""; ask(q); }
      askFollow();
    } else showSub("No se compartió la pantalla.");
  } else if (state === "speak") {
    stopVoice(); setState("idle");
  } else openPip();
}
cv.addEventListener("click", tap);
cv.addEventListener("keydown", e => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tap(); }
});
speechSynthesis.onvoiceschanged = () => {};