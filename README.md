# E.D.-2 — asistente con núcleo cognitivo propio

E.D.-2 desarrolla un asistente personal cuyo cerebro conversacional no depende de Qwen, Gemini, ChatGPT, Claude ni APIs de IA externas.

## Arquitectura actual

El chat utiliza `js/neural-core/native-cognition.mjs`: un núcleo cognitivo nativo escrito en JavaScript. Combina:
- cálculo matemático determinista;
- inferencia simbólica por encadenamiento de relaciones que el usuario ha enseñado;
- aprendizaje explícito y memoria local, con funciones para consultar y olvidar;
- recuperación de documentos locales revisados;
- planificación acotada y herramientas registradas mediante Agent Runtime.

El núcleo funciona sin WebGPU, descargas de modelos, CDNs ni servicios de inferencia. La voz del navegador es una función de interfaz, no el cerebro.

## Límites importantes

Esta implementación es una IA simbólica temprana, no un gran modelo lingüístico. Su comprensión del español es limitada, no puede responder de forma fiable a cualquier pregunta y no debe presentarse como comparable a ChatGPT. Aprende hechos que se le enseñan explícitamente; no modifica por sí sola sus pesos neuronales ni aprende automáticamente de cada conversación. La memoria de aprendizaje actual vive en el almacenamiento local de cada navegador y no se sincroniza entre dispositivos.

El repositorio conserva un laboratorio experimental de redes neuronales propias en `js/neural-core/` (tokenizador BPE, Transformer pequeño, entrenamiento y evaluación). Ese laboratorio no está conectado como generador del chat. Un Transformer inicializado al azar no es un modelo inteligente: necesitará un corpus grande y revisado, entrenamiento, pruebas reservadas y recursos de cálculo.

## Principios de ingeniería

- No fingir capacidades: cada función debe tener implementación y pruebas.
- Arquitectura cognitiva, motor de lenguaje y datos de entrenamiento son elementos distintos.
- No incorporar dependencias de modelos de IA externos.
- Las herramientas disponibles se registran explícitamente. No existe acceso automático al sistema operativo.
- Las operaciones sensibles o destructivas requieren autorización explícita.
- Distinguir entre planificado, autorizado, ejecutado, verificado y no verificado.

## Próximas etapas

1. Ampliar el razonamiento simbólico y el parser de español, con pruebas de inferencia y contradicciones.
2. Añadir un flujo de aprendizaje supervisado con revisión, procedencia y conjunto de evaluación separado.
3. Conectar progresivamente el Transformer propio, solo cuando supere pruebas de calidad frente al núcleo actual.
4. Medir precisión, generalización, latencia y consumo en el equipo real.
5. Mejorar memoria y sincronización segura entre dispositivos sin delegar el razonamiento en una IA externa.


## Adaptación de arquitectura OpenJarvis para Chromebook

La rama incorpora `js/neural-core/openjarvis-adapter.mjs`, una capa de integración inspirada en los cinco pilares documentados por OpenJarvis y adaptada al núcleo propio de E.D.:
- **Intelligence:** identidad y capacidades del núcleo simbólico nativo de E.D.; no se elige un modelo de terceros.
- **Engine:** ejecución JavaScript dentro del navegador ChromeOS, sin Ollama, Python, WebGPU ni descarga de pesos.
- **Agents:** Agent Runtime acotado, registro explícito de herramientas y clasificación de riesgo.
- **Memory:** memoria estructurada local con consentimiento, procedencia y nivel de confianza.
- **Learning:** hechos enseñados explícitamente y trazas locales de métricas. Las trazas no guardan el texto de las preguntas ni de las respuestas y no entrenan pesos automáticamente.

La capa se conecta al proveedor cognitivo que usa el chat. No convierte por sí sola el núcleo simbólico en un modelo lingüístico general. La compatibilidad con el Acer físico y el comportamiento de almacenamiento al abrir archivos locales deben comprobarse en ese dispositivo.
