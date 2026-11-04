# E.D.-2 · Conocimiento recuperable 0.4 (RAG)

## Objetivo
Dar al chat acceso a una biblioteca local versionada, recuperar fragmentos relevantes y presentar sus fuentes al modelo sin confundir recuperación con entrenamiento neuronal.

## Implementación
- `js/neural-core/knowledge-base.mjs`: valida JSONL, indexa documentos aprobados y recupera coincidencias léxicas con puntuación y límites.
- `data/knowledge/curated-es.jsonl`: nueve fichas educativas originales en español.
- `tests/knowledge-base.test.mjs`: siete pruebas del parser, validación, recuperación, fuentes y límites.
- `js/brain.js`: incorpora contexto y referencias recuperadas al prompt del modelo local.

## Seguridad y calidad
- Los documentos con estado `review` o `rejected` no se indexan.
- El contenido recuperado se presenta como datos no confiables, nunca como instrucciones.
- No se ejecuta código de los documentos.
- La búsqueda actual es léxica; no es búsqueda semántica por embeddings.
- Si no hay coincidencias, el modelo responde sin contexto documental.
- Las referencias identifican el documento interno; no equivalen a una fuente externa verificada.

## Limitaciones
El corpus es pequeño y demostrativo. No garantiza respuestas correctas ni amplía por sí solo el conocimiento paramétrico del modelo. La carga desde GitHub Pages depende de que el archivo esté publicado en la misma versión del sitio.

## Siguiente etapa
Ampliar la biblioteca con fuentes fiables y fechas, incorporar recuperación semántica, medir precisión/recobrado y probar respuestas en preguntas no vistas.
