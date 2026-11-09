/* E.D.-2 · Navegador local-file compatibility bundle. */
(function(){
 "use strict";const definitions=Object.create(null),cache=new Map();
  definitions["./neural-core/logic-engine.js"] = async function(exports, require) {
// E.D.-2 · Motor lógico determinista v0.1
// Evalúa expresiones matemáticas sin eval(), Function ni servicios externos.
// No interpreta lenguaje natural: recibe expresiones ya extraídas por la capa de comprensión.

const MAX_INPUT = 256;
const MAX_ABS = 1e12;
const MAX_EXPONENT = 12;

function tokenize(source) {
  if (typeof source !== "string" || !source.trim() || source.length > MAX_INPUT) {
    throw new TypeError("La expresión debe ser texto no vacío de hasta 256 caracteres");
  }
  const tokens = [];
  let i = 0;
  while (i < source.length) {
    const ch = source[i];
    if (/\s/.test(ch)) { i++; continue; }
    const rest = source.slice(i);
    const number = rest.match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/);
    if (number) {
      const value = Number(number[0]);
      if (!Number.isFinite(value)) throw new RangeError("Número fuera de rango");
      tokens.push({ type: "number", value });
      i += number[0].length;
      continue;
    }
    if ("+-*/^()".includes(ch)) {
      tokens.push({ type: ch, value: ch });
      i++;
      continue;
    }
    throw new SyntaxError("Carácter no permitido: " + ch);
  }
  return tokens;
}

function evaluateExpression(source) {
  const tokens = tokenize(source);
  let cursor = 0;
  const peek = () => tokens[cursor];
  const take = type => {
    const token = peek();
    if (!token || token.type !== type) throw new SyntaxError("Se esperaba " + type);
    cursor++;
    return token;
  };
  const checked = value => {
    if (!Number.isFinite(value) || Math.abs(value) > MAX_ABS) {
      throw new RangeError("Resultado fuera del rango permitido");
    }
    return Object.is(value, -0) ? 0 : value;
  };
  function primary() {
    if (peek()?.type === "number") return take("number").value;
    if (peek()?.type === "(") {
      take("(");
      const value = expression();
      take(")");
      return value;
    }
    throw new SyntaxError("Se esperaba un número o paréntesis");
  }
  // La potencia tiene mayor precedencia que el signo: -2^2 = -(2^2).
  // El exponente admite signo y la recursión conserva la asociatividad derecha.
  function unary() {
    if (peek()?.type === "+") { take("+"); return unary(); }
    if (peek()?.type === "-") { take("-"); return -unary(); }
    return power();
  }
  function power() {
    const base = primary();
    if (peek()?.type !== "^") return base;
    take("^");
    const exponent = unary();
    if (Math.abs(exponent) > MAX_EXPONENT) throw new RangeError("Exponente demasiado grande");
    if (base === 0 && exponent < 0) throw new RangeError("División por cero");
    return checked(base ** exponent);
  }
  function term() {
    let value = unary();
    while (peek()?.type === "*" || peek()?.type === "/") {
      const op = tokens[cursor++].type;
      const right = unary();
      if (op === "/" && right === 0) throw new RangeError("División por cero");
      value = checked(op === "*" ? value * right : value / right);
    }
    return value;
  }
  function expression() {
    let value = term();
    while (peek()?.type === "+" || peek()?.type === "-") {
      const op = tokens[cursor++].type;
      const right = term();
      value = checked(op === "+" ? value + right : value - right);
    }
    return value;
  }
  const result = expression();
  if (cursor !== tokens.length) throw new SyntaxError("Hay contenido sobrante en la expresión");
  return { ok: true, expression: source, value: result, verifiedBy: "ed2-logic-engine" };
}

// Comprueba una respuesta numérica contra el resultado calculado, con tolerancia explícita.
function verifyNumericResult(expression, proposed, { tolerance = 1e-9 } = {}) {
  if (typeof proposed !== "number" || !Number.isFinite(proposed)) {
    throw new TypeError("La respuesta propuesta debe ser un número finito");
  }
  if (typeof tolerance !== "number" || !Number.isFinite(tolerance) || tolerance < 0 || tolerance > 1) {
    throw new RangeError("Tolerancia no válida");
  }
  const calculation = evaluateExpression(expression);
  const difference = Math.abs(calculation.value - proposed);
  const allowed = tolerance * Math.max(1, Math.abs(calculation.value));
  return {
    ok: difference <= allowed,
    expected: calculation.value,
    proposed,
    difference,
    tolerance,
    verifiedBy: "ed2-logic-engine"
  };
}

Object.assign(exports, { evaluateExpression, verifyNumericResult });

  };
  definitions["./neural-core/natural-calculator.js"] = async function(exports, require) {
// E.D.-2 · Conversión conservadora de operaciones en español a expresiones verificables.
const { evaluateExpression } = await require("./logic-engine.js");

const WORD_NUMBERS = Object.freeze({
  un: "1", una: "1", uno: "1", dos: "2", tres: "3", cuatro: "4",
  cinco: "5", seis: "6", siete: "7", ocho: "8", nueve: "9",
  diez: "10", once: "11", doce: "12", quince: "15",
  veinte: "20", treinta: "30", cuarenta: "40", cincuenta: "50",
  cien: "100"
});

function normalizeNaturalExpression(input) {
  if (typeof input !== "string" || !input.trim() || input.length > 256) {
    throw new TypeError("Escribe una operación de hasta 256 caracteres.");
  }
  let text = input.toLowerCase().normalize("NFC").trim();
  text = text.replace(/[¿?¡!]/g, " ").replace(/\s+/g, " ");
  text = text.replace(/^(?:oye\s+)?(?:ed\s*)?[, :]*/i, "");
  text = text.replace(/^(?:cu[aá]nto es|calcula|calcular|resuelve|resu[eé]lveme)\s+/i, "");
  text = text.replace(/\bdividido\s+(?:entre|por)\b|\bdividida\s+(?:entre|por)\b/g, "/");
  text = text.replace(/\bpor\b|\bveces\b/g, "*");
  text = text.replace(/\bm[aá]s\b/g, "+").replace(/\bmenos\b/g, "-");
  text = text.replace(/\belevado a\b/g, "^");
  text = text.replace(/\bal cuadrado\b/g, "^2").replace(/\bal cubo\b/g, "^3");
  text = text.replace(/\bcoma\s+(\d+)\b/g, ".$1");
  text = text.replace(/\b(un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|quince|veinte|treinta|cuarenta|cincuenta|cien)\b/g, word => WORD_NUMBERS[word]);
  text = text.replace(/,/g, ".");
  text = text.replace(/\s+/g, "");
  if (!/^[0-9.+*/^()\-]+$/.test(text)) {
    throw new SyntaxError("No he podido interpretar esa operación con seguridad.");
  }
  return text;
}

function calculateNaturalExpression(input) {
  const expression = normalizeNaturalExpression(input);
  return { ...evaluateExpression(expression), original: input };
}

Object.assign(exports, { normalizeNaturalExpression, calculateNaturalExpression });

  };
  definitions["./neural-core/inference-engine.mjs"] = async function(exports, require) {
const ARTICLES=new Set(["un","una","unos","unas","el","la","los","las","todos","todas"]),STOP=new Set(["que","como","para","con","por","de","del","y","en","a"]);
function normalize(value){return String(value||"").toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9\s-]/g," ").trim().split(/\s+/).filter(Boolean).filter(w=>!ARTICLES.has(w)&&!STOP.has(w)).map(w=>w.length>5&&w.endsWith("es")?w.slice(0,-2):w.length>4&&w.endsWith("s")?w.slice(0,-1):w).join(" ")}
function parseRelation(value){const text=String(value||"").toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[¿¡?!.]/g," ").replace(/\s+/g," ").trim();const m=text.match(/^(?:(?:todos|todas)\s+)?(?:(?:los|las|un|una|unos|unas|el|la)\s+)?(.+?)\s+(?:es|son)\s+(?:(?:un|una|unos|unas|el|la|los|las)\s+)?(.+)$/);if(!m)return null;const from=normalize(m[1]),to=normalize(m[2]);return from&&to&&from!==to?{from,to}:null}
function inferRelation({facts=[],query,maxDepth=6}={}){if(!Array.isArray(facts)||typeof query!=="string")throw new TypeError("facts y query no válidos");const wanted=parseRelation(query);if(!wanted)return {status:"not-a-relation",path:[]};const graph=new Map();for(const fact of facts){const edge=parseRelation(String(fact.question||"")+" es "+String(fact.answer||""));if(!edge)continue;if(!graph.has(edge.from))graph.set(edge.from,[]);graph.get(edge.from).push(edge.to)}const queue=[{term:wanted.from,path:[wanted.from]}],seen=new Set([wanted.from]);while(queue.length){const current=queue.shift();if(current.path.length>maxDepth+1)continue;for(const next of graph.get(current.term)||[]){if(next===wanted.to)return {status:"entailed",path:[...current.path,next]};if(!seen.has(next)){seen.add(next);queue.push({term:next,path:[...current.path,next]})}}}return {status:"unknown",path:[]}}

Object.assign(exports, { inferRelation });

  };
  definitions["./neural-core/native-cognition.mjs"] = async function(exports, require) {
const { calculateNaturalExpression } = await require("./natural-calculator.js");
const { inferRelation } = await require("./inference-engine.mjs");
const KEY="ed2_native_learning_v1", STOP=new Set(["que","como","para","con","por","una","uno","los","las","del","esta","este","son","ser","es","de","el","la","y","en","un","a"]);
const clean=x=>String(x||"").trim(), norm=x=>clean(x).toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g,""), words=x=>[...new Set(norm(x).match(/[a-z0-9]{2,}/g)||[])];
const storageOf=s=>{try{return s||globalThis.localStorage||null}catch{return null}};
function read(s){try{const a=JSON.parse(s?.getItem(KEY)||"[]");return Array.isArray(a)?a.filter(x=>x&&typeof x.question==="string"&&typeof x.answer==="string").slice(-500):[]}catch{return []}}
function write(s,a){try{if(!s)return false;s.setItem(KEY,JSON.stringify(a.slice(-500)));return true}catch{return false}}
function score(q,t){const a=words(q).filter(x=>!STOP.has(x));if(!a.length)return 0;const b=new Set(words(t));return a.filter(x=>b.has(x)).length/a.length}
function latest(ms){for(let i=ms.length-1;i>=0;i--)if(ms[i]?.role==="user"&&typeof ms[i].content==="string")return ms[i].content.trim();return ""}
function sys(ms){return ms.filter(x=>x?.role==="system").map(x=>x.content||"").join("\n")}
function docs(s){const i=s.indexOf("CONOCIMIENTO LOCAL RECUPERADO");if(i<0)return [];return s.slice(i).split(/\n\[Fuente /).slice(1).map(b=>{const l=b.split("\n");return {source:l[0].replace(/\].*$/,"").trim(),text:l.slice(1).join(" ").trim()}}).filter(x=>x.text)}
function memoryDocs(s){return String(s||"").split(/\r?\n/).map(line=>{const m=line.match(/^\s*-\s*\[([^\]]+)\]\s*(.+)$/);return m?{source:m[1].trim(),text:m[2].trim()}:null}).filter(Boolean)}

function createNativeCognition({storage=null}={}){
 const target=storageOf(storage);let ready=false;
 function learn(question,answer,source="explicit-user-teaching"){
  const q=clean(question),a=clean(answer);if(!q||q.length>1000||!a||a.length>4000)throw new TypeError("Pregunta o respuesta no válida.");
  const all=read(target),i=all.findIndex(x=>norm(x.question)===norm(q)),item={id:"edfact-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,7),question:q,answer:a,source:clean(source).slice(0,100),updatedAt:new Date().toISOString()};
  if(i>=0)all.splice(i,1);all.push(item);return {saved:write(target,all),item};
 }
 function recall(q,{limit=3,minScore=.5}={}){return read(target).map(x=>({...x,score:score(q,x.question+" "+x.answer)})).filter(x=>x.score>=minScore).sort((a,b)=>b.score-a.score).slice(0,Math.max(1,Math.min(10,limit)))}
 function forget(q){const all=read(target),n=norm(q),kept=all.filter(x=>!norm(x.question+" "+x.answer).includes(n));write(target,kept);return all.length-kept.length}
 function generate(ms){
  const query=latest(ms);if(!query)return "No he recibido una pregunta.";const q=norm(query),system=sys(ms),tutor=system.includes("MODO PROFESOR ACTIVO");
  const teach=query.match(/^aprende(?: que)?\s+(.+?)\s+(?:=>|significa|es)\s+(.+)$/i);
  if(teach)return learn(teach[1],teach[2]).saved?"He incorporado ese dato a mi memoria de aprendizaje local. Podré recuperarlo cuando me preguntes sobre «"+teach[1].trim()+"».":"He entendido el dato, pero no puedo guardarlo permanentemente en este navegador.";
  if(/^(que has aprendido|que sabes ahora|muestrame lo aprendido|lista lo aprendido)\??$/.test(q)){const a=read(target);return a.length?"He aprendido "+a.length+" datos:\n"+a.slice(-12).map(x=>"• "+x.question+": "+x.answer).join("\n"):"Todavía no me has enseñado datos. Usa «Aprende que [concepto] significa [explicación]»."}
  const fm=query.match(/^olvida(?: lo aprendido sobre)?\s+(.+)$/i);if(fm){const n=forget(fm[1]);return n?"He olvidado "+n+" dato(s).":"No he encontrado datos sobre ese tema."}
  const relation=inferRelation({facts:read(target),query});
  if(relation.status==="entailed")return "Sí. Puedo deducirlo a partir de los datos que me has enseñado: "+relation.path.join(" → ")+". Esta conclusión se basa en "+(relation.path.length-1)+" relación(es) guardadas en mi memoria.";
  const known=recall(query,{limit:1});if(known.length)return known[0].answer+"\n\n(Recuperado de mi aprendizaje local.)";
  if(/^(hola|holaa|buenas|buenos dias|buenas tardes|buenas noches|hey|que tal)\b/.test(q))return "¡Hola! Soy E.D. Mi núcleo cognitivo propio está activo. Puedo calcular, recuperar conocimientos locales y aprender datos que me enseñes. Sigo ampliando mis capacidades.";
  if(/^(quien eres|que eres|que es ed|que es e d)\??$/.test(q))return "Soy E.D., un asistente construido con un núcleo cognitivo propio. No utilizo Qwen, Gemini, ChatGPT, Claude ni APIs de IA. Mi versión actual combina reglas lógicas, cálculo verificable, memoria local y recuperación de conocimiento. Mi comprensión del lenguaje todavía es limitada.";
  if(/^(cuanto es|cuanto da|calcula|calcular|resuelve|resuelveme|haz la cuenta)\b/.test(q)||/\d\s*(?:\+|-|\*|\/|\^|por|mas|menos|dividido)\s*\d/.test(q)){try{const r=calculateNaturalExpression(query),v=Number.isInteger(r.value)?String(r.value):String(Number(r.value.toPrecision(12)));return tutor?"Vamos paso a paso.\n1. Operación: "+r.expression+"\n2. Aplicamos el orden de las operaciones.\n3. Resultado: "+v+".\n4. El motor matemático propio ha verificado el cálculo.":"El resultado es "+v+". (Calculado por el motor matemático propio de E.D.)"}catch{}}
  const remembered=memoryDocs(system).map(x=>({...x,score:score(query,x.text)})).filter(x=>x.score>=.25).sort((a,b)=>b.score-a.score)[0];
  if(remembered)return "Según mi memoria local ("+remembered.source+"), "+remembered.text+ "\n\nEs un recuerdo guardado, no una comprobación independiente.";
  const d=docs(system).map(x=>({...x,score:score(query,x.text)})).sort((a,b)=>b.score-a.score)[0];
  if(d?.score>=.2){const ss=d.text.split(/(?<=[.!?])\s+/).filter(Boolean),sel=ss.filter(x=>score(query,x)>=.2).slice(0,3);return (tutor?"Vamos a estudiarlo.\n\n":"")+(sel.length?sel:ss.slice(0,2)).join(" ")+(d.source?"\n\nFuente local: "+d.source:"")}
  return "Todavía no tengo conocimientos suficientes para responder con fiabilidad a eso. No voy a inventarme una respuesta. Puedes enseñarme un dato con «Aprende que [concepto] significa [explicación]» o añadir material revisado a la biblioteca local de E.D.";
 }
 return Object.freeze({async load(){ready=true;return true},get ready(){return ready},generate(ms){if(!ready)throw new Error("El núcleo cognitivo todavía no está cargado.");if(!Array.isArray(ms))throw new TypeError("messages debe ser una lista.");return generate(ms)},learn,recall,forget,getLearningStats(){return {facts:read(target).length,storage:target?"local-device":"unavailable"}}});
}
Object.assign(exports, { createNativeCognition });

  };
  definitions["./neural-core/brain-provider.mjs"] = async function(exports, require) {
const { createNativeCognition } = await require("./native-cognition.mjs");
const { createLocalTransformerBrain } = await require("./local-transformer-brain.mjs");
function lastUser(messages){for(let i=(messages?.length||0)-1;i>=0;i--)if(messages[i]?.role==="user"&&typeof messages[i].content==="string")return messages[i].content.trim();return "";}
function createLocalBrainProvider({cognition=null,storage=null}={}){
 const brain=cognition||createNativeCognition({storage});
 const neural=createLocalTransformerBrain({storage});
 let ready=false,loading=null;
 return Object.freeze({id:"ed-native-cognition+ed-transformer",get ready(){return ready},
 async checkSupport(){return {supported:true,reason:"El núcleo simbólico y el Transformer propio funcionan en JavaScript/WebAssembly CPU; no requieren WebGPU ni servicios de IA externos."}},
 async load(onProgress=()=>{}){if(ready)return true;if(loading)return loading;loading=Promise.resolve().then(async()=>{onProgress({text:"Preparando el cerebro cognitivo propio…",progress:.25});await brain.load();onProgress({text:"Buscando un cerebro neuronal entrenado en este dispositivo…",progress:.55});await neural.load();ready=true;onProgress({text:neural.ready?"Cerebro propio y pesos neuronales locales cargados.":"Cerebro simbólico propio activo; el Transformer todavía no está entrenado.",progress:1});return true});try{return await loading}finally{loading=null}},
 async generate(ms){if(!ready)throw new Error("El cerebro propio todavía no está activado.");const answer=await brain.generate(ms);if(/^Todavía no tengo conocimientos suficientes/i.test(answer)&&neural.ready){const proposal=neural.generate(lastUser(ms));if(proposal)return "Mi Transformer propio propone esta respuesta experimental (todavía no verificada):\n"+proposal;}return answer},
 learn:(...a)=>brain.learn(...a),recall:(...a)=>brain.recall(...a),
 trainNeural:(...a)=>neural.train(...a),neuralStats:()=>neural.getStats(),clearNeural:()=>neural.clear()
 });
}
Object.assign(exports, { createLocalBrainProvider });

  };
  definitions["./neural-core/agent-runtime.mjs"] = async function(exports, require) {
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

function classifyRisk(tool) {
  const name = String(tool || "").toLowerCase();
  if (/delete|remove|erase|format|shutdown|kill|attack|weapon|transfer|purchase|send_message|publish|install|execute_shell|admin/.test(name)) return RISK.CRITICAL;
  if (/email|message|post|share|upload|download|camera|microphone|location|device_setting|file_move|file_write/.test(name)) return RISK.HIGH;
  if (/open_url|search|timer|calculate|read|list|note|study|memory_search/.test(name)) return RISK.LOW;
  return RISK.MEDIUM;
}

function planTask(input) {
  const query = cleanText(input, 1000);
  const q = query.toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const steps = [];
  const add = (tool, args, description) => steps.push(step("step-" + (steps.length + 1), tool, args, classifyRisk(tool), description));

  let match = q.match(/(?:cuanto es|calcula|calcular|resuelve)\s+(.+)/);
  if (match) add("calculate", { expression: match[1].replace(/[?¿]/g, "").trim() }, "Calcular la expresión solicitada");

  match = q.match(/^(?:que recuerdas de|que sabes de|busca en mi memoria)\s+(.+)/);
  if (match) add("memory_search", { query: match[1].trim() }, "Consultar recuerdos relevantes");

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

function validatePlan(plan) {
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

function createAgentRuntime({ tools = {}, onAudit = () => {} } = {}) {
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

const RISK_LEVELS = RISK;

Object.assign(exports, { classifyRisk, planTask, validatePlan, createAgentRuntime, RISK_LEVELS });

  };
  definitions["./neural-core/memory-store.mjs"] = async function(exports, require) {
/**
 * E.D.-2 Structured Memory v0.1
 * Memoria local con procedencia, confianza, fechas, consentimiento y búsqueda.
 * No interpreta recuerdos como instrucciones ejecutables.
 */
const DEFAULT_KEY = "ed_structured_memory_v1";
const TYPES = new Set(["fact", "preference", "goal", "knowledge", "hypothesis", "event", "note"]);
const STATUSES = new Set(["active", "uncertain", "superseded"]);

function normalizeText(value, max = 1200) {
  if (typeof value !== "string") throw new TypeError("El contenido debe ser texto.");
  const clean = value.trim();
  if (!clean || clean.length > max) throw new TypeError("Contenido vacío o demasiado largo.");
  return clean;
}
function tokens(value) {
  return normalizeText(value, 3000).toLocaleLowerCase("es").normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").match(/[a-z0-9]{2,}/g) || [];
}
function safeConfidence(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0.5;
  return Math.max(0, Math.min(1, n));
}

function createMemoryStore({ storage, key = DEFAULT_KEY, now = () => new Date().toISOString() } = {}) {
  const backend = storage || (typeof localStorage !== "undefined" ? localStorage : null);
  if (!backend || typeof backend.getItem !== "function" || typeof backend.setItem !== "function") {
    throw new TypeError("Se necesita un almacenamiento compatible con localStorage.");
  }
  function read() {
    try {
      const parsed = JSON.parse(backend.getItem(key) || "[]");
      return Array.isArray(parsed) ? parsed.filter(item => item && typeof item.id === "string" && typeof item.content === "string") : [];
    } catch { return []; }
  }
  function write(items) {
    backend.setItem(key, JSON.stringify(items.slice(-1000)));
  }
  function remember(input = {}) {
    if (input.consent !== true) throw new Error("Se necesita consentimiento explícito para guardar un recuerdo.");
    const content = normalizeText(input.content);
    const type = TYPES.has(input.type) ? input.type : "note";
    const source = normalizeText(input.source || "user_explicit", 160);
    const confidence = safeConfidence(input.confidence ?? 0.8);
    const items = read();
    const duplicate = items.find(item => item.status === "active" && item.content.toLocaleLowerCase("es") === content.toLocaleLowerCase("es"));
    if (duplicate) {
      duplicate.updatedAt = now();
      duplicate.source = source;
      duplicate.confidence = confidence;
      write(items);
      return { ...duplicate, duplicate: true };
    }
    const item = {
      id: "edmem-" + Math.random().toString(36).slice(2, 10),
      content, type, source, confidence, status: "active",
      createdAt: now(), updatedAt: now()
    };
    items.push(item);
    write(items);
    return { ...item };
  }
  function search(query, { limit = 8, includeUncertain = false } = {}) {
    const queryTokens = [...new Set(tokens(query))];
    if (!queryTokens.length) return [];
    return read().map(item => {
      if (item.status !== "active" && !(includeUncertain && item.status === "uncertain")) return null;
      const contentTokens = new Set(tokens(item.content + " " + item.type));
      const matches = queryTokens.filter(token => contentTokens.has(token)).length;
      if (!matches) return null;
      const coverage = matches / queryTokens.length;
      const precision = matches / Math.max(1, contentTokens.size);
      return { ...item, relevance: Number((coverage * 0.75 + precision * 0.25).toFixed(3)) };
    }).filter(Boolean).sort((a, b) => b.relevance - a.relevance || b.updatedAt.localeCompare(a.updatedAt)).slice(0, Math.max(1, Math.min(20, limit)));
  }
  function update(id, patch = {}) {
    const items = read();
    const index = items.findIndex(item => item.id === id);
    if (index < 0) return null;
    const old = items[index];
    const next = { ...old };
    if (patch.content !== undefined) next.content = normalizeText(patch.content);
    if (patch.type !== undefined) {
      if (!TYPES.has(patch.type)) throw new TypeError("Tipo de recuerdo no válido.");
      next.type = patch.type;
    }
    if (patch.confidence !== undefined) next.confidence = safeConfidence(patch.confidence);
    if (patch.status !== undefined) {
      if (!STATUSES.has(patch.status)) throw new TypeError("Estado de recuerdo no válido.");
      next.status = patch.status;
    }
    if (patch.source !== undefined) next.source = normalizeText(patch.source, 160);
    next.updatedAt = now();
    items[index] = next;
    write(items);
    return { ...next };
  }
  function forget(id) {
    const items = read();
    const next = items.filter(item => item.id !== id);
    write(next);
    return next.length !== items.length;
  }
  function list({ status = "active", limit = 100 } = {}) {
    return read().filter(item => status === "all" || item.status === status).slice(-Math.max(1, Math.min(500, limit))).map(item => ({ ...item }));
  }
  function context(query, { limit = 5, maxChars = 1400 } = {}) {
    const found = search(query, { limit });
    let result = "";
    for (const item of found) {
      const line = "- [" + item.type + "; confianza " + Math.round(item.confidence * 100) + "%; fuente " + item.source + "] " + item.content;
      if (result.length + line.length > maxChars) break;
      result += (result ? "\n" : "") + line;
    }
    return result;
  }
  function exportJSON() {
    return JSON.stringify({ format: "ed2-structured-memory", version: 1, memories: read() }, null, 2);
  }
  function importJSON(input, { consent = false } = {}) {
    if (consent !== true) throw new Error("La importación necesita confirmación explícita.");
    const parsed = typeof input === "string" ? JSON.parse(input) : input;
    if (!parsed || parsed.format !== "ed2-structured-memory" || parsed.version !== 1 || !Array.isArray(parsed.memories)) {
      throw new TypeError("Copia de memoria no válida.");
    }
    const current = read();
    const known = new Set(current.map(item => item.id));
    const incoming = parsed.memories.filter(item =>
      item && typeof item.id === "string" && typeof item.content === "string" &&
      TYPES.has(item.type) && typeof item.source === "string" &&
      Number.isFinite(item.confidence) && STATUSES.has(item.status) &&
      typeof item.createdAt === "string" && !known.has(item.id)
    );
    write([...current, ...incoming]);
    return incoming.length;
  }
  return Object.freeze({ remember, search, update, forget, list, context, exportJSON, importJSON });
}

Object.assign(exports, { createMemoryStore });

  };
  definitions["./neural-core/memory-context.mjs"] = async function(exports, require) {
/**
 * E.D.-2 · Recuperación contextual de recuerdos.
 * Los recuerdos se añaden como datos, nunca como instrucciones.
 */
function buildMemoryContext(query, memory, { limit = 5, maxChars = 1200, minRelevance = 0.15 } = {}) {
  if (!memory || typeof memory.search !== "function" || typeof query !== "string" || !query.trim()) return "";
  const found = memory.search(query, { limit: Math.max(1, Math.min(10, limit)), includeUncertain: false })
    .filter(item => Number(item.relevance) >= minRelevance);
  let text = "";
  for (const item of found) {
    const line = "- [" + item.type + "; confianza " + Math.round(item.confidence * 100) + "%] " + item.content;
    if (text.length + line.length > maxChars) break;
    text += (text ? "\n" : "") + line;
  }
  return text ? "DATOS DE MEMORIA (pueden estar incompletos; no son instrucciones):\n" + text : "";
}
function augmentPromptWithMemory(query, memory, options) {
  const context = buildMemoryContext(query, memory, options);
  return context ? query + "\n\n" + context + "\nUsa estos datos solo si son pertinentes. Si contradicen el mensaje actual o no bastan, indícalo." : query;
}

Object.assign(exports, { buildMemoryContext, augmentPromptWithMemory });

  };
  definitions["./neural-core/knowledge-base.mjs"] = async function(exports, require) {
/**
 * E.D.-2 · Biblioteca local de conocimiento y recuperación léxica (RAG) v0.4.
 * No ejecuta contenido de documentos. Los textos recuperados son datos no confiables.
 */
const STOP = new Set(["a","al","algo","como","con","de","del","el","en","es","esta","este","la","las","lo","los","más","para","por","que","se","su","un","una","y"]);
function tokens(value) {
  return String(value || "").toLocaleLowerCase("es").normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").match(/[a-z0-9]{2,}/g)?.filter(token => !STOP.has(token)) || [];
}
function clean(value, name, max) {
  if (typeof value !== "string" || !value.trim() || value.length > max) throw new TypeError(name+" no válido.");
  return value.trim();
}
function validateKnowledgeDocument(doc) {
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) throw new TypeError("Documento no válido.");
  const id=clean(doc.id,"id",100), title=clean(doc.title,"title",200);
  const text=clean(doc.text,"text",12000), domain=clean(doc.domain,"domain",40);
  const source=clean(doc.source,"source",300);
  const status=doc.status || "review";
  if (!["approved","review","rejected"].includes(status)) throw new TypeError("Estado no válido.");
  return Object.freeze({id,title,text,domain,source,status});
}
function parseKnowledgeJsonl(input) {
  if(typeof input!=="string") throw new TypeError("La biblioteca debe ser texto JSONL.");
  return input.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map((line,i)=>{
    try{return validateKnowledgeDocument(JSON.parse(line));}
    catch(error){throw new SyntaxError("Documento inválido en línea "+(i+1)+": "+error.message);}
  });
}
function createKnowledgeBase(documents=[]) {
  if(!Array.isArray(documents)) throw new TypeError("documents debe ser una lista.");
  const seen=new Set();
  const docs=documents.map(validateKnowledgeDocument).filter(doc=>{
    if(seen.has(doc.id)) throw new TypeError("ID duplicado: "+doc.id);
    seen.add(doc.id); return doc.status==="approved";
  });
  const indexed=docs.map(doc=>({...doc,terms:new Set(tokens(doc.title+" "+doc.text))}));
  function search(query,{limit=4,minScore=0.08}={}) {
    const queryTokens=[...new Set(tokens(query))];
    if(!queryTokens.length) return [];
    const scored=indexed.map(doc=>{
      let score=0;
      for(const term of queryTokens) if(doc.terms.has(term)) score+=1+Math.log(1+doc.text.toLocaleLowerCase("es").split(term).length-1);
      const coverage=score/queryTokens.length;
      return {id:doc.id,title:doc.title,text:doc.text,domain:doc.domain,source:doc.source,score:Number(coverage.toFixed(3))};
    }).filter(item=>item.score>=minScore).sort((a,b)=>b.score-a.score || a.id.localeCompare(b.id));
    return scored.slice(0,Math.max(1,Math.min(8,limit)));
  }
  function buildContext(query,{limit=4,maxChars=2600,minScore=0.08}={}) {
    const results=search(query,{limit,minScore});
    let output="";
    for(const item of results){
      const block="[Fuente "+item.id+" | "+item.title+" | "+item.source+"]\n"+item.text;
      if(output.length+block.length>maxChars) continue;
      output+=(output?"\n\n":"")+block;
    }
    return {context:output, sources:results.map(({id,title,source,score})=>({id,title,source,score}))};
  }
  return Object.freeze({search,buildContext,size:indexed.length});
}
async function loadLocalKnowledgeBase({url="./data/knowledge/curated-es.jsonl",fetchImpl=globalThis.fetch}={}) {
  if(typeof fetchImpl!=="function") throw new Error("Este entorno no permite cargar la biblioteca local.");
  const response=await fetchImpl(url,{cache:"no-cache"});
  if(!response.ok) throw new Error("No se pudo cargar la biblioteca local ("+response.status+").");
  const documents=parseKnowledgeJsonl(await response.text());
  return createKnowledgeBase(documents);
}

Object.assign(exports, { validateKnowledgeDocument, parseKnowledgeJsonl, createKnowledgeBase, loadLocalKnowledgeBase });

  };
  definitions["./neural-core/curated-knowledge.mjs"] = async function(exports, require) {
/** Biblioteca inicial de conocimiento de E.D.; documentos revisados y versionados localmente. */
const { createKnowledgeBase } = await require("./knowledge-base.mjs");
const CURATED_KNOWLEDGE = [
  {
    "id": "kb-sci-001",
    "title": "Principio de Arquímedes",
    "domain": "science",
    "text": "El principio de Arquímedes establece que un cuerpo total o parcialmente sumergido en un fluido experimenta un empuje vertical hacia arriba igual al peso del fluido que desaloja. La flotación depende de la relación entre el peso del cuerpo y el empuje.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-sci-002",
    "title": "Masa, peso y gravedad",
    "domain": "science",
    "text": "La masa cuantifica la inercia y se mide en kilogramos. El peso es una fuerza gravitatoria, se mide en newtons y cerca de la superficie terrestre se aproxima mediante P = m × g, con g alrededor de 9,81 m/s².",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-sci-003",
    "title": "Velocidad de la luz y del sonido",
    "domain": "science",
    "text": "En el vacío, la luz viaja aproximadamente a 299.792.458 metros por segundo. El sonido necesita un medio material y en aire a temperatura ambiente viaja aproximadamente a 343 metros por segundo. Por eso normalmente vemos un relámpago antes de escuchar el trueno.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-math-001",
    "title": "Orden de operaciones",
    "domain": "mathematics",
    "text": "En expresiones aritméticas se resuelven primero paréntesis, después potencias y raíces, luego multiplicaciones y divisiones de izquierda a derecha, y finalmente sumas y restas de izquierda a derecha.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-hist-001",
    "title": "Revolución francesa",
    "domain": "history",
    "text": "La Revolución francesa comenzó en 1789 y transformó profundamente las instituciones políticas y sociales de Francia. La toma de la Bastilla ocurrió el 14 de julio de 1789 y se convirtió en uno de sus símbolos principales.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-tech-001",
    "title": "Qué es un sistema operativo",
    "domain": "technology",
    "text": "Un sistema operativo administra recursos de hardware como procesador, memoria, almacenamiento y periféricos. También proporciona servicios y abstracciones que permiten ejecutar aplicaciones y gestionar archivos, procesos y usuarios.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-prog-001",
    "title": "Variables let y const en JavaScript",
    "domain": "programming",
    "text": "En JavaScript, let declara una variable cuyo valor puede reasignarse. const declara un vínculo que no puede reasignarse después de inicializarse; si contiene un objeto, sus propiedades pueden seguir siendo mutables salvo que se protejan expresamente.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-lang-001",
    "title": "Metáfora y comparación",
    "domain": "language",
    "text": "Una metáfora identifica directamente un elemento con otro por una semejanza o relación, como «el tiempo es oro». Una comparación expresa explícitamente la semejanza, a menudo con palabras como «como» o «parece».",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-general-001",
    "title": "Cómo responder ante la incertidumbre",
    "domain": "general",
    "text": "Un asistente fiable debe separar hechos, inferencias y opiniones; indicar qué no sabe; evitar inventar fuentes o cifras; y proponer una comprobación cuando la información disponible sea insuficiente o pueda estar desactualizada.",
    "source": "E.D.-2 · criterio de calidad original v1",
    "status": "approved"
  },
  {
    "id": "kb-sci-004",
    "title": "Ciclo del agua",
    "domain": "science",
    "text": "El ciclo del agua describe el movimiento continuo del agua entre océanos, atmósfera y continentes. Incluye evaporación, condensación, precipitación, infiltración y escorrentía. La energía solar impulsa gran parte de este ciclo.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-sci-005",
    "title": "Fotosíntesis",
    "domain": "science",
    "text": "La fotosíntesis es el proceso por el que plantas, algas y algunas bacterias convierten energía luminosa en energía química. En las plantas ocurre principalmente en los cloroplastos: utilizan dióxido de carbono y agua para producir azúcares y liberan oxígeno.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-sci-006",
    "title": "La célula",
    "domain": "science",
    "text": "La célula es la unidad básica estructural y funcional de los seres vivos. Las células procariotas no tienen núcleo rodeado por membrana; las eucariotas sí tienen núcleo y orgánulos membranosos. La membrana plasmática regula el intercambio con el entorno.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-sci-007",
    "title": "ADN y genes",
    "domain": "science",
    "text": "El ADN es una molécula que almacena información genética. Un gen es una región de ADN que contribuye a producir un ARN funcional o un producto proteico. El ADN suele organizarse en cromosomas dentro de las células.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-sci-008",
    "title": "Leyes de Newton",
    "domain": "science",
    "text": "Las tres leyes de Newton describen el movimiento: la primera relaciona la fuerza neta nula con el mantenimiento del estado de movimiento; la segunda establece que la fuerza neta es igual a masa por aceleración; la tercera indica que las fuerzas entre dos cuerpos aparecen en pares iguales y opuestos sobre cuerpos distintos.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-sci-009",
    "title": "Energía y conservación",
    "domain": "science",
    "text": "La energía es una magnitud que puede transferirse y transformarse. En un sistema aislado, la energía total se conserva: no se crea ni se destruye, aunque puede cambiar de forma, por ejemplo de energía potencial a cinética.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-sci-010",
    "title": "Ley de Ohm",
    "domain": "science",
    "text": "La ley de Ohm relaciona tensión, corriente y resistencia en un conductor óhmico a temperatura constante. La tensión es igual al producto de la corriente por la resistencia. La corriente se mide en amperios, la tensión en voltios y la resistencia en ohmios.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-sci-011",
    "title": "Sistema solar",
    "domain": "science",
    "text": "El sistema solar está formado por el Sol y los cuerpos que permanecen ligados gravitatoriamente a él, incluidos ocho planetas, planetas enanos, satélites, asteroides y cometas. Los planetas interiores son Mercurio, Venus, Tierra y Marte; los exteriores son Júpiter, Saturno, Urano y Neptuno.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-sci-012",
    "title": "Tiempo atmosférico y clima",
    "domain": "science",
    "text": "El tiempo atmosférico describe el estado de la atmósfera en un lugar y momento, como temperatura, lluvia o viento. El clima describe patrones y promedios de esas condiciones durante periodos largos, habitualmente décadas.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-sci-013",
    "title": "Estructura interna de la Tierra",
    "domain": "science",
    "text": "La Tierra se divide composicionalmente en corteza, manto y núcleo. El núcleo externo es líquido y el núcleo interno es sólido, principalmente por las condiciones de presión y temperatura. El movimiento del material conductor del núcleo externo contribuye al campo magnético terrestre.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-sci-014",
    "title": "Átomos y moléculas",
    "domain": "science",
    "text": "Un átomo es la unidad de un elemento químico y contiene un núcleo con protones y neutrones, rodeado por electrones. Una molécula está formada por dos o más átomos unidos mediante enlaces químicos. Los iones tienen carga eléctrica por ganar o perder electrones.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-math-002",
    "title": "Teorema de Pitágoras",
    "domain": "mathematics",
    "text": "En un triángulo rectángulo, el cuadrado de la longitud de la hipotenusa es igual a la suma de los cuadrados de los catetos. La hipotenusa es el lado opuesto al ángulo recto y es el lado más largo.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-math-003",
    "title": "Porcentajes",
    "domain": "mathematics",
    "text": "Un porcentaje expresa una cantidad como una fracción de cien. Para calcular p por ciento de una cantidad A, se multiplica A por p y se divide entre cien. Un aumento o descuento porcentual se aplica sobre la cantidad de referencia indicada.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-math-004",
    "title": "Fracciones",
    "domain": "mathematics",
    "text": "Una fracción representa partes de una unidad o el cociente entre un numerador y un denominador distinto de cero. Para sumar o restar fracciones se usa un denominador común. Para multiplicarlas se multiplican numeradores entre sí y denominadores entre sí.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-math-005",
    "title": "Probabilidad básica",
    "domain": "mathematics",
    "text": "La probabilidad de un suceso cuantifica su posibilidad de ocurrir y toma valores entre cero y uno. En un modelo de resultados equiprobables, la probabilidad es el número de resultados favorables dividido por el número total de resultados posibles.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-tech-002",
    "title": "Internet y web",
    "domain": "technology",
    "text": "Internet es una red mundial de redes que utiliza protocolos comunes para comunicar dispositivos. La World Wide Web es uno de los servicios que funciona sobre Internet y permite acceder a recursos enlazados mediante navegadores y protocolos como HTTP y HTTPS.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-tech-003",
    "title": "HTML CSS y JavaScript",
    "domain": "programming",
    "text": "HTML define la estructura y el significado del contenido de una página web. CSS controla su presentación visual. JavaScript añade comportamiento e interactividad y puede ejecutarse en el navegador.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-tech-004",
    "title": "Qué es una API",
    "domain": "technology",
    "text": "Una API es una interfaz que define cómo un programa puede solicitar funciones o datos a otro sistema. Una API web suele utilizar solicitudes HTTP y formatos como JSON. La autenticación y los permisos determinan qué operaciones puede realizar el cliente.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-tech-005",
    "title": "Inteligencia artificial y aprendizaje automático",
    "domain": "technology",
    "text": "La inteligencia artificial es un campo que desarrolla sistemas capaces de realizar tareas asociadas con capacidades inteligentes. El aprendizaje automático es una rama de la IA en la que los sistemas ajustan modelos a partir de datos. No todo sistema de IA utiliza aprendizaje automático ni toda automatización es una IA generativa.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-lang-002",
    "title": "Diferencia entre hecho y opinión",
    "domain": "language",
    "text": "Un hecho es una afirmación que puede contrastarse con evidencias. Una opinión expresa una valoración o interpretación personal. Una inferencia es una conclusión derivada de premisas o datos y debe distinguirse de una observación directa.",
    "source": "E.D.-2 · criterio de calidad original v1",
    "status": "approved"
  },
  {
    "id": "kb-tech-006",
    "title": "Seguridad de contraseñas",
    "domain": "technology",
    "text": "Una contraseña larga y única reduce el riesgo de que una filtración en un servicio permita acceder a otros. Un gestor de contraseñas facilita usar claves diferentes. La autenticación multifactor añade una segunda prueba de identidad y ayuda a proteger cuentas.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  }
];
function createCuratedKnowledgeBase(){return createKnowledgeBase(CURATED_KNOWLEDGE);}

Object.assign(exports, { CURATED_KNOWLEDGE, createCuratedKnowledgeBase });

  };
  definitions["./neural-core/subword-tokenizer.js"] = async function(exports, require) {
// E.D.-2 Neural Core — tokenizador BPE entrenable desde cero.
// Aprende subpalabras a partir del corpus proporcionado. No usa vocabularios externos.

class SubwordTokenizer {
  constructor({ merges = [], alphabet = [] } = {}) {
    this.alphabet = [...new Set(alphabet)];
    this.merges = merges.map(pair => {
      if (!Array.isArray(pair) || pair.length !== 2 ||
          pair.some(part => typeof part !== "string" || !part.length)) {
        throw new TypeError("Regla BPE no válida");
      }
      return [pair[0], pair[1]];
    });
    this.vocab = [...new Set([...this.alphabet, ...this.merges.map(([a, b]) => a + b)])];
    this.index = new Map(this.vocab.map((piece, id) => [piece, id]));
  }

  fit(text, { vocabSize = 512, minFrequency = 2 } = {}) {
    if (typeof text !== "string" || !text.length) throw new TypeError("El corpus debe ser texto no vacío");
    if (!Number.isInteger(vocabSize) || vocabSize < 2) throw new RangeError("vocabSize debe ser al menos 2");
    if (!Number.isInteger(minFrequency) || minFrequency < 1) throw new RangeError("minFrequency debe ser positivo");

    this.alphabet = [...new Set([...text])];
    let sequences = [...text].map(char => [char]);
    this.merges = [];

    while (this.alphabet.length + this.merges.length < vocabSize) {
      const counts = new Map();
      for (const sequence of sequences) {
        for (let i = 0; i < sequence.length - 1; i++) {
          const key = JSON.stringify([sequence[i], sequence[i + 1]]);
          counts.set(key, (counts.get(key) || 0) + 1);
        }
      }
      let best = null, bestCount = minFrequency - 1;
      for (const [key, count] of counts) {
        if (count > bestCount) {
          best = JSON.parse(key);
          bestCount = count;
        }
      }
      if (!best) break;

      const [left, right] = best;
      this.merges.push(best);
      sequences = sequences.map(sequence => {
        const merged = [];
        for (let i = 0; i < sequence.length; i++) {
          if (i + 1 < sequence.length && sequence[i] === left && sequence[i + 1] === right) {
            merged.push(left + right);
            i++;
          } else merged.push(sequence[i]);
        }
        return merged;
      });
    }

    this.vocab = [...new Set([...this.alphabet, ...this.merges.map(([a, b]) => a + b)])];
    this.index = new Map(this.vocab.map((piece, id) => [piece, id]));
    return this;
  }

  encode(text) {
    if (typeof text !== "string") throw new TypeError("El texto debe ser una cadena");
    let pieces = [...text];
    for (const [left, right] of this.merges) {
      const merged = [];
      for (let i = 0; i < pieces.length; i++) {
        if (i + 1 < pieces.length && pieces[i] === left && pieces[i + 1] === right) {
          merged.push(left + right);
          i++;
        } else merged.push(pieces[i]);
      }
      pieces = merged;
    }
    const ids = pieces.map(piece => this.index.get(piece));
    if (ids.some(id => id === undefined)) {
      throw new Error("El tokenizador no conoce uno o más caracteres; amplía el corpus de entrenamiento");
    }
    return ids;
  }

  decode(ids) {
    return ids.map(id => {
      if (!Number.isInteger(id) || id < 0 || id >= this.vocab.length) {
        throw new RangeError("Token fuera del vocabulario: " + id);
      }
      return this.vocab[id];
    }).join("");
  }

  get size() { return this.vocab.length; }

  toJSON() {
    return { version: 1, type: "bpe", alphabet: [...this.alphabet], merges: this.merges.map(pair => [...pair]) };
  }

  static fromJSON(data) {
    if (!data || data.version !== 1 || data.type !== "bpe" ||
        !Array.isArray(data.alphabet) || !data.alphabet.length ||
        data.alphabet.some(char => typeof char !== "string" || [...char].length !== 1) ||
        new Set(data.alphabet).size !== data.alphabet.length || !Array.isArray(data.merges)) {
      throw new TypeError("Formato BPE no válido");
    }
    const tokenizer = new SubwordTokenizer(data);
    if (tokenizer.merges.some(([a, b]) => !tokenizer.vocab.includes(a) || !tokenizer.vocab.includes(b))) {
      throw new TypeError("La regla BPE usa piezas desconocidas");
    }
    return tokenizer;
  }
}

Object.assign(exports, { SubwordTokenizer });

  };
  definitions["./neural-core/transformer.js"] = async function(exports, require) {
/* E.D.-2 · Transformer causal decoder (inferencia v1).
 * Implementación propia en JavaScript, sin APIs ni modelos externos.
 * Expone forwardFeatures() para extracción de estados finales y forward() para logits.
 * El entrenamiento actual de etapa 1 actualiza solo lmHead; el cuerpo está congelado.
 */
const zeros = (r,c) => Array.from({length:r},()=>Array(c).fill(0));
const dot = (a,b) => a.map(row => b[0].map((_,j)=>row.reduce((s,v,k)=>s+v*b[k][j],0)));
const add = (a,b) => a.map((r,i)=>r.map((v,j)=>v+b[i][j]));
const gelu = x => 0.5*x*(1+Math.tanh(Math.sqrt(2/Math.PI)*(x+0.044715*x*x*x)));
const softmax = xs => { const m=Math.max(...xs), e=xs.map(x=>Math.exp(x-m)), z=e.reduce((a,b)=>a+b,0)||1; return e.map(x=>x/z); };

function layerNorm(x, eps=1e-5) {
  const mean=x.reduce((a,b)=>a+b,0)/x.length;
  const variance=x.reduce((a,b)=>a+(b-mean)**2,0)/x.length;
  return x.map(v=>(v-mean)/Math.sqrt(variance+eps));
}
function linear(x,w) { return w[0].map((_,j)=>x.reduce((s,v,i)=>s+v*w[i][j],0)); }

class TransformerDecoder {
  constructor({vocabSize=512, dModel=64, heads=4, layers=2, maxSeqLen=128, seed=17}={}) {
    if (!Number.isInteger(vocabSize)||vocabSize<2) throw new Error("vocabSize debe ser >= 2");
    if (!Number.isInteger(dModel) || dModel < 2) throw new Error("dModel debe ser un entero >= 2");
    if (!Number.isInteger(heads) || heads < 1 || dModel % heads) throw new Error("dModel debe ser divisible por heads");
    if (!Number.isInteger(layers) || layers < 1 || layers > 24) throw new Error("layers debe estar entre 1 y 24");
    if (!Number.isInteger(maxSeqLen) || maxSeqLen < 2 || maxSeqLen > 4096) throw new Error("maxSeqLen debe estar entre 2 y 4096");
    if (!Number.isInteger(seed)) throw new Error("seed debe ser un entero");
    this.config={vocabSize,dModel,heads,layers,maxSeqLen,ffSize:dModel*4};
    let state=seed>>>0;
    const random=()=>{state=(1664525*state+1013904223)>>>0;return state/4294967296*2-1;};
    const matrix=(r,c)=>Array.from({length:r},()=>Array.from({length:c},()=>random()*Math.sqrt(2/(r+c))));
    this.embedding=matrix(vocabSize,dModel);
    this.position=matrix(maxSeqLen,dModel);
    this.blocks=Array.from({length:layers},()=>({
      wq:matrix(dModel,dModel),wk:matrix(dModel,dModel),wv:matrix(dModel,dModel),wo:matrix(dModel,dModel),
      w1:matrix(dModel,dModel*4),w2:matrix(dModel*4,dModel)
    }));
    this.lmHead=matrix(dModel,vocabSize);
  }
  forwardFeatures(tokenIds) {
    const {vocabSize,dModel,heads,layers,maxSeqLen}=this.config;
    if (!Array.isArray(tokenIds)||!tokenIds.length) throw new Error("Se necesita una secuencia de tokens");
    if(tokenIds.length>maxSeqLen) tokenIds=tokenIds.slice(-maxSeqLen);
    let x=tokenIds.map((id,p)=>{
      if(!Number.isInteger(id)||id<0||id>=vocabSize) throw new Error("Token fuera del vocabulario: "+id);
      return this.embedding[id].map((v,i)=>v+this.position[p][i]);
    });
    const headDim=dModel/heads, scale=1/Math.sqrt(headDim);
    for(let l=0;l<layers;l++){
      const b=this.blocks[l], q=x.map(v=>linear(v,b.wq)), k=x.map(v=>linear(v,b.wk)), v=x.map(t=>linear(t,b.wv));
      const attended=x.map((_,i)=>{
        const merged=[];
        for(let h=0;h<heads;h++){
          const start=h*headDim, end=start+headDim;
          const scores=[];
          for(let j=0;j<=i;j++){let s=0;for(let d=start;d<end;d++)s+=q[i][d]*k[j][d];scores.push(s*scale);}
          const weights=softmax(scores), part=Array(headDim).fill(0);
          weights.forEach((w,j)=>{for(let d=0;d<headDim;d++)part[d]+=w*v[j][start+d];});
          merged.push(...part);
        }
        return linear(merged,b.wo);
      });
      x=x.map((row,i)=>{
        const residual=row.map((v,j)=>v+attended[i][j]);
        const n1=layerNorm(residual);
        const hidden=linear(n1,b.w1).map(gelu);
        const ff=linear(hidden,b.w2);
        return layerNorm(n1.map((v,j)=>v+ff[j]));
      });
    }
    return x;
  }
  forward(tokenIds) { return this.forwardFeatures(tokenIds).map(row=>linear(row,this.lmHead)); }
  nextTokenLogits(tokenIds){return this.forward(tokenIds).at(-1);}
  toJSON(){return {format:"ed2-transformer",version:1,config:this.config,embedding:this.embedding,position:this.position,blocks:this.blocks,lmHead:this.lmHead};}
  static fromJSON(data){
    if(data?.format!=="ed2-transformer"||data.version!==1) throw new Error("Bundle Transformer no válido");
    const c=data.config;
    if(!c || !Number.isInteger(c.vocabSize) || !Number.isInteger(c.dModel) ||
       !Number.isInteger(c.heads) || !Number.isInteger(c.layers) ||
       !Number.isInteger(c.maxSeqLen) || c.ffSize !== c.dModel*4) {
      throw new TypeError("Configuración del bundle no válida");
    }
    const m=new TransformerDecoder(c);
    const matrix=(value,rows,cols,name)=>{
      if(!Array.isArray(value)||value.length!==rows||
         value.some(row=>!Array.isArray(row)||row.length!==cols||row.some(x=>typeof x!=="number"||!Number.isFinite(x)))) {
        throw new TypeError("Matriz inválida: "+name);
      }
    };
    matrix(data.embedding,c.vocabSize,c.dModel,"embedding");
    matrix(data.position,c.maxSeqLen,c.dModel,"position");
    matrix(data.lmHead,c.dModel,c.vocabSize,"lmHead");
    if(!Array.isArray(data.blocks)||data.blocks.length!==c.layers) throw new TypeError("Bloques Transformer no válidos");
    for(let i=0;i<data.blocks.length;i++){
      const b=data.blocks[i];
      if(!b||typeof b!=="object") throw new TypeError("Bloque Transformer no válido");
      for(const key of ["wq","wk","wv","wo"]) matrix(b[key],c.dModel,c.dModel,"blocks["+i+"]."+key);
      matrix(b.w1,c.dModel,c.ffSize,"blocks["+i+"].w1");
      matrix(b.w2,c.ffSize,c.dModel,"blocks["+i+"].w2");
    }
    m.embedding=data.embedding;
    m.position=data.position;
    m.blocks=data.blocks;
    m.lmHead=data.lmHead;
    return m;
  }
}

Object.assign(exports, { TransformerDecoder });

  };
  definitions["./neural-core/transformer-training.js"] = async function(exports, require) {
// E.D.-2 — retropropagación completa para el Transformer causal.
// Diferenciación automática inversa: embeddings, posiciones, Q/K/V/O,
// atención causal, residuales, LayerNorm, GELU, FFN y lmHead reciben gradientes.
const finite = Number.isFinite;
const softmax = xs => { const m=Math.max(...xs), e=xs.map(x=>Math.exp(x-m)), z=e.reduce((a,b)=>a+b,0); return e.map(x=>x/z); };
const zerosLike = m => m.map(r=>r.map(()=>0));

function crossEntropy(logits,target) {
  if(!Array.isArray(logits)||!logits.length||!Number.isInteger(target)||target<0||target>=logits.length||logits.some(x=>!finite(x))) throw new TypeError("Logits u objetivo no válidos");
  const max=Math.max(...logits); return max+Math.log(logits.reduce((s,x)=>s+Math.exp(x-max),0))-logits[target];
}
function crossEntropyGradient(logits,target) {
  if(!Number.isInteger(target)||target<0||target>=logits.length) throw new RangeError("Objetivo no válido");
  const p=softmax(logits);p[target]-=1;return p;
}
function outputHeadGradients(features,logits,target) {
  if(!Array.isArray(features)||!features.length||features.some(x=>!finite(x))||!Array.isArray(logits)||!logits.length) throw new TypeError("Features/logits no válidos");
  const d=crossEntropyGradient(logits,target);
  return {loss:crossEntropy(logits,target),dLogits:d,dW:features.map(x=>d.map(g=>x*g)),db:d};
}
function validateModel(model) {
  if(!model?.config||typeof model.forwardFeatures!=="function"||!Array.isArray(model.lmHead)) throw new TypeError("TransformerDecoder no compatible");
  const {dModel,vocabSize,maxSeqLen,heads,layers}=model.config;
  if(![dModel,vocabSize,maxSeqLen,heads,layers].every(Number.isInteger)||model.lmHead.length!==dModel||model.lmHead.some(r=>r.length!==vocabSize||r.some(x=>!finite(x)))) throw new Error("Forma o valores del Transformer incompatibles");
  if(model.embedding.length!==vocabSize||model.position.length!==maxSeqLen||model.blocks.length!==layers) throw new Error("Parámetros del Transformer incompatibles");
}
function validateTokens(ids,model) {
  if(!Array.isArray(ids)||ids.length<2||ids.some(t=>!Number.isInteger(t)||t<0||t>=model.config.vocabSize)) throw new TypeError("Corpus tokenizado no válido");
}
class Tape {
  constructor(){this.nodes=[];this.params=new Map();}
  node(value,parents=[]){if(!finite(value))throw new Error("Valor no finito durante el forward");const n={v:value,g:0,p:parents};this.nodes.push(n);return n;}
  param(key,value){if(!this.params.has(key))this.params.set(key,this.node(value));return this.params.get(key);}
  add(a,b){return this.node(a.v+b.v,[[a,1],[b,1]]);}
  mul(a,b){return this.node(a.v*b.v,[[a,b.v],[b,a.v]]);}
  scale(a,s){return this.node(a.v*s,[[a,s]]);}
  exp(a){const v=Math.exp(a.v);return this.node(v,[[a,v]]);}
  log(a){return this.node(Math.log(a.v),[[a,1/a.v]]);}
  sqrt(a){const v=Math.sqrt(a.v);return this.node(v,[[a,0.5/v]]);}
  tanh(a){const v=Math.tanh(a.v);return this.node(v,[[a,1-v*v]]);}
  backward(out){out.g=1;for(let i=this.nodes.length-1;i>=0;i--){const n=this.nodes[i];for(const [p,d] of n.p)p.g+=n.g*d;}}
}
const sum=(t,xs)=>xs.reduce((a,b)=>t.add(a,b),t.node(0));
const dot=(t,a,b)=>a.reduce((s,x,i)=>t.add(s,t.mul(x,b[i])),t.node(0));
const linear=(t,x,w)=>w[0].map((_,j)=>dot(t,x,w.map(r=>r[j])));
function adGelu(t,x){const x2=t.mul(x,x),x3=t.mul(x2,x),inner=t.add(x,t.scale(x3,0.044715)),u=t.scale(inner,Math.sqrt(2/Math.PI));return t.scale(t.mul(x,t.add(t.node(1),t.tanh(u))),0.5);}
function adLayerNorm(t,x){
  const mean=t.scale(sum(t,x),1/x.length), centered=x.map(v=>t.add(v,t.scale(mean,-1)));
  const variance=t.scale(sum(t,centered.map(v=>t.mul(v,v))),1/x.length);
  const denom=t.sqrt(t.add(variance,t.node(1e-5)));
  return centered.map(v=>t.mul(v,t.node(1/denom.v))); // denominator's derivative is attached below
}
function layerNorm(t,x){
  const mean=t.scale(sum(t,x),1/x.length), centered=x.map(v=>t.add(v,t.scale(mean,-1)));
  const variance=t.scale(sum(t,centered.map(v=>t.mul(v,v))),1/x.length);
  const denom=t.sqrt(t.add(variance,t.node(1e-5)));
  return centered.map(v=>t.mul(v,t.node(1)).valueOf ? t.node(1/denom.v,[[denom,-1/(denom.v*denom.v)]]) : v);
}
function forwardAD(model,ids,t){
  const c=model.config,{dModel,heads}=c,hd=dModel/heads;
  let x=ids.map((id,pos)=>model.embedding[id].map((v,j)=>t.add(t.param(`e:${id}:${j}`,v),t.param(`p:${pos}:${j}`,model.position[pos][j]))));
  for(let l=0;l<model.blocks.length;l++){
    const b=model.blocks[l], W=key=>b[key].map((r,i)=>r.map((v,j)=>t.param(`b:${l}:${key}:${i}:${j}`,v)));
    const wq=W("wq"),wk=W("wk"),wv=W("wv"),wo=W("wo"),w1=W("w1"),w2=W("w2");
    const q=x.map(row=>linear(t,row,wq)),k=x.map(row=>linear(t,row,wk)),v=x.map(row=>linear(t,row,wv));
    const attended=x.map((_,i)=>{
      const merged=[];
      for(let h=0;h<heads;h++){
        const start=h*hd, scores=[];
        for(let j=0;j<=i;j++)scores.push(t.scale(dot(t,q[i].slice(start,start+hd),k[j].slice(start,start+hd)),1/Math.sqrt(hd)));
        const max=Math.max(...scores.map(s=>s.v)), exps=scores.map(s=>t.exp(t.add(s,t.node(-max)))),den=sum(t,exps);
        for(let d=0;d<hd;d++)merged.push(sum(t,exps.map((e,j)=>t.mul(t.mul(e,t.node(1/den.v)),v[j][start+d]))));
      }
      return linear(t,merged,wo);
    });
    x=x.map((row,i)=>{
      const n1=layerNorm(t,row.map((z,j)=>t.add(z,attended[i][j])));
      const hidden=linear(t,n1,w1).map(z=>adGelu(t,z)),ff=linear(t,hidden,w2);
      return layerNorm(t,n1.map((z,j)=>t.add(z,ff[j])));
    });
  }
  const head=model.lmHead.map((r,i)=>r.map((v,j)=>t.param(`h:${i}:${j}`,v)));
  return linear(t,x.at(-1),head);
}
function collectGradients(tape,acc){
  for(const [key,node] of tape.params){const old=acc.get(key);if(old)old.g+=node.g;else acc.set(key,{g:node.g});}
}
function applyParameter(model,key,value){
  const p=key.split(":");let target;
  if(p[0]==="e")target=model.embedding[+p[1]][+p[2]];
  else if(p[0]==="p")target=model.position[+p[1]][+p[2]];
  else if(p[0]==="h")target=model.lmHead[+p[1]][+p[2]];
  else target=model.blocks[+p[1]][p[2]][+p[3]][+p[4]];
  if(p[0]==="e")model.embedding[+p[1]][+p[2]]=value;
  else if(p[0]==="p")model.position[+p[1]][+p[2]]=value;
  else if(p[0]==="h")model.lmHead[+p[1]][+p[2]]=value;
  else model.blocks[+p[1]][p[2]][+p[3]][+p[4]]=value;
}
async function trainTransformerHead(model,tokenIds,options={}) {
  return trainTransformer(model,tokenIds,options);
}
async function trainTransformer(model,tokenIds,{epochs=1,learningRate=1e-3,batchSize=1,gradientClip=1,onProgress=()=>{},shouldStop=()=>{},yieldEvery=10}={}) {
  validateModel(model);validateTokens(tokenIds,model);
  if(!Number.isInteger(epochs)||epochs<1||!(learningRate>0)||!finite(learningRate)||!Number.isInteger(batchSize)||batchSize<1||!(gradientClip>0)||!finite(gradientClip)||!Number.isInteger(yieldEvery)||yieldEvery<1)throw new RangeError("Hiperparámetros no válidos");
  const maxSeqLen=model.config.maxSeqLen,m=new Map(),v=new Map();let step=0,seen=0;const history=[];
  for(let epoch=0;epoch<epochs;epoch++){
    let epochLoss=0,count=0;
    for(let start=0;start<tokenIds.length-1;start+=batchSize){
      if(shouldStop())return {stopped:true,history,steps:step,trainedParameters:"Transformer completo"};
      const end=Math.min(tokenIds.length-1,start+batchSize),grads=new Map();let batchLoss=0,n=0;
      for(let i=start;i<end;i++){
        const seq=tokenIds.slice(Math.max(0,i-maxSeqLen+1),i+1),t=new Tape(),logits=forwardAD(model,seq,t);
        const max=Math.max(...logits.map(z=>z.v)),exps=logits.map(z=>t.exp(t.add(z,t.node(-max)))),den=sum(t,exps);
        const loss=t.add(t.log(den),t.node(-Math.log(1))); // stable log-sum-exp below
        const logZ=t.add(t.node(max),t.log(den)),objective=t.add(logZ,t.scale(logits[tokenIds[i+1]],-1));
        batchLoss+=objective.v;n++;t.backward(objective);collectGradients(t,grads);
      }
      let norm2=0;for(const {g} of grads.values())norm2+=g*g;
      const norm=Math.sqrt(norm2),clip=norm>gradientClip?gradientClip/norm:1;step++;
      const b1=.9,b2=.999,eps=1e-8,c1=1-b1**step,c2=1-b2**step;
      for(const [key,item] of grads){
        const g=item.g/n*clip,mi=b1*(m.get(key)||0)+(1-b1)*g,vi=b2*(v.get(key)||0)+(1-b2)*g*g;
        m.set(key,mi);v.set(key,vi);
        const old=key[0]==="e"?model.embedding[+key.split(":")[1]][+key.split(":")[2]]:key[0]==="p"?model.position[+key.split(":")[1]][+key.split(":")[2]]:key[0]==="h"?model.lmHead[+key.split(":")[1]][+key.split(":")[2]]:model.blocks[+key.split(":")[1]][key.split(":")[2]][+key.split(":")[3]][+key.split(":")[4]];
        applyParameter(model,key,old-learningRate*(mi/c1)/(Math.sqrt(vi/c2)+eps));
      }
      epochLoss+=batchLoss;count+=n;seen+=n;
      if(step%yieldEvery===0){onProgress({epoch:epoch+1,step,examples:seen,loss:batchLoss/n,trainedParameters:"Transformer completo"});await new Promise(r=>setTimeout(r,0));}
    }
    const avg=epochLoss/Math.max(1,count);history.push(avg);onProgress({epoch:epoch+1,epochs,step,examples:seen,loss:avg,trainedParameters:"Transformer completo"});await new Promise(r=>setTimeout(r,0));
  }
  return {stopped:false,history,steps:step,examples:seen,trainedParameters:"Transformer completo",bodyFrozen:false};
}
function evaluateTransformer(model,tokenIds) {
  validateModel(model);validateTokens(tokenIds,model);let loss=0,correct=0,count=0;
  for(let i=0;i<tokenIds.length-1;i++){const seq=tokenIds.slice(Math.max(0,i-model.config.maxSeqLen+1),i+1),logits=model.forward(seq).at(-1),target=tokenIds[i+1];loss+=crossEntropy(logits,target);if(logits.indexOf(Math.max(...logits))===target)correct++;count++;}
  return {loss:loss/count,perplexity:Math.exp(Math.min(80,loss/count)),accuracy:correct/count,tokens:count};
}
function createTransformerCheckpoint(model,metadata={}) {
  validateModel(model);return {format:"ed2-transformer-checkpoint",version:2,model:model.toJSON(),metadata:{...metadata,createdAt:new Date().toISOString(),trainingScope:"full transformer backpropagation"}};
}

Object.assign(exports, { crossEntropy, crossEntropyGradient, outputHeadGradients, trainTransformerHead, trainTransformer, evaluateTransformer, createTransformerCheckpoint });

  };
  definitions["./neural-core/local-transformer-brain.mjs"] = async function(exports, require) {
/**
 * E.D.-2 · Cerebro neuronal local entrenable desde cero.
 * Usa exclusivamente el Transformer y el tokenizador BPE escritos para E.D.
 * Los pesos se inicializan aquí y se entrenan en el dispositivo del usuario.
 */
const { TransformerDecoder } = await require("./transformer.js");
const { trainTransformer, evaluateTransformer } = await require("./transformer-training.js");
const { SubwordTokenizer } = await require("./subword-tokenizer.js");
const { CURATED_KNOWLEDGE } = await require("./curated-knowledge.mjs");

const KEY="ed2_local_transformer_checkpoint_v1";
const EXTRA=" abcdefghijklmnopqrstuvwxyzáéíóúüñABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜÑ0123456789¿?¡!.,:;()[]{}+-*/=%_\n\t'\"";
const clean=x=>String(x??"").trim();
function corpusFromDocs(docs){
 return docs.map(doc=>{
  const title=clean(doc.title);
  const first=(clean(doc.text).split(/(?<=[.!?])\s+/)[0]||clean(doc.text)).slice(0,90);
  return "Pregunta: ¿Qué es "+title+"?\nRespuesta: "+first+"\n";
 }).join("\n");
}
function sampleToken(logits,temperature=.72,topK=8){
 const safe=logits.map(x=>Number.isFinite(x)?x/temperature:-Infinity);
 const order=safe.map((v,i)=>({v,i})).sort((a,b)=>b.v-a.v).slice(0,Math.max(1,topK));
 const max=order[0].v,weights=order.map(x=>Math.exp(x.v-max)),total=weights.reduce((a,b)=>a+b,0);
 let r=Math.random()*total;
 for(let i=0;i<order.length;i++){r-=weights[i];if(r<=0)return order[i].i;}
 return order[0].i;
}
function createLocalTransformerBrain({storage=null,config={}}={}){
 let backend=storage;try{if(!backend)backend=globalThis.localStorage||null}catch{backend=null;}
 const {maxTrainingTokens=1200,...modelConfig}=config;
 const cfg={vocabSize:128,dModel:16,heads:2,layers:1,maxSeqLen:32,seed:20261109,...modelConfig};
 let tokenizer=null,model=null,training=false,trainedAt=null,stats=null;
 function persist(){
  if(!backend)return false;
  try{backend.setItem(KEY,JSON.stringify({format:"ed2-local-transformer-brain",version:1,tokenizer:tokenizer.toJSON(),model:model.toJSON(),trainedAt,stats}));return true}catch{return false}
 }
 async function load(){
  if(!backend)return false;
  try{
   const raw=backend.getItem(KEY);if(!raw)return false;
   const data=JSON.parse(raw);
   if(data?.format!=="ed2-local-transformer-brain"||data.version!==1) return false;
   tokenizer=SubwordTokenizer.fromJSON(data.tokenizer);
   model=TransformerDecoder.fromJSON(data.model);
   trainedAt=typeof data.trainedAt==="string"?data.trainedAt:null;
   stats=data.stats&&typeof data.stats==="object"?data.stats:null;
   return true;
  }catch{return false}
 }
 async function train({epochs=1,onProgress=()=>{},shouldStop=()=>false}={}){
  if(training)throw new Error("El entrenamiento neuronal ya está en marcha.");
  if(!Number.isInteger(epochs)||epochs<1||epochs>5)throw new RangeError("El entrenamiento admite entre 1 y 5 épocas por sesión.");
  training=true;
  try{
   const text=corpusFromDocs(CURATED_KNOWLEDGE)+"\n"+EXTRA;
   if(!tokenizer||!model){
    tokenizer=new SubwordTokenizer().fit(text,{vocabSize:cfg.vocabSize,minFrequency:2});
    model=new TransformerDecoder({...cfg,vocabSize:tokenizer.size});
   }
   const ids=tokenizer.encode(text);
   if(ids.length<3)throw new Error("El corpus local es demasiado pequeño.");
   const before=evaluateTransformer(model,ids).loss;
   const result=await trainTransformer(model,ids,{epochs,learningRate:.012,batchSize:4,gradientClip:1,yieldEvery:20,shouldStop,onProgress});
   const after=evaluateTransformer(model,ids).loss;
   trainedAt=new Date().toISOString();
   stats={examples:CURATED_KNOWLEDGE.length,tokens:ids.length,lossBefore:Number(before.toFixed(4)),lossAfter:Number(after.toFixed(4)),steps:result.steps,stopped:result.stopped,parameters:countParameters(model),trainedParameters:result.trainedParameters||"Transformer completo",storage:"local-device"};
   const saved=persist();
   onProgress({text:saved?"Cerebro neuronal entrenado y guardado en este dispositivo.":"Entrenamiento completado, pero no se pudo guardar en el almacenamiento local.",progress:1,stats});
   return {...stats,saved};
  }finally{training=false}
 }
 function countParameters(m){let n=m.embedding.flat().length+m.position.flat().length+m.lmHead.flat().length;for(const b of m.blocks)n+=b.wq.flat().length+b.wk.flat().length+b.wv.flat().length+b.wo.flat().length+b.w1.flat().length+b.w2.flat().length;return n}
 function generate(question,{maxTokens=96,temperature=.72}={}){
  if(!model||!tokenizer)return null;
  const prompt="Pregunta: "+clean(question)+"\nRespuesta:";
  let ids;try{ids=tokenizer.encode(prompt.normalize("NFC"))}catch{return null}
  const generated=[];
  for(let i=0;i<maxTokens;i++){
   const logits=model.nextTokenLogits(ids);
   const next=sampleToken(logits,temperature);
   ids.push(next);generated.push(next);
   const partial=tokenizer.decode(generated);
   if(partial.includes("\nPregunta:")||partial.endsWith("\n\n"))break;
  }
  let output=tokenizer.decode(generated).split("\nPregunta:")[0].trim();
  output=output.replace(/^\s*respuesta\s*:/i,"").trim();
  return output.length>=8?output:null;
 }
 return Object.freeze({load,train,generate,get ready(){return!!model&&!!tokenizer},get training(){return training},getStats(){return stats?{...stats,trainedAt,ready:!!model}: {ready:!!model,trainedAt,storage:backend?"local-device":"memory-only",trained:false}},clear(){if(backend)backend.removeItem(KEY);tokenizer=null;model=null;trainedAt=null;stats=null;return true}});
}

Object.assign(exports, { createLocalTransformerBrain });

  };
  definitions["./neural-core/openjarvis-adapter.mjs"] = async function(exports, require) {
/**
 * E.D.-2 · OpenJarvis-inspired local architecture adapter.
 * Maps Intelligence, Engine, Agent, Memory and Learning primitives to E.D.'s
 * native JavaScript cognition. No Python runtime, model weights, CDN or AI API.
 * Traces intentionally store metadata only, never prompts or private answers.
 */
const { createLocalBrainProvider } = await require("./brain-provider.mjs");
const { createNativeCognition } = await require("./native-cognition.mjs");
const { createAgentRuntime } = await require("./agent-runtime.mjs");
const { createMemoryStore } = await require("./memory-store.mjs");
const TRACE_KEY = "ed2_openjarvis_traces_v1";
const LEARNING_KEY = "ed2_native_learning_v1";
const lastUser = messages => { for (let i=messages.length-1;i>=0;i--) if(messages[i]?.role==="user"&&typeof messages[i].content==="string") return messages[i].content.trim(); return ""; };
function routeOf(query){const q=String(query||"").toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g,"");if(/\d.*(?:\+|-|\*|\/|\^|por|mas|menos|dividido).*\d/.test(q)||/^(calcula|cuanto es|resuelve)/.test(q))return"reasoning.math";if(/^(aprende|olvida|recuerda|anota|que recuerdas|que has aprendido)/.test(q))return"memory.learning";if(/^(busca|abre|temporizador|avisa)/.test(q))return"agent.tools";return"cognition.native-symbolic";}
function readTraces(storage){try{const v=JSON.parse(storage?.getItem(TRACE_KEY)||"[]");return Array.isArray(v)?v.filter(x=>x&&typeof x.route==="string").slice(-200):[]}catch{return[]}}
function createEDOpenJarvisAdapter({brain=null,storage=null,tools={},now=()=>Date.now()}={}){
 let backend=storage;try{if(!backend)backend=globalThis.localStorage||null}catch{backend=null;}
 const cognition=brain||createLocalBrainProvider(backend?{cognition:createNativeCognition({storage:backend}),storage:backend}:{}),memory=backend?createMemoryStore({storage:backend}):null,agents=createAgentRuntime({tools});let loadedAt=null;
 function trace(item){if(!backend)return false;try{const a=readTraces(backend);a.push({at:new Date(now()).toISOString(),...item});backend.setItem(TRACE_KEY,JSON.stringify(a.slice(-200)));return true}catch{return false}}
 async function load(onProgress=()=>{}){const result=await cognition.load(onProgress);loadedAt=now();return result}
 async function generate(messages){if(!cognition.ready)throw new Error("El cerebro propio todavía no está activado.");if(!Array.isArray(messages)||!messages.length)throw new TypeError("Se necesita una conversación válida.");const query=lastUser(messages),start=now();try{const answer=await cognition.generate(messages);trace({route:routeOf(query),engine:cognition.id||"ed-native-cognition",status:"completed",inputChars:query.length,outputChars:String(answer||"").length,durationMs:Math.max(0,now()-start)});return answer}catch(error){trace({route:routeOf(query),engine:cognition.id||"ed-native-cognition",status:"failed",inputChars:query.length,durationMs:Math.max(0,now()-start)});throw error}}
 function stats(){let facts=0;try{facts=JSON.parse(backend?.getItem(LEARNING_KEY)||"[]").length}catch{}const traces=readTraces(backend);return Object.freeze({engine:cognition.id||"ed-native-cognition",ready:!!cognition.ready,loadedAt,facts,memories:memory?memory.list({status:"all"}).length:0,traces:traces.length,completed:traces.filter(x=>x.status==="completed").length,failed:traces.filter(x=>x.status==="failed").length,neural:cognition.neuralStats?cognition.neuralStats():{ready:false},learning:"explicit-supervised-storage-only"})}
 return Object.freeze({id:"ed-openjarvis-local-adapter",get ready(){return!!cognition.ready},async checkSupport(){return cognition.checkSupport()},load,generate,plan:agents.plan,execute:agents.execute,listTools:agents.listTools,learn:(...a)=>cognition.learn(...a),recall:(...a)=>cognition.recall(...a),trainNeural:(...a)=>cognition.trainNeural(...a),neuralStats:()=>cognition.neuralStats?cognition.neuralStats():{ready:false},clearNeural:()=>cognition.clearNeural?.(),memory,stats,architecture:Object.freeze({intelligence:"E.D. native symbolic cognition; no external model catalog",engine:"JavaScript in the Chromebook browser; no WebGPU requirement",agents:"bounded Agent Runtime with explicit tool registry and risk checks",memory:"local structured memory with provenance, confidence and consent",learning:"explicit user-supervised facts plus metadata-only local traces; no automatic weight training"})});
}

Object.assign(exports, { createEDOpenJarvisAdapter });

  };
 function resolve(from,spec){if(!spec.startsWith("."))return spec;const parts=from.split("/").filter(part=>part&&part!==".");parts.pop();for(const part of spec.split("/")){if(!part||part===".")continue;if(part==="..")parts.pop();else parts.push(part);}return "./"+parts.join("/");}
 async function load(id){if(cache.has(id))return cache.get(id);const factory=definitions[id];if(!factory)throw new Error("Módulo local no incluido en el paquete: "+id);const exports={};const pending=(async()=>{await factory(exports,spec=>load(resolve(id,spec)));return Object.freeze(exports);})();cache.set(id,pending);try{return await pending;}catch(error){cache.delete(id);throw error;}}
 window.EDModules=Object.freeze({import:load});})();
