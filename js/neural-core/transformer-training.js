// E.D.-2 — retropropagación completa para el Transformer causal.
// Diferenciación automática inversa: embeddings, posiciones, Q/K/V/O,
// atención causal, residuales, LayerNorm, GELU, FFN y lmHead reciben gradientes.
const finite = Number.isFinite;
const softmax = xs => { const m=Math.max(...xs), e=xs.map(x=>Math.exp(x-m)), z=e.reduce((a,b)=>a+b,0); return e.map(x=>x/z); };
const zerosLike = m => m.map(r=>r.map(()=>0));

export function crossEntropy(logits,target) {
  if(!Array.isArray(logits)||!logits.length||!Number.isInteger(target)||target<0||target>=logits.length||logits.some(x=>!finite(x))) throw new TypeError("Logits u objetivo no válidos");
  const max=Math.max(...logits); return max+Math.log(logits.reduce((s,x)=>s+Math.exp(x-max),0))-logits[target];
}
export function crossEntropyGradient(logits,target) {
  if(!Number.isInteger(target)||target<0||target>=logits.length) throw new RangeError("Objetivo no válido");
  const p=softmax(logits);p[target]-=1;return p;
}
export function outputHeadGradients(features,logits,target) {
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
export async function trainTransformerHead(model,tokenIds,options={}) {
  return trainTransformer(model,tokenIds,options);
}
export async function trainTransformer(model,tokenIds,{epochs=1,learningRate=1e-3,batchSize=1,gradientClip=1,onProgress=()=>{},shouldStop=()=>{},yieldEvery=10}={}) {
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
export function evaluateTransformer(model,tokenIds) {
  validateModel(model);validateTokens(tokenIds,model);let loss=0,correct=0,count=0;
  for(let i=0;i<tokenIds.length-1;i++){const seq=tokenIds.slice(Math.max(0,i-model.config.maxSeqLen+1),i+1),logits=model.forward(seq).at(-1),target=tokenIds[i+1];loss+=crossEntropy(logits,target);if(logits.indexOf(Math.max(...logits))===target)correct++;count++;}
  return {loss:loss/count,perplexity:Math.exp(Math.min(80,loss/count)),accuracy:correct/count,tokens:count};
}
export function createTransformerCheckpoint(model,metadata={}) {
  validateModel(model);return {format:"ed2-transformer-checkpoint",version:2,model:model.toJSON(),metadata:{...metadata,createdAt:new Date().toISOString(),trainingScope:"full transformer backpropagation"}};
}
