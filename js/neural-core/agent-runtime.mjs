/**
 * E.D.-2 Agent Runtime v0.1
 * Planificador y ejecutor acotado. No concede permisos del sistema operativo.
 * Solo ejecuta herramientas registradas explícitamente por la aplicación.
 */
const RISK = Object.freeze({ LOW: "low", MEDIUM: "medium", HIGH: "high", CRITICAL: "critical" });
const AUTO_RISKS = new Set([RISK.LOW]);

function cleanText(value, max = 500) {
  if (typeof value !== "string") throw new TypeError("El texto debe ser una cadena.");
  const text = value.trim();
  if (!text || text.length > max) throw new TypeError("El texto está vacío o supera el límite permitido.");
  return text;
}

function step(id, tool, args, risk = RISK.LOW, description = tool) {
  return Object.freeze({ id, tool, args: Object.freeze({ ...args }), risk, description });
}

export function classifyRisk(tool) {
  const name = String(tool || "").toLowerCase();
  if (/delete|remove|erase|format|shutdown|kill|attack|weapon|transfer|purchase|send_message|publish|install|execute_shell|admin/.test(name)) return RISK.CRITICAL;
  if (/email|message|post|share|upload|download|camera|microphone|location|device_setting|file_move|file_write/.test(name)) return RISK.HIGH;
  if (/open_url|search|timer|calculate|read|list|note|study|memory_search/.test(name)) return RISK.LOW;
  return RISK.MEDIUM;
}

export function planTask(input) {
  const query = cleanText(input, 1000);
  const q = query.toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const steps = [];
  const add = (tool, args, description) => steps.push(step("step-" + (steps.length + 1), tool, args, classifyRisk(tool), description));

  let match = q.match(/(?:cuanto es|calcula|calcular|resuelve)\s+(.+)/);
  if (match) add("calculate", { expression: match[1].replace(/[?¿]/g, "").trim() }, "Calcular la expresión solicitada");

  match = q.match(/^(?:anota|apunta|recuerda|memoriza)(?: que)?\s+(.+)/);
  if (match) add("note", { text: match[1].trim() }, "Guardar la nota solicitada expresamente");

  match = q.match(/^(?:busca en google|busca en internet|busca)\s+(.+)/);
  if (match) add("search", { query: match[1].trim() }, "Buscar información");

  match = q.match(/^(?:abre|abrir|ve a|entra en)\s+(https?:\/\/\S+|[a-z0-9.-]+\.[a-z]{2,}(?:\/\S*)?)$/);
  if (match) add("open_url", { url: match[1].startsWith("http") ? match[1] : "https://" + match[1] }, "Abrir la dirección indicada");

  match = q.match(/(?:temporizador|avisa(?:me)? en)\s+(\d{1,4})\s*(segundos?|minutos?)/);
  if (match) add("timer", { seconds: Number(match[1]) * (match[2].startsWith("min") ? 60 : 1) }, "Crear un temporizador");

  return Object.freeze({
    id: "ed-plan-" + Date.now().toString(36),
    goal: query,
    steps: Object.freeze(steps),
    status: steps.length ? "planned" : "no_supported_action",
    requiresReview: steps.some(s => !AUTO_RISKS.has(s.risk))
  });
}

export function validatePlan(plan) {
  if (!plan || typeof plan !== "object" || !Array.isArray(plan.steps) || plan.steps.length > 12) return false;
  const ids = new Set();
  for (const item of plan.steps) {
    if (!item || typeof item.id !== "string" || ids.has(item.id)) return false;
    ids.add(item.id);
    if (typeof item.tool !== "string" || !item.tool || !item.args || typeof item.args !== "object" || Array.isArray(item.args)) return false;
    if (![RISK.LOW, RISK.MEDIUM, RISK.HIGH, RISK.CRITICAL].includes(item.risk)) return false;
    if (item.risk !== classifyRisk(item.tool)) return false;
  }
  return true;
}

export function createAgentRuntime({ tools = {}, onAudit = () => {} } = {}) {
  const registry = new Map(Object.entries(tools).filter(([name, fn]) => /^[a-z][a-z0-9_]{0,40}$/.test(name) && typeof fn === "function"));
  async function execute(plan, { approve = async () => false } = {}) {
    if (!validatePlan(plan)) throw new TypeError("Plan no válido: se cancela la ejecución.");
    const results = [];
    for (const item of plan.steps) {
      if (!registry.has(item.tool)) {
        results.push({ id: item.id, status: "unavailable", message: "Herramienta no registrada." });
        onAudit({ type: "tool_unavailable", tool: item.tool, risk: item.risk });
        continue;
      }
      if (!AUTO_RISKS.has(item.risk)) {
        const allowed = await approve(Object.freeze({ ...item }));
        if (allowed !== true) {
          results.push({ id: item.id, status: "approval_required", message: "No se ejecutó: falta autorización explícita." });
          onAudit({ type: "approval_denied", tool: item.tool, risk: item.risk });
          continue;
        }
      }
      try {
        const value = await registry.get(item.tool)(Object.freeze({ ...item.args }));
        results.push({ id: item.id, status: "completed", value });
        onAudit({ type: "tool_completed", tool: item.tool, risk: item.risk });
      } catch (error) {
        results.push({ id: item.id, status: "failed", message: String(error?.message || error) });
        onAudit({ type: "tool_failed", tool: item.tool, risk: item.risk });
      }
    }
    return Object.freeze({ planId: plan.id, results: Object.freeze(results) });
  }
  return Object.freeze({ plan: planTask, execute, listTools: () => [...registry.keys()] });
}

export const RISK_LEVELS = RISK;
