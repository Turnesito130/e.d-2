import test from "node:test";
import assert from "node:assert/strict";
import {parseKnowledgeJsonl,createKnowledgeBase,validateKnowledgeDocument} from "../js/neural-core/knowledge-base.mjs";
const docs=[
{id:"a",title:"Gravedad y masa",domain:"science",text:"La gravedad ejerce una fuerza sobre la masa.",source:"test",status:"approved"},
{id:"b",title:"Historia de Francia",domain:"history",text:"La Revolución francesa comenzó en 1789.",source:"test",status:"approved"},
{id:"c",title:"Nota pendiente",domain:"general",text:"Contenido sin revisar.",source:"test",status:"review"}
];
test("parsea y valida documentos JSONL",()=>{assert.equal(parseKnowledgeJsonl(JSON.stringify(docs[0])+"\n").length,1);assert.throws(()=>parseKnowledgeJsonl("{bad"),/línea 1/);});
test("rechaza documentos incompletos",()=>{assert.throws(()=>validateKnowledgeDocument({id:"x"}),/no válido/);});
test("indexa solo documentos aprobados",()=>{const kb=createKnowledgeBase(docs);assert.equal(kb.size,2);});
test("recupera documentos relevantes con fuente",()=>{const result=createKnowledgeBase(docs).buildContext("¿Qué pasó en la Revolución francesa?");assert.match(result.context,/1789/);assert.equal(result.sources[0].id,"b");assert.equal(result.sources[0].source,"test");});
test("limita resultados y longitud de contexto",()=>{const result=createKnowledgeBase(docs).buildContext("gravedad masa Francia historia",{limit:1,maxChars:100});assert.ok(result.sources.length<=1);assert.ok(result.context.length<=100);});
test("ignora consultas sin términos útiles",()=>{assert.deepEqual(createKnowledgeBase(docs).search("el y de"),[]);});
test("rechaza identificadores duplicados",()=>{assert.throws(()=>createKnowledgeBase([docs[0],docs[0]]),/duplicado/);});
