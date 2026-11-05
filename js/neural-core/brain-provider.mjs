import { createNativeCognition } from "./native-cognition.mjs";
export function createLocalBrainProvider({cognition=null}={}){
 const brain=cognition||createNativeCognition();let ready=false,loading=null;
 return Object.freeze({id:"ed-native-cognition",get ready(){return ready},
 async checkSupport(){return {supported:true,reason:"Funciona en JavaScript estándar; no requiere WebGPU."}},
 async load(onProgress=()=>{}){if(ready)return true;if(loading)return loading;loading=Promise.resolve().then(async()=>{onProgress({text:"Preparando el cerebro cognitivo propio…",progress:.5});await brain.load();ready=true;onProgress({text:"Cerebro propio activado en este dispositivo.",progress:1});return true});try{return await loading}finally{loading=null}},
 async generate(ms){if(!ready)throw new Error("El cerebro propio todavía no está activado.");if(!Array.isArray(ms)||!ms.length)throw new TypeError("Se necesita una conversación válida.");return brain.generate(ms)},
 learn:(...a)=>brain.learn(...a),recall:(...a)=>brain.recall(...a)
 });
}