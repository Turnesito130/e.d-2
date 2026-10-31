import assert from "node:assert/strict";
import { TransformerDecoder } from "./transformer.js";

const model = new TransformerDecoder({vocabSize:32,dModel:16,heads:4,layers:2,maxSeqLen:16,seed:7});
const logits = model.forward([1,2,3]);
assert.equal(logits.length,3);
assert.equal(logits[0].length,32);
assert.ok(logits.flat().every(Number.isFinite));

// Causal mask: changing a future token must not alter earlier positions.
const a = model.forward([1,2,3]);
const b = model.forward([1,2,9]);
for(let i=0;i<2;i++) for(let j=0;j<32;j++) assert.ok(Math.abs(a[i][j]-b[i][j])<1e-10);
const restored=TransformerDecoder.fromJSON(model.toJSON());
const c=restored.forward([1,2,3]);
for(let j=0;j<32;j++) assert.ok(Math.abs(a[2][j]-c[2][j])<1e-10);
assert.throws(()=>new TransformerDecoder({vocabSize:10,dModel:15,heads:4}));
console.log("Transformer v1: 4 grupos de pruebas superados.");
