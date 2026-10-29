/* ev · Ventana flotante mínima: solo la esfera ámbar */
async function openPip() {
  if (pip) { pip.win.close(); return; }
  if (!("documentPictureInPicture" in window)) { showSub("Tu Chrome no permite la ventana flotante."); return; }
  try {
    const win = await documentPictureInPicture.requestWindow({ width: 220, height: 220 });
    const d = win.document;
    d.head.innerHTML = '<meta charset="utf-8"><title>ev</title>';
    const css = d.createElement("style");
    css.textContent = "html,body{margin:0;height:100%;background:#050302;overflow:hidden;font-family:'Segoe UI',system-ui,sans-serif}canvas{position:absolute;inset:0;width:100%;height:100%}#s{position:absolute;left:0;right:0;bottom:0;padding:16px 10px 8px;text-align:center;font-size:13px;line-height:1.3;color:#f6ead6;background:linear-gradient(transparent,rgba(5,3,2,.9));transition:opacity .8s;max-height:55%;overflow:hidden}";
    d.head.appendChild(css);
    const c = d.createElement("canvas"), sub = d.createElement("div"); sub.id = "s"; d.body.append(c, sub);
    pip = { win, sub, cx: c.getContext("2d") };
    sub.textContent = $("sub").textContent; sub.style.opacity = $("sub").style.opacity || 0;
    const pd = win.devicePixelRatio || 1;
    const loop = t => {
      if (!pip || pip.win !== win) return;
      const w = win.innerWidth, h = win.innerHeight;
      if (c.width !== Math.round(w * pd) || c.height !== Math.round(h * pd)) { c.width = Math.round(w * pd); c.height = Math.round(h * pd); }
      step(t); render(pip.cx, w, h, pd, t, .5, .5, Math.min(w, h) * .26);
      win.requestAnimationFrame(loop);
    };
    win.requestAnimationFrame(loop);
    win.addEventListener("click", () => { if (state === "speak") { stopVoice(); setState("idle"); } });
    win.addEventListener("pagehide", () => { pip = null; });
  } catch (e) { pip = null; showSub("No pude abrir la ventana flotante."); }
}
