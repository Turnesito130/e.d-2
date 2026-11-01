/* E.D.-2 · Barra de texto fija para conversar por escrito */
const bar = document.createElement("form");
bar.id = "bar";
bar.innerHTML = '<span id="bh" title="Arrastra para mover; doble clic para volver abajo" aria-label="Mover barra">&#8942;&#8942;</span><input id="bin" type="text" autocomplete="off" placeholder="Escribe un mensaje a E.D.…" aria-label="Mensaje para E.D."><button id="bgo" type="submit">Enviar</button>';
document.body.appendChild(bar);
const bcss = document.createElement("style");
bcss.textContent = `
#bar{position:fixed;left:50%;bottom:max(14px,env(safe-area-inset-bottom));transform:translateX(-50%);width:min(780px,calc(100vw - 28px));display:flex;gap:9px;align-items:center;padding:10px 12px;background:rgba(3,15,35,.96);border:1px solid rgba(55,220,255,.72);border-radius:18px;z-index:20;box-shadow:0 8px 32px rgba(0,0,0,.48),0 0 22px rgba(0,190,255,.16);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);touch-action:pan-y}
#bh{cursor:grab;padding:0 5px;color:#65dfff;user-select:none;letter-spacing:-3px;touch-action:none}
#bin{flex:1;width:0;min-width:0;background:rgba(2,10,25,.9);border:1px solid rgba(80,190,230,.45);border-radius:12px;padding:12px 14px;color:#e9fbff;font:inherit;font-size:1rem;outline:none}
#bin::placeholder{color:#8eb4c6}
#bin:focus{border-color:#42dcff;box-shadow:0 0 0 2px rgba(66,220,255,.16)}
#bar #bgo{flex:0 0 auto;border:1px solid #4bdfff;border-radius:12px;padding:12px 17px;font:inherit;font-weight:600;cursor:pointer;background:linear-gradient(135deg,#27c9f4,#1684d5);color:#001321}
#bar #bgo:disabled{opacity:.55;cursor:wait}
#dock{bottom:84px!important}
#chat{bottom:92px!important}
#cform{display:none!important}
@media(max-width:600px){#bar{gap:6px;padding:8px;border-radius:15px}#bin{padding:11px 10px;font-size:16px}#bar #bgo{padding:11px 12px}}
`;
document.head.appendChild(bcss);
let pos = null;
try { pos = JSON.parse(store.get("ed_bar") || "null"); } catch (e) {}
function place(p) {
  if (p) { bar.style.left=p.x+"px";bar.style.top=p.y+"px";bar.style.bottom="auto";bar.style.transform="none"; }
  else { bar.style.left="50%";bar.style.top="auto";bar.style.bottom="max(14px,env(safe-area-inset-bottom))";bar.style.transform="translateX(-50%)"; }
}
place(pos);
$("bh").addEventListener("pointerdown", e => {
  const r=bar.getBoundingClientRect(),dx=e.clientX-r.left,dy=e.clientY-r.top,hd=$("bh");hd.setPointerCapture(e.pointerId);
  const mv=ev=>{pos={x:Math.max(0,Math.min(innerWidth-r.width,ev.clientX-dx)),y:Math.max(0,Math.min(innerHeight-r.height,ev.clientY-dy))};place(pos);};
  const up=()=>{hd.removeEventListener("pointermove",mv);hd.removeEventListener("pointerup",up);store.set("ed_bar",JSON.stringify(pos));};
  hd.addEventListener("pointermove",mv);hd.addEventListener("pointerup",up);
});
$("bh").addEventListener("dblclick",()=>{pos=null;store.set("ed_bar","");place(null);});
bar.addEventListener("submit",e=>{e.preventDefault();const input=$("bin"),v=input.value.trim();if(!v||busy)return;input.value="";$("chat").classList.add("open");ask(v,true);});
