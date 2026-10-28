/* ev · La esfera animada */
/* ---------- Esfera ---------- */
const cv = $("cv"), ctx = cv.getContext("2d");
const N = 650, pts = [];
for (let i = 0; i < N; i++) {
  const y = 1 - 2 * (i + .5) / N, r = Math.sqrt(1 - y * y), th = i * 2.39996;
  pts.push([Math.cos(th) * r, y, Math.sin(th) * r]);
}
let W, H, dpr, ang = 0, energy = .15, lastT = 0;
const calm = matchMedia("(prefers-reduced-motion:reduce)").matches;
function resize() {
  dpr = window.devicePixelRatio || 1; W = innerWidth; H = innerHeight;
  cv.width = W * dpr; cv.height = H * dpr;
}
addEventListener("resize", resize); resize();
const target = { idle: .15, listen: .4, think: .65, speak: .95 };
function step(t) {
  if (t <= lastT) return;
  const dt = Math.min(50, t - lastT); lastT = t;
  energy += (target[state] - energy) * (1 - Math.exp(-dt / 250));
  ang += (.12 + energy * .7) * (calm ? .3 : 1) * dt / 1000;
}
function render(c, w, h, d, t, fx, fy, base) {
  t /= 1000; const k = calm ? .3 : 1;
  c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, w, h);
  const cx = w * fx, cy = h * fy, R = base * (1 + (state === "speak" ? .04 * Math.sin(t * 9) : .015 * Math.sin(t * 1.6)) * k);
  const g = c.createRadialGradient(cx, cy, R * .1, cx, cy, R * 2.1);
  g.addColorStop(0, "rgba(255,160,50," + (.22 + energy * .2) + ")"); g.addColorStop(1, "rgba(255,120,20,0)");
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  const ca = Math.cos(ang), sa = Math.sin(ang), ct = Math.cos(.38), st = Math.sin(.38);
  for (const p of pts) {
    const x1 = p[0] * ca + p[2] * sa, z1 = -p[0] * sa + p[2] * ca;
    const y2 = p[1] * ct - z1 * st, z2 = p[1] * st + z1 * ct;
    const rr = R * (1 + energy * .06 * Math.sin(p[1] * 8 + t * 4 + p[0] * 5) * k);
    const f = 2.4 / (2.4 - z2), sx = cx + x1 * rr * f, sy = cy + y2 * rr * f;
    c.fillStyle = "rgba(255," + (170 + z2 * 40 | 0) + ",70," + (.22 + .6 * (z2 + 1) / 2) + ")";
    const sz = .7 + (z2 + 1) * .9; c.fillRect(sx - sz / 2, sy - sz / 2, sz, sz);
  }
  c.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    c.save(); c.translate(cx, cy); c.rotate(t * (.12 + i * .05) * (i % 2 ? -1 : 1) * k + i * 1.05);
    c.strokeStyle = "rgba(255,170,60," + (.18 + energy * .25) + ")";
    c.beginPath(); c.ellipse(0, 0, R * (1.3 + i * .13), R * (.34 + i * .06), 0, 0, Math.PI * 2); c.stroke(); c.restore();
  }
}
let imgMode = false, Lk = 1, Lx = .5, Ly = .38;
function loopMain(t) {
  step(t);
  const m = Math.min(W, H * 1.2) * .24, rs = m * .32;
  const tk = imgMode ? .32 : 1, tx = imgMode ? 1 - (rs * 1.7 + 24) / W : .5, ty = imgMode ? (rs * 1.7 + 56) / H : .38;
  Lk += (tk - Lk) * .08; Lx += (tx - Lx) * .08; Ly += (ty - Ly) * .08;
  render(ctx, W, H, dpr, t, Lx, Ly, m * Lk);
  requestAnimationFrame(loopMain);
}
requestAnimationFrame(loopMain);
