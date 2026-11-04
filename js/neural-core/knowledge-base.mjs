/**
 * E.D.-2 · Biblioteca local de conocimiento y recuperación léxica (RAG) v0.4.
 * No ejecuta contenido de documentos. Los textos recuperados son datos no confiables.
 */
const STOP = new Set(["a","al","algo","como","con","de","del","el","en","es","esta","este","la","las","lo","los","más","para","por","que","se","su","un","una","y"]);
function tokens(value) {
  return String(value || "").toLocaleLowerCase("es").normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").match(/[a-z0-9]{2,}/g)?.filter(token => !STOP.has(token)) || [];
}
function clean(value, name, max) {
  if (typeof value !== "string" || !value.trim() || value.length > max) throw new TypeError(name+" no válido.");
  return value.trim();
}
export function validateKnowledgeDocument(doc) {
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) throw new TypeError("Documento no válido.");
  const id=clean(doc.id,"id",100), title=clean(doc.title,"title",200);
  const text=clean(doc.text,"text",12000), domain=clean(doc.domain,"domain",40);
  const source=clean(doc.source,"source",300);
  const status=doc.status || "review";
  if (!["approved","review","rejected"].includes(status)) throw new TypeError("Estado no válido.");
  return Object.freeze({id,title,text,domain,source,status});
}
export function parseKnowledgeJsonl(input) {
  if(typeof input!=="string") throw new TypeError("La biblioteca debe ser texto JSONL.");
  return input.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map((line,i)=>{
    try{return validateKnowledgeDocument(JSON.parse(line));}
    catch(error){throw new SyntaxError("Documento inválido en línea "+(i+1)+": "+error.message);}
  });
}
export function createKnowledgeBase(documents=[]) {
  if(!Array.isArray(documents)) throw new TypeError("documents debe ser una lista.");
  const seen=new Set();
  const docs=documents.map(validateKnowledgeDocument).filter(doc=>{
    if(seen.has(doc.id)) throw new TypeError("ID duplicado: "+doc.id);
    seen.add(doc.id); return doc.status==="approved";
  });
  const indexed=docs.map(doc=>({...doc,terms:new Set(tokens(doc.title+" "+doc.text))}));
  function search(query,{limit=4,minScore=0.08}={}) {
    const queryTokens=[...new Set(tokens(query))];
    if(!queryTokens.length) return [];
    const scored=indexed.map(doc=>{
      let score=0;
      for(const term of queryTokens) if(doc.terms.has(term)) score+=1+Math.log(1+doc.text.toLocaleLowerCase("es").split(term).length-1);
      const coverage=score/queryTokens.length;
      return {id:doc.id,title:doc.title,text:doc.text,domain:doc.domain,source:doc.source,score:Number(coverage.toFixed(3))};
    }).filter(item=>item.score>=minScore).sort((a,b)=>b.score-a.score || a.id.localeCompare(b.id));
    return scored.slice(0,Math.max(1,Math.min(8,limit)));
  }
  function buildContext(query,{limit=4,maxChars=2600,minScore=0.08}={}) {
    const results=search(query,{limit,minScore});
    let output="";
    for(const item of results){
      const block="[Fuente "+item.id+" | "+item.title+" | "+item.source+"]\n"+item.text;
      if(output.length+block.length>maxChars) continue;
      output+=(output?"\n\n":"")+block;
    }
    return {context:output, sources:results.map(({id,title,source,score})=>({id,title,source,score}))};
  }
  return Object.freeze({search,buildContext,size:indexed.length});
}
export async function loadLocalKnowledgeBase({url="./data/knowledge/curated-es.jsonl",fetchImpl=globalThis.fetch}={}) {
  if(typeof fetchImpl!=="function") throw new Error("Este entorno no permite cargar la biblioteca local.");
  const response=await fetchImpl(url,{cache:"no-cache"});
  if(!response.ok) throw new Error("No se pudo cargar la biblioteca local ("+response.status+").");
  const documents=parseKnowledgeJsonl(await response.text());
  return createKnowledgeBase(documents);
}
