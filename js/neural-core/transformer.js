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

export class TransformerDecoder {
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
