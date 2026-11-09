/* ev · Gmail, Classroom y Drive (solo lectura) */
let gtoken = null;
const SCOPES = "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/classroom.courses.readonly https://www.googleapis.com/auth/classroom.coursework.me.readonly https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/calendar.readonly";
function loadGsi() {
  return new Promise((ok, no) => {
    if (window.google && google.accounts) return ok();
    const s = document.createElement("script"); s.src = "https://accounts.google.com/gsi/client";
    s.onload = ok; s.onerror = () => no(new Error("no se pudo cargar Google")); document.head.appendChild(s);
  });
}
async function connectGoogle() {
  let cid = store.get("ed_gcid");
  if (!cid) { cid = (prompt("Pega tu ID de cliente de Google (termina en .apps.googleusercontent.com)") || "").trim(); if (!cid) return; store.set("ed_gcid", cid); }
  try {
    await loadGsi();
    google.accounts.oauth2.initTokenClient({
      client_id: cid, scope: SCOPES,
      callback: r => {
        if (r.access_token) { gtoken = r.access_token; setTimeout(() => { gtoken = null; }, (r.expires_in || 3600) * 1000 - 60000); showSub("Google conectado."); }
        else showSub("No se pudo conectar Google.");
      }
    }).requestAccessToken();
  } catch (e) { showSub("Google: " + e.message); }
}
const gb = document.createElement("button");
gb.id = "bGoo"; gb.title = "Conectar Google"; gb.setAttribute("aria-label", "Conectar Google"); gb.textContent = "G"; gb.onclick = connectGoogle;
$("dock").prepend(gb);
async function gget(url) {
  const r = await fetch(url, { headers: { Authorization: "Bearer " + gtoken } });
  if (!r.ok) throw new Error("Google " + r.status); return r.json();
}
async function gmailUnread() {
  const l = await gget("https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults=5");
  if (!l.messages) return "No tienes correos sin leer.";
  const out = [];
  for (const m of l.messages) {
    const d = await gget("https://gmail.googleapis.com/gmail/v1/users/me/messages/" + m.id + "?format=metadata&metadataHeaders=From&metadataHeaders=Subject");
    const h = k => ((d.payload.headers || []).find(x => x.name === k) || {}).value || "";
    out.push("De " + h("From").replace(/<.*>/, "").trim() + ": " + h("Subject"));
  }
  return out.join("\n");
}
async function classroomTasks() {
  const c = await gget("https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE&studentId=me");
  const now = Date.now(), out = [];
  for (const co of c.courses || []) {
    const w = await gget("https://classroom.googleapis.com/v1/courses/" + co.id + "/courseWork?orderBy=dueDate%20asc&pageSize=20").catch(() => ({}));
    for (const t of w.courseWork || []) {
      if (!t.dueDate) continue;
      const d = new Date(t.dueDate.year, t.dueDate.month - 1, t.dueDate.day, (t.dueTime && t.dueTime.hours) || 23, (t.dueTime && t.dueTime.minutes) || 59);
      if (d.getTime() >= now) out.push({ d, s: co.name + ": " + t.title + " (" + d.toLocaleDateString("es-ES") + ")" });
    }
  }
  out.sort((a, b) => a.d - b.d);
  return out.length ? out.slice(0, 6).map(x => x.s).join("\n") : "No veo tareas pendientes con fecha.";
}
async function calendarUpcoming() {
  const now = new Date(), end = new Date(now.getTime() + 7 * 86400000);
  const params = new URLSearchParams({
    timeMin: now.toISOString(), timeMax: end.toISOString(),
    maxResults: "10", orderBy: "startTime", singleEvents: "true",
    fields: "items(summary,start,end,htmlLink)"
  });
  const data = await gget("https://www.googleapis.com/calendar/v3/calendars/primary/events?" + params.toString());
  const events = data.items || [];
  if (!events.length) return "No veo eventos próximos en los próximos siete días.";
  return events.map(event => {
    const start = event.start?.dateTime || event.start?.date || "";
    const date = start ? new Date(start).toLocaleString("es-ES", { dateStyle: "short", timeStyle: event.start?.dateTime ? "short" : undefined }) : "Fecha sin especificar";
    return date + ": " + (event.summary || "Evento sin título");
  }).join("\n");
}
async function driveSearch(q) {
  const f = await gget("https://www.googleapis.com/drive/v3/files?pageSize=5&fields=files(name,webViewLink)&q=" + encodeURIComponent("name contains '" + q.replace(/'/g, "") + "' and trashed=false"));
  if (!f.files || !f.files.length) return "No encontré archivos con ese nombre.";
  showLink(f.files[0].webViewLink, "Abrir " + f.files[0].name);
  return f.files.map(x => x.name).join("\n");
}

async function driveAppDataFile() {
  const q = encodeURIComponent("name='ed2-memory-sync.json' and 'appDataFolder' in parents and trashed=false");
  const data = await gget("https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=" + q + "&pageSize=5&fields=files(id,name,modifiedTime)");
  return (data.files || []).sort((a,b) => String(b.modifiedTime || "").localeCompare(String(a.modifiedTime || "")))[0] || null;
}
async function driveUploadAppData(payload) {
  if (!gtoken) throw new Error("Conecta Google primero con el botón G.");
  const body = JSON.stringify(payload);
  const existing = await driveAppDataFile();
  if (existing) {
    const response = await fetch("https://www.googleapis.com/upload/drive/v3/files/" + encodeURIComponent(existing.id) + "?uploadType=media", {
      method: "PATCH", headers: { Authorization: "Bearer " + gtoken, "Content-Type": "application/json" }, body
    });
    if (!response.ok) throw new Error("Drive " + response.status);
    return response.json();
  }
  const boundary = "ed2_sync_" + Math.random().toString(36).slice(2);
  const metadata = { name: "ed2-memory-sync.json", mimeType: "application/json", parents: ["appDataFolder"] };
  const multipart = "--" + boundary + "\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n"
    + JSON.stringify(metadata) + "\r\n--" + boundary + "\r\nContent-Type: application/json\r\n\r\n"
    + body + "\r\n--" + boundary + "--";
  const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
    method: "POST", headers: { Authorization: "Bearer " + gtoken, "Content-Type": "multipart/related; boundary=" + boundary }, body: multipart
  });
  if (!response.ok) throw new Error("Drive " + response.status);
  return response.json();
}
async function driveDownloadAppData() {
  if (!gtoken) throw new Error("Conecta Google primero con el botón G.");
  const file = await driveAppDataFile();
  if (!file) return null;
  const response = await fetch("https://www.googleapis.com/drive/v3/files/" + encodeURIComponent(file.id) + "?alt=media", {
    headers: { Authorization: "Bearer " + gtoken }
  });
  if (!response.ok) throw new Error("Drive " + response.status);
  return response.json();
}
async function syncEDMemoryToGoogle() {
  try {
    if (!gtoken) { showSub("Primero conecta Google con el botón G."); return false; }
    if (typeof buildEDMemoryBackupData !== "function") throw new Error("La copia local todavía no está preparada.");
    const payload = await buildEDMemoryBackupData();
    await driveUploadAppData(payload);
    showSub("Memoria de E.D. sincronizada en el espacio privado de la aplicación en Google Drive.");
    return true;
  } catch (error) { showSub("No pude sincronizar la memoria: " + (error?.message || String(error))); return false; }
}
async function restoreEDMemoryFromGoogle() {
  try {
    if (!gtoken) { showSub("Primero conecta Google con el botón G."); return false; }
    const payload = await driveDownloadAppData();
    if (!payload) { showSub("No hay una copia de E.D. en Google Drive todavía."); return false; }
    if (typeof mergeEDMemoryBackupData !== "function") throw new Error("La importación local todavía no está preparada.");
    return await mergeEDMemoryBackupData(payload);
  } catch (error) { showSub("No pude recuperar la memoria: " + (error?.message || String(error))); return false; }
}
async function googleCmd(n) {
  const gm = /(correo|gmail|mail)/.test(n) && /(leer|lee|tengo|nuevo|sin leer|revisa|mira)/.test(n);
  const cl = /(tarea|classroom|deberes)/.test(n) && /(tengo|pendiente|mis|que|cuales|revisa|mira)/.test(n);
  const dr = n.match(/busca (?:en )?(?:mi )?drive (.+)/);
  const cal = /(calendario|calendar|eventos|agenda|citas)/.test(n) && /(hoy|mañana|manana|proxim|tengo|revisa|mira|que|semana)/.test(n);
  if (!gm && !cl && !dr && !cal) return null;
  if (!gtoken) return "Primero pulsa el botón G, abajo a la derecha, para conectar tu Google.";
  try {
    if (gm) return await gmailUnread();
    if (cl) return await classroomTasks();
    if (cal) return await calendarUpcoming();
    return await driveSearch(dr[1]);
  } catch (e) { return "No pude leer Google: " + e.message; }
}
