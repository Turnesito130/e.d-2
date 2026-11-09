import { calculateNaturalExpression } from "./natural-calculator.js";
import { inferRelation } from "./inference-engine.mjs";
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

export function createNativeCognition({storage=null}={}){
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