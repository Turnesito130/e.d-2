/* ev · Ajustes: voz opcional, color y enlace de configuración sin servicios de IA externos */
const acss = document.createElement("style");
acss.textContent = "#set{width:min(600px,94vw)!important;max-height:88vh;overflow:auto}#set input,#set select{font-size:15px;padding:11px!important}.prow{display:flex;gap:6px}.prow input{flex:1;min-width:0;font-family:monospace}.prow button,#set .sbtn{background:transparent;color:var(--amber);border:1px solid var(--amber);border-radius:8px;padding:0 14px;font:inherit;cursor:pointer}#set .sbtn{padding:9px 12px;margin:10px 8px 0 0}";
document.head.appendChild(acss);
["k2"].forEach(id => {
  const i = $(id), row = document.createElement("div");
  row.className = "prow"; i.type = "text"; i.spellcheck = false;
  i.setAttribute("autocapitalize", "off");
  i.parentNode.insertBefore(row, i); row.appendChild(i);
  const b = document.createElement("button");
  b.type = "button"; b.textContent = "Pegar";
  b.onclick = async () => {
    try {
      i.value = (await navigator.clipboard.readText()).trim();
      i.dispatchEvent(new Event("input")); showSub("Pegado y guardado.");
    } catch (e) { showSub("Chrome no dejó leer el portapapeles. Pulsa Ctrl+V dentro del cuadro."); }
  };
  row.appendChild(b);
});
["k2", "vid"].forEach(id => $(id).addEventListener("input", () => store.set("ed_" + id, $(id).value.trim())));
const tl = document.createElement("label"), ts = document.createElement("select");
tl.textContent = "Color de ev"; ts.id = "theme";
ts.innerHTML = '<option value="cian">Cian (Jarvis)</option><option value="ambar">Ámbar</option><option value="verde">Verde</option>';
ts.value = store.get("ed_theme") || "cian";
ts.onchange = () => { store.set("ed_theme", ts.value); applyTheme(); };
$("set").querySelector("h2").after(tl, ts);
const CFG = ["k2", "vid", "theme"];
const cb = document.createElement("button");
cb.type = "button"; cb.className = "sbtn"; cb.textContent = "Copiar enlace de configuración";
cb.onclick = async () => {
  const o = {}; CFG.forEach(k => { o[k] = store.get("ed_" + k); });
  const url = location.origin + location.pathname + "#cfg=" + btoa(unescape(encodeURIComponent(JSON.stringify(o))));
  try {
    await navigator.clipboard.writeText(url);
    showSub("Enlace copiado. Contiene tu configuración de voz: no lo compartas.");
  } catch (e) { showSub("No pude copiar el enlace."); }
};
$("save").before(cb);
(function () {
  const m = location.hash.match(/^#cfg=(.+)$/);
  if (!m) return;
  try {
    const o = JSON.parse(decodeURIComponent(escape(atob(m[1]))));
    for (const k of CFG) if (o[k] !== undefined) store.set("ed_" + k, o[k]);
    history.replaceState(null, "", location.pathname + location.search);
    location.reload();
  } catch (e) {}
})();


/* Memoria local-first: exportar e importar copias entre dispositivos. */
(function addMemoryBackupControls() {
  const panel = $("set");
  if (!panel || panel.querySelector("#edBackupExport")) return;
  const heading = document.createElement("h3");
  heading.textContent = "Memoria y copias";
  heading.style.marginTop = "22px";
  const note = document.createElement("p");
  note.textContent = "La memoria vive en este navegador. Para pasarla a otro dispositivo, exporta una copia e impórtala allí. Las claves y ajustes no se incluyen.";
  note.style.fontSize = "13px";
  const exportButton = document.createElement("button");
  exportButton.id = "edBackupExport";
  exportButton.type = "button";
  exportButton.className = "sbtn";
  exportButton.textContent = "Exportar memoria";
  exportButton.onclick = () => {
    const count = exportMemoryBackup();
    showSub("Copia creada: " + count + " recuerdos. Guárdala en un lugar privado.");
  };
  const importButton = document.createElement("button");
  importButton.type = "button";
  importButton.className = "sbtn";
  importButton.textContent = "Importar memoria";
  const file = document.createElement("input");
  file.type = "file";
  file.accept = "application/json,.json";
  file.hidden = true;
  file.onchange = async () => {
    try {
      const result = await importMemoryBackup(file.files && file.files[0]);
      showSub("Memoria importada. " + result.total + " recuerdos en este navegador.");
    } catch (e) {
      showSub("No se pudo importar: " + e.message);
    } finally { file.value = ""; }
  };
  importButton.onclick = () => file.click();
  panel.append(heading, note, exportButton, importButton, file);
})();
