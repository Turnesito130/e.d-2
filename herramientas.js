/* ev · Acciones locales deterministas. No depende de Gemini ni de otra API de IA. */
const TOOLS = ["abrir_pagina","buscar_google","temporizador","anotar","calcular","modo_estudio","guardar_tarjeta","sacar_tarjeta","olvidar","pomodoro"];
async function runTool(name, a = {}) {
  try {
    if (name === "abrir_pagina") {
      const s = norm(String(a.sitio || ""));
      const k = Object.keys(SITES).find(x => s.includes(x));
      const url = k ? SITES[k] : /^https?:\/\//i.test(s) ? s : /^[\w.-]+\.[a-z]{2,}/i.test(s) ? "https://" + s : "https://www.google.com/search?q=" + encodeURIComponent(s);
      openUrl(url, k || s || "página"); return "He preparado la página solicitada.";
    }
    if (name === "buscar_google") { openUrl("https://www.google.com/search?q=" + encodeURIComponent(a.consulta || ""), "la búsqueda"); return "He abierto la búsqueda."; }
    if (name === "temporizador") {
      const seconds = Math.max(1, Math.min(86400, Number(a.segundos) || 1));
      setTimeout(() => { viaText = false; showSub("¡Tiempo!"); speak((a.etiqueta || "El temporizador") + ": ha terminado."); }, seconds * 1000);
      return "Temporizador iniciado. Mantén esta pestaña abierta.";
    }
    if (name === "anotar") {
      const value = String(a.texto || "").trim(); if (!value) return "No hay nada que guardar.";
      const m = memList(); m.push(value); memSave(m); return "Guardado en la memoria de este navegador.";
    }
    if (name === "calcular") { const result = calc(String(a.expresion || "")); return result === null ? "No he podido interpretar esa operación." : result; }
    if (name === "modo_estudio") { setStudy(!!a.activar); return "Modo estudio " + (a.activar ? "activado." : "desactivado."); }
    const cards = () => { try { const v = JSON.parse(store.get("ed_cards") || "[]"); return Array.isArray(v) ? v : []; } catch (e) { return []; } };
    if (name === "guardar_tarjeta") {
      const q = String(a.pregunta || "").trim(), answer = String(a.respuesta || "").trim();
      if (!q || !answer) return "Necesito pregunta y respuesta.";
      const all = cards(); all.push({p:q,r:answer}); store.set("ed_cards",JSON.stringify(all.slice(-100))); return "Tarjeta guardada.";
    }
    if (name === "sacar_tarjeta") {
      const all=cards(); if (!all.length) return "Todavía no tienes tarjetas.";
      const c=all[Math.floor(Math.random()*all.length)]; return "Pregunta: "+c.p+". Cuando respondas, te diré la solución.";
    }
    if (name === "olvidar") {
      const term=norm(String(a.texto||"")); if(!term) return "Indica qué recuerdo borrar.";
      const old=memList(), next=old.filter(x=>!norm(x).includes(term)); memSave(next);
      return "He eliminado "+(old.length-next.length)+" recuerdos coincidentes.";
    }
    if (name === "pomodoro") { pomo(); return "Pomodoro iniciado."; }
    return "Acción no reconocida.";
  } catch(e) { return "No pude completar la acción: "+e.message; }
}
