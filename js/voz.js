/* ev · Mejoras de voz */
function pickVoice() {
  const v = speechSynthesis.getVoices().filter(x => /^es/i.test(x.lang));
  for (const re of [/natural|neural|online/i, /google espa[nñ]ol/i, /female|mujer|paulina|helena|sabina|monica|elena|lucia|laura/i]) {
    const f = v.find(x => re.test(x.name)); if (f) return f;
  }
  return v[0];
}
const speakBase = speak;
speak = raw => speakBase(raw.replace(/\bev\b/gi, "Eve"));
