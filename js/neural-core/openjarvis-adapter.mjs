/**
 * E.D.-2 · OpenJarvis-inspired local architecture adapter.
 * Maps Intelligence, Engine, Agent, Memory and Learning primitives to E.D.'s
 * native JavaScript cognition. No Python runtime, model weights, CDN or AI API.
 * Traces intentionally store metadata only, never prompts or private answers.
 */
import { createLocalBrainProvider } from "./brain-provider.mjs";
import { createNativeCognition } from "./native-cognition.mjs";
import { createAgentRuntime } from "./agent-runtime.mjs";
import { createMemoryStore } from "./memory-store.mjs";
const TRACE_KEY = "ed2_openjarvis_traces_v1";
const LEARNING_KEY = "ed2_native_learning_v1";
const lastUser = messages => { for (let i=messages.length-1;i>=0;i--) if(messages[i]?.role==="user"&&typeof messages[i].content==="string") return messages[i].content.trim(); return ""; };
function routeOf(query){const q=String(query||"").toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g,"");if(/\d.*(?:\+|-|\*|\/|\^|por|mas|menos|dividido).*\d/.test(q)||/^(calcula|cuanto es|resuelve)/.test(q))return"reasoning.math";if(/^(aprende|olvida|recuerda|anota|que recuerdas|que has aprendido)/.test(q))return"memory.learning";if(/^(busca|abre|temporizador|avisa)/.test(q))return"agent.tools";return"cognition.native-symbolic";}
function readTraces(storage){try{const v=JSON.parse(storage?.getItem(TRACE_KEY)||"[]");return Array.isArray(v)?v.filter(x=>x&&typeof x.route==="string").slice(-200):[]}catch{return[]}}
export function createEDOpenJarvisAdapter({brain=null,storage=null,tools={},now=()=>Date.now()}={}){
 let backend=storage;try{if(!backend)backend=globalThis.localStorage||null}catch{backend=null;}
 const cognition=brain||createLocalBrainProvider(backend?{cognition:createNativeCognition({storage:backend})}:{}),memory=backend?createMemoryStore({storage:backend}):null,agents=createAgentRuntime({tools});let loadedAt=null;
 function trace(item){if(!backend)return false;try{const a=readTraces(backend);a.push({at:new Date(now()).toISOString(),...item});backend.setItem(TRACE_KEY,JSON.stringify(a.slice(-200)));return true}catch{return false}}
 async function load(onProgress=()=>{}){const result=await cognition.load(onProgress);loadedAt=now();return result}
 async function generate(messages){if(!cognition.ready)throw new Error("El cerebro propio todavía no está activado.");if(!Array.isArray(messages)||!messages.length)throw new TypeError("Se necesita una conversación válida.");const query=lastUser(messages),start=now();try{const answer=await cognition.generate(messages);trace({route:routeOf(query),engine:cognition.id||"ed-native-cognition",status:"completed",inputChars:query.length,outputChars:String(answer||"").length,durationMs:Math.max(0,now()-start)});return answer}catch(error){trace({route:routeOf(query),engine:cognition.id||"ed-native-cognition",status:"failed",inputChars:query.length,durationMs:Math.max(0,now()-start)});throw error}}
 function stats(){let facts=0;try{facts=JSON.parse(backend?.getItem(LEARNING_KEY)||"[]").length}catch{}const traces=readTraces(backend);return Object.freeze({engine:cognition.id||"ed-native-cognition",ready:!!cognition.ready,loadedAt,facts,memories:memory?memory.list({status:"all"}).length:0,traces:traces.length,completed:traces.filter(x=>x.status==="completed").length,failed:traces.filter(x=>x.status==="failed").length,learning:"explicit-supervised-storage-only"})}
 return Object.freeze({id:"ed-openjarvis-local-adapter",get ready(){return!!cognition.ready},async checkSupport(){return cognition.checkSupport()},load,generate,plan:agents.plan,execute:agents.execute,listTools:agents.listTools,learn:(...a)=>cognition.learn(...a),recall:(...a)=>cognition.recall(...a),memory,stats,architecture:Object.freeze({intelligence:"E.D. native symbolic cognition; no external model catalog",engine:"JavaScript in the Chromebook browser; no WebGPU requirement",agents:"bounded Agent Runtime with explicit tool registry and risk checks",memory:"local structured memory with provenance, confidence and consent",learning:"explicit user-supervised facts plus metadata-only local traces; no automatic weight training"})});
}
