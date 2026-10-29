/* ev · Aspecto de la página principal: esfera turquesa con anillos */
const hudCss = document.createElement("style");
hudCss.textContent = ":root{--amber:#5af0d2;--ember:#18b89c;--bone:#d9fff7;--dim:#6fa8a0}html,body{background:#01090a}#set,#chat{background:rgba(2,20,22,.96)!important;border-color:#1d5a52!important}#set input,#set select,#cin{background:#010a0b!important;border-color:#1d5a52!important}#dock button{background:rgba(2,20,22,.7)!important;border-color:#1d5a52!important}.cm.u{background:#0f3b37!important}.cm.e{background:#031416!important;border-color:#1d5a52!important}#gal a{border-color:#1d5a52!important;background:#031416!important}#sub{text-shadow:0 0 18px rgba(60,240,210,.35)!important}#save,#cform button{color:#01100e!important}";
document.head.appendChild(hudCss);
function wob(a, i, t, k) { return Math.sin(a * 3 + t * .7 * k + i) + .6 * Math.sin(a * 5 - t * .9 * k + i * 2) + .4 * Math.sin(a * 8 + t * 1.3 * k); }
function renderHud(c, w, h, d, t, fx, fy, R) {
  t /= 1000; const k = calm ? .3 : 1, cx = w * fx, cy = h * fy;
  c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, w, h);
  const bg = c.createRadialGradient(cx, cy, R, cx, cy, Math.max(w, h) * .75);
  bg.addColorStop(0, "rgba(10,70,68," + (.5 + energy * .2) + ")"); bg.addColorStop(1, "rgba(0,0,0,0)");
  c.fillStyle = bg; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 3; i++) {
    const rr = R * (1.8 + i * .75), amp = rr * (.03 + energy * .08) * (1 + i * .25);
    c.beginPath();
    for (let j = 0; j <= 140; j++) {
      const a = j / 140 * 6.2832, r = rr + amp * wob(a, i, t, k), x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      j ? c.lineTo(x, y) : c.moveTo(x, y);
    }
    c.closePath(); c.strokeStyle = "rgba(90,240,210," + (.3 - i * .06 + energy * .15) + ")"; c.lineWidth = 1.2; c.stroke();
    c.fillStyle = "rgba(150,255,235,.55)";
    for (let j = 0; j < 90; j++) {
      const a = j / 90 * 6.2832 + i * 2, r = rr + amp * wob(a, i, t, k) * 1.25 + Math.sin(j * 12.9 + i) * amp * .35;
      c.fillRect(cx + Math.cos(a) * r - .7, cy + Math.sin(a) * r - .7, 1.5, 1.5);
    }
  }
  const ca = Math.cos(ang), sa = Math.sin(ang);
  for (let i = 0; i < pts.length; i += 2) {
    const p = pts[i], x1 = p[0] * ca + p[2] * sa, z1 = -p[0] * sa + p[2] * ca;
    c.fillStyle = "rgba(120,255,225," + (.2 + .6 * (z1 + 1) / 2) + ")";
    c.fillRect(cx + x1 * R - 1, cy + p[1] * R - 1, 2, 2);
  }
  c.lineWidth = 1; c.strokeStyle = "rgba(80,230,200,.25)";
  for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(cx, cy, Math.abs(Math.cos(ang + i * Math.PI / 6)) * R, R, 0, 0, 6.2832); c.stroke(); }
  for (let i = -2; i <= 2; i++) { const y = i * R * .32, q = Math.sqrt(Math.max(0, R * R - y * y)); c.beginPath(); c.ellipse(cx, cy + y, q, q * .18, 0, 0, 6.2832); c.stroke(); }
  c.beginPath(); c.arc(cx, cy, R, 0, 6.2832); c.strokeStyle = "rgba(120,255,225,.55)"; c.stroke();
}
function loopMain(t) {
  step(t);
  const m = Math.min(W, H * 1.2) * .12, o = m * .32 * 3.3;
  const tk = imgMode ? .32 : 1, tx = imgMode ? 1 - (o + 24) / W : .5, ty = imgMode ? (o + 56) / H : .38;
  Lk += (tk - Lk) * .08; Lx += (tx - Lx) * .08; Ly += (ty - Ly) * .08;
  renderHud(ctx, W, H, dpr, t, Lx, Ly, m * Lk);
  requestAnimationFrame(loopMain);
}
