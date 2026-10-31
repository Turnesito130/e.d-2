/* E.D.-2 · Herramientas locales. Su ejecución no requiere un modelo externo. */
async function runTool(name, a = {}) {
  try {
    if (name === "abrir_pagina") {
      const s = norm(String(a.sitio || "")), k = Object.keys(SITES).find(x => s.includes(x));
      const url = k ? SITES[k] : /^https?:\/\//i.test(s) ? s : /\./.test(s) ? "https://" + s : "https://www.google.com/search?q=" + encodeURIComponent(s);
      openUrl(url, k || s); return "He abierto " + (k || url) + ".";
    }
    if (name === "buscar_google") { openUrl("https://www.google.com/search?q=" + encodeURIComponent(a.consulta || ""), "la búsqueda"); return "Búsqueda abierta en el navegador."; }
    if (name === "temporizador") {
      const ms = Math.max(1, Number(a.segundos) || 1) * 1000, label = a.etiqueta || "El temporizador";
      setTimeout(() => { viaText = false; showSub("¡Tiempo!"); speak(label + ": ya terminó el tiempo."); }, ms); return "Temporizador puesto.";
    }
    if (name === "anotar") { const m = memList(); m.push(String(a.texto || "")); memSave(m); return "Anotado."; }
    if (name === "calcular") { const r = calc(String(a.expresion || "")); return r === null ? "Expresión no válida." : r; }
    if (name === "modo_estudio") { setStudy(!!a.activar); return "Modo estudio " + (a.activar ? "activado" : "desactivado") + "."; }
    if (name === "correos_sin_leer") return typeof gmailUnread === "function" ? await gmailUnread() : "Conector de correo no disponible.";
    if (name === "tareas_pendientes") return typeof classroomTasks === "function" ? await classroomTasks() : "Conector de Classroom no disponible.";
    if (name === "buscar_drive") return typeof driveSearch === "function" ? await driveSearch(String(a.texto || "")) : "Conector de Drive no disponible.";
    return "Herramienta desconocida.";
  } catch (e) { return "Error: " + e.message; }
}
