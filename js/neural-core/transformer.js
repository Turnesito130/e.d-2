/* E.D.-2 · Transformer causal decoder (inferencia v1).
 * Implementación propia en JavaScript, sin APIs ni modelos externos.
 * Nota: esta versión define el forward completo; el entrenamiento por gradiente
 * se incorpora en el siguiente módulo/fase y no debe confundirse con inferencia.
 */
const rand = (n, scale = 0.02) => Array.from({length:n}, () =>
  Array.from({length:n}, () => (Math.random() * 2 - 1) * scale));
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
    if (dModel%heads) throw new Error("dModel debe ser divisible por heads");
    if (layers<1||maxSeqLen<2) throw new Error("Configuración Transformer no válida");
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
    const m=new TransformerDecoder(data.config);
    for(const key of ["embedding","position","blocks","lmHead"]) m[key]=data[key];
    return m;
  }
}
