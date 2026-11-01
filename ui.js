/* ev · Subtítulos, ajustes, imágenes y botones */
const labels = { idle: "te escucho", listen: "escuchando", think: "pensando", speak: "hablando" };
function setState(s) {
  state = s;
  $("st").textContent = started ? labels[s] : $("st").textContent;
  if (s === "speak") pauseRec(); else if (started) resumeRec();
}
function setSubs(o, t) {
  [ $("sub"), pip && pip.sub ].forEach(e => {
    if (!e) return;
    e.style.opacity = o;
    if (t !== undefined) e.textContent = t;
  });
}
function showSub(t, keep) {
  clearTimeout(fadeT); setSubs(1, t);
  if (!keep) fadeT = setTimeout(() => setSubs(0), 7000);
}

/* ---------- Ajustes sin Gemini ---------- */
["k2", "vid"].forEach(i => { const el = $(i); if (el) el.value = store.get("ed_" + i); });
function openSet() {
  $("set").style.display = "block";
  const first = $("k2");
  if (first) first.focus();
}
$("save").onclick = () => {
  ["k2", "vid"].forEach(i => {
    const el = $(i);
    if (el) store.set("ed_" + i, el.value.trim());
  });
  $("set").style.display = "none";
  showSub("Listo, guardado.");
};

/* ---------- Imágenes ---------- */
function hideImages() { imgMode = false; $("gal").classList.remove("on"); $("bImg").classList.remove("on"); }
async function showImages(q) {
  q = (q || "").trim(); if (!q) return;
  try {
    const u = "https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrlimit=10&gsrsearch=" + encodeURIComponent(q) + "&prop=imageinfo&iiprop=url|mime&iiurlwidth=640&format=json&origin=*";
    const j = await (await fetch(u)).json();
    const list = Object.values((j.query && j.query.pages) || {}).sort((a, b) => a.index - b.index)
      .map(p => ({ i: p.imageinfo && p.imageinfo[0], t: p.title.replace(/^File:/, "").replace(/\.[a-z0-9]+$/i, "") }))
      .filter(x => x.i && x.i.thumburl && /^image\/(jpeg|png|webp|gif|svg\+xml)/.test(x.i.mime)).slice(0, 6);
    if (!list.length) return;
    const g = $("gal"); g.innerHTML = "";
    for (const x of list) {
      const a = document.createElement("a"); a.href = x.i.descriptionurl || x.i.url; a.target = "_blank"; a.rel = "noopener"; a.title = x.t + " (Wikimedia Commons)";
      const im = document.createElement("img"); im.src = x.i.thumburl; im.alt = x.t; im.loading = "lazy";
      const sp = document.createElement("span"); sp.textContent = x.t;
      a.append(im, sp); g.appendChild(a);
    }
    g.classList.add("on"); $("bImg").classList.add("on"); imgMode = true;
  } catch (e) {}
}
$("bImg").onclick = hideImages;

/* ---------- Botones ---------- */
function addMsg(cls, t) {
  const d = document.createElement("div"); d.className = "cm " + cls; d.textContent = t;
  $("clog").appendChild(d); $("clog").scrollTop = 1e9; return d;
}
$("bCfg").onclick = () => {
  if ($("set").style.display === "block") $("set").style.display = "none";
  else openSet();
};
$("bTxt").onclick = () => {
  const c = $("chat"); c.classList.toggle("open");
  if (c.classList.contains("open")) $("cin").focus();
};
$("cform").onsubmit = e => {
  e.preventDefault(); const v = $("cin").value.trim();
  if (!v || busy) return;
  $("cin").value = ""; ask(v, true);
};