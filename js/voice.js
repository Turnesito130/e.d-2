/* ev · Voz de salida (ElevenLabs o navegador) y micrófono */
/* ---------- Voz de salida ---------- */
let chain = Promise.resolve(), audio = null;
function stopVoice() { token++; chain = Promise.resolve(); if (audio) { audio.pause(); audio = null; } speechSynthesis.cancel(); }
function pickVoice() {
  const v = speechSynthesis.getVoices().filter(x => /^es/i.test(x.lang));
  return v.find(x => /female|mujer|paulina|helena|sabina|monica|elena|google español/i.test(x.name)) || v[0];
}
function speak(raw) {
  const t = raw.replace(/[*_`#>]/g, "").trim(); if (!t || viaText) return;
  const my = token, k = store.get("ed_k2"), v = store.get("ed_vid");
  if (k && v) {
    const p = fetch("https://api.elevenlabs.io/v1/text-to-speech/" + encodeURIComponent(v) + "?output_format=mp3_44100_64", {
      method: "POST", headers: { "xi-api-key": k, "Content-Type": "application/json" },
      body: JSON.stringify({ text: t, model_id: "eleven_flash_v2_5" })
    }).then(r => r.ok ? r.blob() : Promise.reject(new Error("ElevenLabs " + r.status))).then(b => URL.createObjectURL(b)).catch(e => { showSub(e.message); return null; });
    chain = chain.then(async () => {
      const url = await p; if (!url || my !== token) return;
      setState("speak");
      await new Promise(res => { audio = new Audio(url); audio.onended = audio.onerror = res; audio.play().catch(res); });
      if (my === token) doneSpeaking();
    });
  } else {
    const u = new SpeechSynthesisUtterance(t); u.lang = "es-ES"; u.rate = 1.08;
    const vo = pickVoice(); if (vo) u.voice = vo;
    u.onstart = () => setState("speak");
    u.onend = () => { if (!speechSynthesis.speaking) doneSpeaking(); };
    speechSynthesis.speak(u);
  }
}
function doneSpeaking() { activeUntil = Date.now() + 25000; setState("idle"); }

/* ---------- Micrófono siempre atento ---------- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null, paused = false;
const wake = /^\s*(hey|oye|ok|hola)?\s*,?\s*(ev|eve|ebe|ed|e\.?d\.?|e de|ede|eb)\b[\s,.:!?]*/i;
const norm = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
function handle(raw) {
  viaText = false;
  let text = raw.trim(), woke = false;
  const m = text.match(wake); if (m) { woke = true; text = text.slice(m[0].length).trim(); }
  if (!woke && Date.now() > activeUntil) return;
  const n = norm(text);
  if (woke && !text) { activeUntil = Date.now() + 25000; stopVoice(); speak("Dime."); return; }
  if (/\bajustes\b/.test(n)) { openSet(); return; }
  if (/(quita|cierra|oculta|esconde)\s+(las\s+)?(imagenes|fotos)/.test(n)) { hideImages(); return; }
  if (/(deja de|para de) (mirar|compartir|ver)/.test(n)) { if (stream) stream.getTracks().forEach(t => t.stop()); stream = null; speak("Hecho, ya no veo tu pantalla."); return; }
  if (/(borra|olvida) (la )?(conversacion|chat)/.test(n)) { history = []; speak("Conversación borrada."); return; }
  if (!text) return;
  activeUntil = Date.now() + 25000; ask(text);
}
function startRec() {
  if (!SR) { showSub("Este navegador no permite escuchar. Usa Chrome."); return; }
  if (rec) return;
  rec = new SR(); rec.lang = "es-ES"; rec.continuous = true; rec.interimResults = false;
  rec.onstart = () => { if (state === "idle") $("st").textContent = "te escucho"; };
  rec.onresult = e => { for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) handle(e.results[i][0].transcript); };
  rec.onerror = e => { if (e.error === "not-allowed") showSub("Permite el micrófono en Chrome."); };
  rec.onend = () => { rec = null; if (started && !paused) setTimeout(startRec, 250); };
  try { rec.start(); } catch (e) { rec = null; }
}
function pauseRec() { paused = true; if (rec) try { rec.stop(); } catch (e) {} }
function resumeRec() { if (!paused) return; paused = false; if (started) startRec(); }
