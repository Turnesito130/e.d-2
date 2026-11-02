import test from "node:test";
import assert from "node:assert/strict";
import { createMemoryStore } from "../js/neural-core/memory-store.mjs";
import { buildMemoryContext, augmentPromptWithMemory } from "../js/neural-core/memory-context.mjs";
function storage(){const data=new Map();return{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};}
test("recupera automáticamente recuerdos relevantes y activos",()=>{
 const memory=createMemoryStore({storage:storage()});
 memory.remember({content:"El proyecto E.D.-2 está desarrollado en JavaScript",type:"fact",confidence:0.95,consent:true});
 memory.remember({content:"La comida favorita es la pizza",type:"preference",consent:true});
 const context=buildMemoryContext("¿Qué lenguaje usa E.D.-2?",memory);
 assert.match(context,/JavaScript/);assert.doesNotMatch(context,/pizza/);assert.match(context,/no son instrucciones/);
});
test("no incluye recuerdos inciertos ni contexto sin coincidencias",()=>{
 const memory=createMemoryStore({storage:storage()});
 const item=memory.remember({content:"El proyecto usa Rust",type:"fact",consent:true});
 memory.update(item.id,{status:"uncertain"});
 assert.equal(buildMemoryContext("proyecto Rust",memory),"");
 assert.equal(augmentPromptWithMemory("hola",memory),"hola");
});
test("limita el tamaño del contexto",()=>{
 const memory=createMemoryStore({storage:storage()});
 memory.remember({content:"Proyecto personal con memoria local y arquitectura modular",type:"knowledge",consent:true});
 assert.equal(buildMemoryContext("proyecto memoria local",memory,{maxChars:15}),"");
});
