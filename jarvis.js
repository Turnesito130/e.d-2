/* ev · Interfaz Jarvis (página y ventana flotante), color y volumen del micrófono */
const THEMES = { cian: [80, 215, 250], ambar: [255, 179, 71], verde: [90, 240, 190] };
let micLevel = 0;
const rgb = a => "rgba(" + (THEMES[store.get("ed_theme")] || THEMES.cian) + "," + a + ")";
function applyTheme() {
  const t = THEMES[store.get("ed_theme")] || THEMES.cian, b = "rgba(" + t + ",.35)";
  let s = document.getElementById("themecss"); if (!s) { s = document.createElement("style"); s.id = "themecss"; document.head.appendChild(s); }
  s.textContent = ":root{--amber:rgb(" + t + ");--ember:rgb(" + t + ");--bone:#e8fbff;--dim:rgba(" + t + ",.65)}html,body{background:#010a10}#set,#chat,#bar,#rep{background:rgba(2,14,22,.96)!important;border-color:" + b + "!important}input,select{background:#010a10!important;border-color:" + b + "!important;color:#e8fbff!important}#dock button{background:rgba(2,14,22,.75)!important;border-color:" + b + "!important}.cm.u{background:rgba(" + t + ",.18)!important}.cm.e{background:#020e16!important;border-color:" + b + "!important}#gal a{border-color:" + b + "!important}#save,#cform button,#bar button{color:#021018!important}";
}
applyTheme();
async function startMeter() {
  try {
    const s = await navigator.mediaDevices.getUserMedia({ audio: true }), ac = new AudioContext(), an = ac.createAnalyser(); an.fftSize = 256;
    ac.createMediaStreamSource(s).connect(an); const buf = new Uint8Array(an.fftSize);
    (function lp() { an.getByteTimeDomainData(buf); let q = 0; for (const v of buf) { const x = (v - 128) / 128; q += x * x; } micLevel += (Math.min(1, Math.sqrt(q / buf.length) * 4) - micLevel) * .3; setTimeout(lp, 50); })();
  } catch (e) {}
}
function jarvis(c, w, h, d, t, fx, fy, R) {
  t /= 1000; const k = calm ? .3 : 1, e = Math.min(1, energy + micLevel * .8), cx = w * fx, cy = h * fy, rot = t * .15 * k;
  c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, w, h);
  const g = c.createRadialGradient(cx, cy, R * .2, cx, cy, Math.max(w, h) * .8);
  g.addColorStop(0, rgb(.16 + e * .08)); g.addColorStop(1, "rgba(0,8,14,0)"); c.fillStyle = g; c.fillRect(0, 0, w, h);
  if (w > 420) { c.strokeStyle = rgb(.05); c.lineWidth = 1; c.beginPath(); for (let x = cx % 56; x < w; x += 56) { c.moveTo(x, 0); c.lineTo(x, h); } for (let y = cy % 56; y < h; y += 56) { c.moveTo(0, y); c.lineTo(w, y); } c.stroke(); }
  const ring = (r, lw, col, a0, a1) => { c.beginPath(); c.arc(cx, cy, r, a0 || 0, a1 === undefined ? 6.2832 : a1); c.lineWidth = lw; c.strokeStyle = col; c.stroke(); };
  ring(R, 2, rgb(.9)); ring(R * .93, 1, rgb(.45)); c.lineWidth = 1.5;
  for (let i = 0; i < 72; i++) {
    const a = i / 72 * 6.2832 + rot, big = i % 6 === 0, r0 = R * .93, r1 = R * (big ? .86 : .9);
    c.beginPath(); c.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); c.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); c.strokeStyle = rgb(big ? .9 : .5); c.stroke();
  }
  for (let i = 0; i < 8; i++) { const a = i * .785 - rot * 1.6; ring(R * .8, 3, rgb(.35 + e * .3), a, a + .5); }
  for (let i = 0; i < 3; i++) { const a = -rot * 2 + i * 2.09; ring(R * .66, R * .1, rgb(.22 + e * .3), a, a + 1.5); }
  ring(R * .74, 1, rgb(.6)); ring(R * .58, 1.5, rgb(.7)); ring(R * .53, 2, "rgba(255,200,60,.85)", -1.2 + rot * 3, -.2 + rot * 3);
  const dg = c.createRadialGradient(cx, cy, 0, cx, cy, R * .5); dg.addColorStop(0, rgb(.3 + e * .25)); dg.addColorStop(1, "rgba(2,20,35,.92)");
  c.fillStyle = dg; c.beginPath(); c.arc(cx, cy, R * .5, 0, 6.2832); c.fill(); ring(R * .5 + (state === "speak" ? 3 * Math.sin(t * 9) : 0), 2, rgb(.85));
  c.save(); c.shadowColor = rgb(.9); c.shadowBlur = 8 + e * 14; c.fillStyle = "#e8fbff"; c.textAlign = "center"; c.textBaseline = "middle";
  c.font = "600 " + Math.round(R * .2) + "px 'Exo 2','Segoe UI',sans-serif"; c.fillText("E.D", cx, cy); c.restore();
}
function loopMain(t) {
  step(t);
  const m = Math.min(W, H * 1.2) * .27, o = m * .32;
  const tk = imgMode ? .32 : 1, tx = imgMode ? 1 - (o + 24) / W : .5, ty = imgMode ? (o + 56) / H : .42;
  Lk += (tk - Lk) * .08; Lx += (tx - Lx) * .08; Ly += (ty - Ly) * .08;
  jarvis(ctx, W, H, dpr, t, Lx, Ly, m * Lk);
  requestAnimationFrame(loopMain);
}
async function openPip() {
  if (pip) { pip.win.close(); return; }
  if (!("documentPictureInPicture" in window)) { showSub("Tu Chrome no permite la ventana flotante."); return; }
  try {
    const win = await documentPictureInPicture.requestWindow({ width: 230, height: 230 });
    const d = win.document; d.head.innerHTML = '<meta charset="utf-8"><title>E.D</title>';
    const css = d.createElement("style");
    css.textContent = "html,body{margin:0;height:100%;background:#010a10;overflow:hidden;font-family:'Segoe UI',system-ui,sans-serif}canvas{position:absolute;inset:0;width:100%;height:100%}#s{position:absolute;left:0;right:0;bottom:0;padding:16px 10px 8px;text-align:center;font-size:13px;line-height:1.3;color:#e8fbff;background:linear-gradient(transparent,rgba(1,10,16,.92));transition:opacity .8s;max-height:55%;overflow:hidden}";
    d.head.appendChild(css);
    const c = d.createElement("canvas"), sub = d.createElement("div"); sub.id = "s"; d.body.append(c, sub);
    pip = { win, sub, cx: c.getContext("2d") }; sub.textContent = $("sub").textContent; sub.style.opacity = $("sub").style.opacity || 0;
    const pd = win.devicePixelRatio || 1;
    const loop = t => {
      if (!pip || pip.win !== win) return;
      const w = win.innerWidth, h = win.innerHeight;
      if (c.width !== Math.round(w * pd) || c.height !== Math.round(h * pd)) { c.width = Math.round(w * pd); c.height = Math.round(h * pd); }
      step(t); jarvis(pip.cx, w, h, pd, t, .5, .5, Math.min(w, h) * .46); win.requestAnimationFrame(loop);
    };
    win.requestAnimationFrame(loop);
    win.addEventListener("click", () => { if (state === "speak") { stopVoice(); setState("idle"); } });
    win.addEventListener("pagehide", () => { pip = null; });
  } catch (e) { pip = null; showSub("No pude abrir la ventana flotante."); }
}
try { navigator.mediaSession.setActionHandler("enterpictureinpicture", null); } catch (e) {}
function askFollow() {
  if (pip || store.get("ed_follow") === "no") return;
  const old = $("toast"); if (old) old.remove();
  const d = document.createElement("div"); d.id = "toast";
  d.style.cssText = "position:fixed;top:48px;left:50%;transform:translateX(-50%);z-index:6;background:rgba(2,14,22,.96);border:1px solid var(--amber);border-radius:12px;padding:12px 16px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;color:#e8fbff";
  d.innerHTML = "<span>¿Quieres que te acompañe en una ventana pequeña?</span>";
  [["Sí", () => openPip()], ["No", null], ["No preguntar más", () => store.set("ed_follow", "no")]].forEach(([l, f]) => {
    const b = document.createElement("button"); b.textContent = l; b.style.cssText = "background:transparent;color:var(--amber);border:1px solid var(--amber);border-radius:8px;padding:6px 10px;cursor:pointer;font:inherit";
    b.onclick = () => { d.remove(); if (f) f(); }; d.appendChild(b);
  });
  document.body.appendChild(d); setTimeout(() => d.remove(), 30000);
}
