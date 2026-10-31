# Auditoría de independencia de E.D.-2

Fecha: 2026-10-31
Rama auditada: `arquitectura/cerebro-propio-0.1`

## Objetivo obligatorio

E.D.-2 no debe utilizar ningún servicio de inteligencia artificial externo ni ningún modelo preentrenado como cerebro. El motor conversacional debe ser código y pesos entrenados por el propio proyecto. Las conexiones a servicios no-IA (por ejemplo, Google Calendar/Gmail) solo podrán existir como herramientas opcionales, separadas del razonamiento y bajo autorización del usuario.

## Hallazgos confirmados

### Dependencias de IA que incumplen el objetivo

1. `js/brain.js`
   - `ask()` selecciona Gemini por defecto mediante `ed_brain || "gemini"`.
   - `geminiChunks()` envía texto e historial a `generativelanguage.googleapis.com`.
   - `loadLocal()` importa `@mlc-ai/web-llm` desde `esm.run` y selecciona un modelo de la lista precompilada.
   - `localChunks()` usa `llm.chat.completions`: es inferencia de un modelo preentrenado, no el Neural Core propio.
   - Si WebLLM falla y hay clave, `ask()` cambia automáticamente a Gemini.
   - Para ver la pantalla, `needShot` fuerza la ruta Gemini.
2. `js/herramientas.js`
   - Declara explícitamente que Gemini decide qué herramienta usar.
   - Incluye otra implementación de `geminiChunks()` que llama a Gemini con function calling.
   - Las herramientas locales se pueden conservar, pero su selección debe pasar a un enrutador determinista propio o al futuro cerebro propio, nunca a Gemini.
3. `js/profunda.js`
   - La investigación profunda usa una función `gem()` basada en Gemini (revisar el archivo completo antes de sustituirla).
4. `index.html` y `js/ajustes.js`
   - La interfaz presenta Gemini como cerebro y solicita/guarda una clave de Gemini.
   - La opción local indica que usa Gemini para ver la pantalla.
5. `js/main.js` y `js/acciones.js`
   - El saludo y diagnóstico dependen de la clave de Gemini.
   - El diagnóstico muestra Gemini como requisito y WebGPU como requisito del modelo WebLLM.

### Servicios externos que no son el cerebro

- `js/google.js`: OAuth y APIs de Gmail, Classroom y Drive. No son modelos de IA; pueden mantenerse como conectores opcionales, separados del cerebro y con permiso explícito.
- `js/voice.js`: ElevenLabs es un servicio externo de síntesis de voz. Existe alternativa mediante SpeechSynthesis del navegador. Para independencia de servicios externos, la voz del navegador debe ser la opción local predeterminada y ElevenLabs debe quedar desactivado/eliminable.
- Google Fonts en `index.html`: dependencia visual, no de IA; se puede sustituir por fuentes locales/sistema si se exige funcionamiento sin servicios externos.
- La captura de pantalla usa APIs del navegador; no implica IA externa por sí misma. Actualmente el envío de la captura a Gemini sí viola la independencia.

### Estado del cerebro propio

- `js/neural-core/index.js` expone creación, entrenamiento, generación, exportación e importación de un TinyLanguageModel.
- `js/neural-core/model.js` es un modelo pequeño de caracteres con ventana de contexto, una capa oculta y pesos inicializados aleatoriamente; no es un Transformer conversacional.
- `js/neural-core/attention.js` es un bloque experimental de atención causal, no una pila Transformer completa.
- `js/neural-core/memory.js` utiliza IndexedDB local con fallback Map temporal; no proporciona sincronización entre dispositivos.
- El Neural Core no está conectado a `ask()`; la conversación real sigue rutas Gemini/WebLLM.
- `js/neural-core/tests.js` contiene pruebas automatizadas, pero su ejecución en esta auditoría aún no está verificada.

## Plan de sustitución seguro

1. **Cerrar las rutas externas de IA**: retirar Gemini, WebLLM/modelos preentrenados y Gemini en investigación/herramientas. No dejar fallbacks silenciosos.
2. **Mantener la aplicación utilizable**: respuestas deterministas locales para comandos conocidos, calculadora, temporizadores, notas y navegación; cuando el cerebro propio no sepa responder, debe decirlo claramente.
3. **Conectar el Neural Core propio** solo después de comprobar tokenizador, entrenamiento, persistencia, inferencia y calidad mínima. Un modelo aleatorio o apenas entrenado no debe presentarse como asistente conversacional competente.
4. **Construir el Transformer propio** con pruebas numéricas de gradientes, causalidad, estabilidad, serialización y evaluación en datos separados.
5. **Separar conectores opcionales** (Google) y voz local/externa. No enviar conversación o pantalla a terceros sin consentimiento explícito.
6. **Prueba de independencia**: inspeccionar todas las llamadas de red y verificar que ninguna petición de conversación llega a proveedores de IA; probar el modo sin conexión después de precargar los recursos necesarios.

## Regla de aceptación

No declarar E.D.-2 independiente hasta que:
- no haya llamadas ni fallback a APIs de IA;
- no descargue ni ejecute modelos preentrenados;
- las respuestas conversacionales procedan exclusivamente del motor propio o de reglas locales transparentes;
- las pruebas automáticas y de red pasen;
- los conectores y la voz externa estén claramente separados y sean opcionales.

## Estado de esta auditoría

Auditoría parcial basada en los archivos enumerados. No se han modificado todavía los flujos de ejecución ni se ha ejecutado la suite completa en esta revisión. Hay que terminar de revisar todos los módulos y dependencias antes de declarar el inventario exhaustivo.
