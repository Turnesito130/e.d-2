import assert from "node:assert/strict";
import { TransformerDecoder } from "./transformer.js";
import { crossEntropy, crossEntropyGradient, outputHeadGradients, trainTransformerHead, evaluateTransformer, createTransformerCheckpoint } from "./transformer-training.js";

function testCrossEntropyGradient() {
  const logits=[0.2,-0.4,1.1], target=2, analytic=crossEntropyGradient(logits,target), eps=1e-5;
  for(let i=0;i<logits.length;i++) {
    const plus=[...logits],minus=[...logits];plus[i]+=eps;minus[i]-=eps;
    const numeric=(crossEntropy(plus,target)-crossEntropy(minus,target))/(2*eps);
    assert.ok(Math.abs(numeric-analytic[i])<1e-6,"gradiente CE incorrecto en "+i);
  }
}
function testHeadGradient() {
  const features=[0.3,-0.2], logits=[0.1,0.4,-0.3], g=outputHeadGradients(features,logits,1);
  assert.equal(g.dW.length,2);assert.equal(g.dW[0].length,3);
  assert.ok(Number.isFinite(g.loss));
}

function testOutputHeadFiniteDifference() {
  const features=[0.3,-0.2,0.7], weights=[[0.1,-0.2,0.4],[0.3,0.2,-0.1],[-0.4,0.5,0.2]];
  const target=1, eps=1e-5;
  const logits=weights[0].map((_,j)=>features.reduce((sum,x,i)=>sum+x*weights[i][j],0));
  const analytic=outputHeadGradients(features,logits,target);
  const lossAt=(matrix)=>{
    const scores=matrix[0].map((_,j)=>features.reduce((sum,x,i)=>sum+x*matrix[i][j],0));
    return crossEntropy(scores,target);
  };
  for(let i=0;i<weights.length;i++) for(let j=0;j<weights[i].length;j++) {
    const plus=weights.map(row=>[...row]), minus=weights.map(row=>[...row]);
    plus[i][j]+=eps; minus[i][j]-=eps;
    const numeric=(lossAt(plus)-lossAt(minus))/(2*eps);
    assert.ok(Math.abs(numeric-analytic.dW[i][j])<1e-6,
      `gradiente de lmHead incorrecto en [${i},${j}]: ${numeric} vs ${analytic.dW[i][j]}`);
  }
}

async function testTraining() {
  const model=new TransformerDecoder({vocabSize:8,dModel:8,heads:2,layers:1,maxSeqLen:8,seed:4});
  const ids=[1,2,3,1,2,3,1,2,3,1,2,3];
  const bodyBefore=JSON.stringify({embedding:model.embedding,blocks:model.blocks,position:model.position});
  const before=evaluateTransformer(model,ids).loss;
  const result=await trainTransformerHead(model,ids,{epochs:5,learningRate:0.03,batchSize:4});
  const after=evaluateTransformer(model,ids).loss;
  assert.ok(result.steps>0);assert.equal(result.bodyFrozen,true);
  assert.equal(JSON.stringify({embedding:model.embedding,blocks:model.blocks,position:model.position}),bodyBefore);
  assert.ok(after<before,"la pérdida de entrenamiento de la cabeza debe bajar");
  assert.equal(createTransformerCheckpoint(model).format,"ed2-transformer-checkpoint");
  assert.throws(()=>evaluateTransformer(model,[1,2,99]),/Corpus tokenizado/);
  await assert.rejects(()=>trainTransformerHead(model,[1,2,99]),/Corpus tokenizado/);
}
testCrossEntropyGradient();testHeadGradient();testOutputHeadFiniteDifference();await testTraining();
console.log("Transformer full backprop training: pruebas superadas.");
