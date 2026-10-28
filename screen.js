/* ev · Compartir pantalla y ventana flotante */
/* ---------- Pantalla ---------- */
const vid = document.createElement("video"); vid.muted = true; vid.playsInline = true;
async function shareScreen() {
  try {
    stream = await navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: "monitor" }, audio: false, selfBrowserSurface: "exclude", monitorTypeSurfaces: "include" });
    vid.srcObject = stream; await vid.play();
    stream.getVideoTracks()[0].onended = () => { stream = null; };
    return true;
  } catch (e) { stream = null; return false; }
}
async function frame() {
  let src = null, sw = 0, sh = 0;
  try {
    if (window.ImageCapture) { src = await new ImageCapture(stream.getVideoTracks()[0]).grabFrame(); sw = src.width; sh = src.height; }
  } catch (e) { src = null; }
  if (!src) { src = vid; sw = vid.videoWidth || 1280; sh = vid.videoHeight || 720; }
  const c = document.createElement("canvas"), w = Math.min(1280, sw);
  c.width = w; c.height = Math.round(sh * w / sw);
  c.getContext("2d").drawImage(src, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", .6).split(",")[1];
}
const wantsScreen = /pantalla|mira|ves |ver |esto|aqu[ií]|d[oó]nde|pulso|clic|click|error|ayuda|leer?|dice/i;

/* ---------- Ventana flotante ---------- */
async function openPip() {
  if (pip) { pip.win.close(); return; }
  if (!("documentPictureInPicture" in window)) { showSub("Tu Chrome no permite la ventana flotante."); return; }
  try {
    const win = await documentPictureInPicture.requestWindow({ width: 300, height: 380 });
    const d = win.document;
    d.head.innerHTML = '<meta charset="utf-8"><title>ev</title>';
    const css = d.createElement("style");
    css.textContent = "html,body{margin:0;height:100%;background:#050302;color:#f6ead6;font-family:'Exo 2','Segoe UI',system-ui,sans-serif;overflow:hidden}canvas{position:absolute;left:0;top:0;width:100%;height:60%}#s{position:absolute;left:0;right:0;bottom:0;height:40%;padding:6px 14px;text-align:center;font-weight:300;font-size:15px;line-height:1.4;overflow:hidden;text-shadow:0 0 12px rgba(255,150,40,.35)}";
    d.head.appendChild(css);
    const c = d.createElement("canvas"), sub = d.createElement("div"); sub.id = "s";
    d.body.append(c, sub);
    pip = { win, sub, cx: c.getContext("2d") };
    sub.textContent = $("sub").textContent; sub.style.opacity = $("sub").style.opacity || 1;
    const pd = win.devicePixelRatio || 1;
    const loop = t => {
      if (!pip || pip.win !== win) return;
      const w = win.innerWidth, h = win.innerHeight * .6;
      if (c.width !== Math.round(w * pd) || c.height !== Math.round(h * pd)) { c.width = Math.round(w * pd); c.height = Math.round(h * pd); }
      step(t); render(pip.cx, w, h, pd, t, .5, .5, Math.min(w, h) * .3);
      win.requestAnimationFrame(loop);
    };
    win.requestAnimationFrame(loop);
    win.addEventListener("click", () => { if (state === "speak") { stopVoice(); setState("idle"); } });
    win.addEventListener("pagehide", () => { pip = null; });
    showSub("Me quedo aquí flotando. Cambia de pestaña y dime lo que necesites.");
  } catch (e) { pip = null; showSub("No pude abrir la ventana flotante."); }
}
try { navigator.mediaSession.setActionHandler("enterpictureinpicture", () => { if (!pip) openPip(); }); } catch (e) {}
