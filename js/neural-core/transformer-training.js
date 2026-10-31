// E.D.-2 — entrenamiento verificable de la cabeza de salida del Transformer.
// Las capas de atención/FFN permanecen congeladas en esta etapa.
// No representa retropropagación completa del Transformer.
const finite = Number.isFinite;
const softmax = (xs) => {
  const max = Math.max(...xs);
  const exps = xs.map(x => Math.exp(x - max));
  const sum = exps.reduce((a,b)=>a+b,0);
  return exps.map(x=>x/sum);
};
const zerosLike = (m) => m.map(r=>r.map(()=>0));

export function crossEntropy(logits, target) {
  if (!Array.isArray(logits) || !logits.length || !Number.isInteger(target) || target<0 || target>=logits.length || logits.some(x=>!finite(x))) {
    throw new TypeError("Logits u objetivo no válidos");
  }
  const max=Math.max(...logits);
  const logZ=max+Math.log(logits.reduce((s,x)=>s+Math.exp(x-max),0));
  return logZ-logits[target];
}

// Derivada analítica de softmax + cross entropy respecto a logits.
export function crossEntropyGradient(logits,target) {
  const p=softmax(logits);
  if(!Number.isInteger(target)||target<0||target>=p.length) throw new RangeError("Objetivo no válido");
  p[target]-=1;
  return p;
}

// Gradiente de la proyección lineal final. El cuerpo Transformer se trata como extractor congelado.
export function outputHeadGradients(features, logits, target) {
  if(!Array.isArray(features)||!features.length||features.some(x=>!finite(x))||
     !Array.isArray(logits)||!logits.length) throw new TypeError("Features/logits no válidos");
  const d=crossEntropyGradient(logits,target);
  return {
    loss:crossEntropy(logits,target),
    dLogits:d,
    dW:features.map(x=>d.map(g=>x*g)),
    db:d
  };
}

function validateModel(model) {
  if(!model?.config||typeof model.forwardFeatures!=="function"||!Array.isArray(model.lmHead)) throw new TypeError("TransformerDecoder no compatible");
  const {dModel,vocabSize,maxSeqLen}=model.config;
  if(!Number.isInteger(dModel)||!Number.isInteger(vocabSize)||!Number.isInteger(maxSeqLen)||
     model.lmHead.length!==dModel||model.lmHead.some(r=>!Array.isArray(r)||r.length!==vocabSize||r.some(x=>!finite(x)))) {
    throw new Error("Forma o valores de lmHead incompatibles");
  }
}
function validateTokens(tokenIds, model) {
  if(!Array.isArray(tokenIds)||tokenIds.length<2||
     tokenIds.some(t=>!Number.isInteger(t)||t<0||t>=model.config.vocabSize)) {
    throw new TypeError("Corpus tokenizado no válido");
  }
}
function getLastFeatures(model, sequence) {
  const rows=model.forwardFeatures(sequence);
  const features=rows?.at(-1);
  if(!Array.isArray(features)||features.length!==model.config.dModel||features.some(x=>!finite(x))) {
    throw new Error("El Transformer devolvió features no válidas");
  }
  return features;
}

// Forward expuesto por el Transformer debe devolver features finales mediante forwardFeatures().
export async function trainTransformerHead(model, tokenIds, {
  epochs=1, learningRate=1e-3, batchSize=8, gradientClip=1, onProgress=()=>{}, shouldStop=()=>{}, yieldEvery=100
}={}) {
  validateModel(model);
  validateTokens(tokenIds,model);
  if(!Number.isInteger(epochs)||epochs<1||!(learningRate>0)||!finite(learningRate)||!Number.isInteger(batchSize)||batchSize<1||!(gradientClip>0)||!Number.isInteger(yieldEvery)||yieldEvery<1) throw new RangeError("Hiperparámetros no válidos");
  const {dModel,vocabSize,maxSeqLen}=model.config;
  const m=zerosLike(model.lmHead),v=zerosLike(model.lmHead);
  let step=0, seen=0, running=0;
  const history=[];
  for(let epoch=0;epoch<epochs;epoch++){
    let epochLoss=0, count=0;
    for(let start=0;start<tokenIds.length-1;start+=batchSize){
      if(shouldStop()) return {stopped:true,history,steps:step,trainedParameters:"lmHead only"};
      const end=Math.min(tokenIds.length-1,start+batchSize);
      const gw=zerosLike(model.lmHead);
      let batchLoss=0, n=0;
      for(let i=start;i<end;i++){
        const seq=tokenIds.slice(Math.max(0,i-maxSeqLen+1),i+1);
        const features=getLastFeatures(model,seq);
        const logits=model.lmHead[0].map((_,j)=>features.reduce((s,x,k)=>s+x*model.lmHead[k][j],0));
        const grads=outputHeadGradients(features,logits,tokenIds[i+1]);
        batchLoss+=grads.loss;n++;
        for(let k=0;k<dModel;k++) for(let j=0;j<vocabSize;j++) gw[k][j]+=grads.dW[k][j];
      }
      for(let k=0;k<dModel;k++) for(let j=0;j<vocabSize;j++) gw[k][j]/=n;
      let norm2=0;
      for(const row of gw) for(const x of row) norm2+=x*x;
      const norm=Math.sqrt(norm2), scale=norm>gradientClip?gradientClip/norm:1;
      step++;
      const b1=.9,b2=.999,eps=1e-8,c1=1-b1**step,c2=1-b2**step;
      for(let k=0;k<dModel;k++) for(let j=0;j<vocabSize;j++){
        const g=gw[k][j]*scale;
        m[k][j]=b1*m[k][j]+(1-b1)*g;v[k][j]=b2*v[k][j]+(1-b2)*g*g;
        model.lmHead[k][j]-=learningRate*(m[k][j]/c1)/(Math.sqrt(v[k][j]/c2)+eps);
      }
      epochLoss+=batchLoss;count+=n;seen+=n;running+=batchLoss;
      if(step%yieldEvery===0){onProgress({epoch:epoch+1,step,examples:seen,loss:running/Math.max(1,seen),trainedParameters:"lmHead only"});await new Promise(r=>setTimeout(r,0));}
    }
    const avg=epochLoss/Math.max(1,count);history.push(avg);
    onProgress({epoch:epoch+1,epochs,step,examples:seen,loss:avg,trainedParameters:"lmHead only"});
    await new Promise(r=>setTimeout(r,0));
  }
  return {stopped:false,history,steps:step,examples:seen,trainedParameters:"lmHead only",bodyFrozen:true};
}

export function evaluateTransformer(model, tokenIds) {
  validateModel(model);
  validateTokens(tokenIds,model);
  let loss=0,correct=0,count=0;
  for(let i=0;i<tokenIds.length-1;i++){
    const seq=tokenIds.slice(Math.max(0,i-model.config.maxSeqLen+1),i+1);
    const features=model.forwardFeatures(seq).at(-1);
    const logits=model.lmHead[0].map((_,j)=>features.reduce((s,x,k)=>s+x*model.lmHead[k][j],0));
    const target=tokenIds[i+1];loss+=crossEntropy(logits,target);
    if(logits.indexOf(Math.max(...logits))===target) correct++;
    count++;
  }
  return {loss:loss/count,perplexity:Math.exp(Math.min(80,loss/count)),accuracy:correct/count,tokens:count};
}

export function createTransformerCheckpoint(model, metadata={}) {
  validateModel(model);
  return {format:"ed2-transformer-checkpoint",version:1,model:model.toJSON(),metadata:{...metadata,createdAt:new Date().toISOString(),trainingScope:"lmHead only"}};
}
