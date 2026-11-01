/* ev · Arranque y controles principales */
let pendingShare = false, pendingQ = "";
function toggleSettings() {
  const panel = $("set");
  if (!panel) return;
  panel.style.display = panel.style.display === "block" ? "none" : "block";
  if (panel.style.display === "block") {
    const first = $("k2"); if (first) first.focus();
  }
}
function toggleChat() {
  const panel = $("chat");
  if (!panel) return;
  panel.classList.toggle("open");
  if (panel.classList.contains("open") && $("cin")) $("cin").focus();
}
function bindControls() {
  const cfg = $("bCfg"), txt = $("bTxt");
  if (cfg) cfg.onclick = toggleSettings;
  if (txt) txt.onclick = toggleChat;
}
bindControls();

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