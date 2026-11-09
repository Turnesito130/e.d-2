/**
 * E.D.-2 · Cerebro neuronal local entrenable desde cero.
 * Usa exclusivamente el Transformer y el tokenizador BPE escritos para E.D.
 * Los pesos se inicializan aquí y se entrenan en el dispositivo del usuario.
 */
import { TransformerDecoder } from "./transformer.js";
import { trainTransformer, evaluateTransformer } from "./transformer-training.js";
import { SubwordTokenizer } from "./subword-tokenizer.js";
import { CURATED_KNOWLEDGE } from "./curated-knowledge.mjs";

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
export function createLocalTransformerBrain({storage=null,config={}}={}){
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
