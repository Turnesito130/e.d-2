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
/* Solo marca peticiones explícitas de inspección visual. El cerebro actual es texto; no se debe fingir que analiza capturas. */
const wantsScreen = /(?:mira|lee|describe|analiza|interpreta|que aparece|que pone|que ves).{0,45}(?:pantalla|captura|imagen|ventana|documento|pagina)|(?:pantalla|captura|imagen|ventana|documento|pagina).{0,45}(?:mira|lee|describe|analiza|interpreta|que pone|que aparece)/i;

/* ---------- Ventana flotante: implementada en jarvis.js ---------- */
try { navigator.mediaSession.setActionHandler("enterpictureinpicture", () => { if (!pip) openPip(); }); } catch (e) {}
