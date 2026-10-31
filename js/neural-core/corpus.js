/* Preparación de corpus local para entrenamiento autoregresivo.
 * No descarga datos: procesa únicamente textos que el usuario aporte legalmente.
 */
export function normalizeCorpus(text) {
  if(typeof text!=="string") throw new TypeError("El corpus debe ser texto");
  return text.normalize("NFC").replace(/\r\n?/g,"\n").replace(/[\t ]+/g," ")
    .replace(/\n{3,}/g,"\n\n").trim();
}
export function splitCorpus(text,{validationRatio=0.05}={}) {
  if(!(validationRatio>0&&validationRatio<0.5)) throw new RangeError("validationRatio debe estar entre 0 y 0.5");
  const clean=normalizeCorpus(text);
  const cut=Math.floor(clean.length*(1-validationRatio));
  // Separar cerca de un límite de párrafo reduce cortes a mitad de frase.
  const boundary=clean.indexOf("\n\n",cut);
  const at=boundary>0&&boundary<clean.length-1?boundary:cut;
  return {train:clean.slice(0,at).trim(),validation:clean.slice(at).trim()};
}
export function makeTokenWindows(tokenIds,{contextSize=128,stride=contextSize}={}) {
  if(!Array.isArray(tokenIds)||contextSize<2||stride<1) throw new Error("Parámetros de ventanas no válidos");
  const windows=[];
  for(let start=0;start+contextSize<tokenIds.length;start+=stride) {
    const input=tokenIds.slice(start,start+contextSize);
    const target=tokenIds.slice(start+1,start+contextSize+1);
    windows.push({input,target});
  }
  return windows;
}
export function corpusStats(text) {
  const clean=normalizeCorpus(text);
  return {characters:clean.length,words:clean?clean.split(/\s+/u).length:0,paragraphs:clean?clean.split(/\n\n/).length:0};
}
