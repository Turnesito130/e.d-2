/* ev · Barra de escribir siempre visible y movible */
const bar = document.createElement("div"); bar.id = "bar";
bar.innerHTML = '<span id="bh" title="Arrastra para mover (doble clic: volver abajo)">&#8942;&#8942;</span><input id="bin" type="text" autocomplete="off" placeholder="Escribe a E.D…" aria-label="Mensaje para E.D"><button id="bdeep" type="button" title="Investigación profunda en todo lo que escribas" aria-pressed="false">Profunda</button><button id="bgo" type="button">Enviar</button>';
document.body.appendChild(bar);
const bcss = document.createElement("style");
bcss.textContent = "#bar{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);width:min(780px,92vw);display:flex;gap:8px;align-items:center;padding:8px 10px;border:1px solid;border-radius:14px;z-index:4;touch-action:none}#bh{cursor:grab;padding:0 6px;color:var(--dim);user-select:none;letter-spacing:-3px}#bin{flex:1;min-width:0;border:1px solid;border-radius:10px;padding:10px 12px;font:inherit;font-size:1rem}#bar button{border:0;border-radius:10px;padding:10px 14px;font:inherit;cursor:pointer;background:var(--amber)}#bar #bdeep{background:transparent!important;color:var(--amber)!important;border:1px solid var(--amber)!important}#bar #bdeep.on{background:var(--amber)!important;color:#021018!important}#dock{bottom:84px!important}#sub{bottom:15%!important}#cform{display:none!important}#chat{bottom:92px!important}";
document.head.appendChild(bcss);
let pos = null; try { pos = JSON.parse(store.get("ed_bar") || "null"); } catch (e) {}
function place(p) { if (p) { bar.style.left = p.x + "px"; bar.style.top = p.y + "px"; bar.style.bottom = "auto"; bar.style.transform = "none"; } else bar.style.cssText = ""; }
place(pos);
$("bh").addEventListener("pointerdown", e => {
  const r = bar.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top, hd = $("bh"); hd.setPointerCapture(e.pointerId);
  const mv = ev => { pos = { x: Math.max(0, Math.min(innerWidth - r.width, ev.clientX - dx)), y: Math.max(0, Math.min(innerHeight - r.height, ev.clientY - dy)) }; place(pos); };
  const up = () => { hd.removeEventListener("pointermove", mv); hd.removeEventListener("pointerup", up); store.set("ed_bar", JSON.stringify(pos)); };
  hd.addEventListener("pointermove", mv); hd.addEventListener("pointerup", up);
});
$("bh").addEventListener("dblclick", () => { pos = null; store.set("ed_bar", ""); place(null); });
function sendBar() { const v = $("bin").value.trim(); if (!v || busy) return; $("bin").value = ""; $("chat").classList.add("open"); ask(v, true); }
$("bgo").onclick = sendBar;
$("bin").addEventListener("keydown", e => { if (e.key === "Enter") sendBar(); });
$("bdeep").onclick = () => { deepOn = !deepOn; $("bdeep").classList.toggle("on", deepOn); $("bdeep").setAttribute("aria-pressed", deepOn); showSub(deepOn ? "Investigación profunda activada para todo lo que preguntes." : "Investigación profunda desactivada."); };
