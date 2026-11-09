import { createNativeCognition } from "./native-cognition.mjs";
import { createLocalTransformerBrain } from "./local-transformer-brain.mjs";
function lastUser(messages){for(let i=(messages?.length||0)-1;i>=0;i--)if(messages[i]?.role==="user"&&typeof messages[i].content==="string")return messages[i].content.trim();return "";}
const COMMON_ES=new Set(["el","la","los","las","de","del","y","en","un","una","que","es","por","para","con","se","su","como","más","mas","son","al","este","esta","puede","entre","sobre","también","cuando","porque","pero","o","a","no"]);
function readableProposal(value){const text=String(value||"");const words=text.toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g,"").match(/[a-z]{2,}/g)||[];const letters=(text.match(/[a-záéíóúüñ]/gi)||[]).length;const compact=text.replace(/\s/g,"");const common=words.filter(word=>COMMON_ES.has(word)).length;return words.length>=5&&common>=2&&letters/Math.max(1,compact.length)>=.72;}
export function createLocalBrainProvider({cognition=null,storage=null}={}){
 const brain=cognition||createNativeCognition({storage});
 const neural=createLocalTransformerBrain({storage});
 let ready=false,loading=null;
 return Object.freeze({id:"ed-native-cognition+ed-transformer",get ready(){return ready},
 async checkSupport(){return {supported:true,reason:"El núcleo simbólico y el Transformer propio funcionan en JavaScript/WebAssembly CPU; no requieren WebGPU ni servicios de IA externos."}},
 async load(onProgress=()=>{}){if(ready)return true;if(loading)return loading;loading=Promise.resolve().then(async()=>{onProgress({text:"Preparando el cerebro cognitivo propio…",progress:.25});await brain.load();onProgress({text:"Buscando un cerebro neuronal entrenado en este dispositivo…",progress:.55});await neural.load();ready=true;onProgress({text:neural.ready?"Cerebro propio y pesos neuronales locales cargados.":"Cerebro simbólico propio activo; el Transformer todavía no está entrenado.",progress:1});return true});try{return await loading}finally{loading=null}},
 async generate(ms){if(!ready)throw new Error("El cerebro propio todavía no está activado.");const answer=await brain.generate(ms);if(/^Todavía no tengo conocimientos suficientes/i.test(answer)&&neural.ready){const proposal=neural.generate(lastUser(ms));if(proposal&&readableProposal(proposal))return "Mi Transformer propio propone esta respuesta experimental (todavía no verificada):\n"+proposal;}return answer},
 learn:(...a)=>brain.learn(...a),recall:(...a)=>brain.recall(...a),
 trainNeural:(...a)=>neural.train(...a),neuralStats:()=>neural.getStats(),clearNeural:()=>neural.clear()
 });
}