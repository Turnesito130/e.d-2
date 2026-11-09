# E.D.-2 — asistente con núcleo cognitivo propio

E.D.-2 desarrolla un asistente personal cuyo cerebro conversacional no depende de Qwen, Gemini, ChatGPT, Claude ni APIs de IA externas.

## Arquitectura actual

El chat utiliza primero `js/neural-core/native-cognition.mjs`: un núcleo cognitivo nativo escrito en JavaScript. Combina cálculo matemático determinista, inferencia simbólica, aprendizaje explícito, memoria local, recuperación de documentos revisados y herramientas registradas. Si ese núcleo no conoce una respuesta y existe un checkpoint entrenado en el dispositivo, `js/neural-core/brain-provider.mjs` puede consultar como respaldo el Transformer experimental propio (`local-transformer-brain.mjs`). Sus propuestas se etiquetan como no verificadas y se filtran; no sustituyen las respuestas fiables del núcleo simbólico.

El núcleo funciona sin WebGPU, descargas de modelos, CDNs ni servicios de inferencia. La voz del navegador es una función de interfaz, no el cerebro.

## Límites importantes

Esta implementación es una IA simbólica temprana, no un gran modelo lingüístico. Su comprensión del español es limitada, no puede responder de forma fiable a cualquier pregunta y no debe presentarse como comparable a ChatGPT. Aprende hechos que se le enseñan explícitamente; no modifica por sí sola sus pesos neuronales ni aprende automáticamente de cada conversación. La memoria de aprendizaje actual vive en el almacenamiento local de cada navegador y no se sincroniza entre dispositivos.

El repositorio incluye un Transformer pequeño propio, tokenizador BPE, retropropagación, entrenamiento y evaluación. El chat ya lo puede consultar como respaldo únicamente cuando el núcleo simbólico no sabe responder y el Transformer tiene pesos entrenados guardados localmente. Un Transformer inicializado al azar no es un modelo inteligente: el corpus actual es pequeño y educativo, así que entrenarlo no garantiza conversación general ni respuestas correctas. Hace falta ampliar datos revisados, separar datos de evaluación y medir calidad, tiempo y memoria en el Acer real.

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

## Referencia externa de investigación: LLMs-from-scratch

Se ha seleccionado [rasbt/LLMs-from-scratch](https://github.com/rasbt/LLMs-from-scratch) como referencia técnica para estudiar tokenización, atención, preentrenamiento y ajuste por instrucciones. No se incorpora como dependencia ni se ejecuta dentro de E.D.: está implementado en Python/PyTorch y sus notebooks no son directamente ejecutables al abrir `index.html` en ChromeOS sin un entorno Python compatible. E.D. mantiene su implementación neuronal en JavaScript para respetar el requisito de funcionar desde el navegador del Acer sin Linux ni servicios externos.


## Ejecución desde Archivos de ChromeOS

Para permitir que el chat funcione al abrir `index.html` directamente desde la aplicación Archivos, la página carga `js/neural-core/chromebook-file-bundle.js`. Ese archivo reúne los módulos ES del núcleo en un cargador JavaScript clásico, evitando las importaciones `.mjs` que pueden quedar bloqueadas por el origen `file://` del navegador. El Service Worker no puede instalarse desde `file://`; la interfaz y el cerebro local no lo necesitan para ejecutarse, aunque las funciones PWA y la caché instalable sí requieren HTTPS. La prueba del bundle se ha ejecutado en un entorno JavaScript aislado; falta verificarlo en el Chromebook físico.


## Conexiones externas disponibles

El conector Google existente puede autorizar, mediante el consentimiento OAuth del usuario, lectura de mensajes no leídos de Gmail, tareas de Google Classroom, metadatos de archivos de Drive y eventos próximos de Google Calendar. Los permisos son de solo lectura. Se necesita configurar un ID de cliente OAuth de Google en el proyecto y autorizar la cuenta en el navegador. Otros servicios del panel se abren como páginas web; no se afirma que estén conectados por API ni que E.D. pueda leer sus datos.


## Primer uso en Acer Chromebook

1. Abre la rama `arquitectura/cerebro-propio-0.1` en GitHub y descarga su ZIP desde **Code → Download ZIP**.
2. En la aplicación Archivos de ChromeOS, extrae el ZIP.
3. Abre `index.html` con Chrome. El paquete `chromebook-file-bundle.js` evita depender de importaciones de módulos que pueden bloquearse en direcciones `file://`.
4. Toca la esfera para activar el núcleo propio. Para escribir, abre el chat con el icono del lápiz.
5. Para enseñar un dato, escribe por ejemplo: `Aprende que fotosíntesis significa proceso por el que las plantas transforman luz en energía química`. Para calcular: `Calcula 12 por 3`.
6. El botón **G** inicia la autorización de Google. Hace falta un ID de cliente OAuth válido y aceptar los permisos de solo lectura. Después E.D. puede consultar Gmail no leído, Classroom, metadatos de Drive y eventos de Calendar.

La aplicación y el núcleo no necesitan Internet para el razonamiento simbólico, los cálculos y la memoria local. Internet sí es necesario para Google, búsquedas y otras páginas externas. El permiso de micrófono depende de ChromeOS y de las políticas del dispositivo. No se ha realizado una prueba física en el Acer; si ChromeOS bloquea el micrófono o el almacenamiento local, esas funciones necesitarán un ajuste específico.


## Sincronización opcional de memoria entre dispositivos

En Ajustes hay dos controles nuevos: **Sincronizar memoria con Google Drive** y **Recuperar memoria de Google Drive**. Requieren conectar Google y autorizar el permiso `drive.appdata`. La copia se guarda en el espacio privado de datos de la aplicación (`appDataFolder`), no como un documento visible en la carpeta normal de Drive. La sincronización es manual: pulsa sincronizar en el dispositivo de origen y recuperar en el otro. La recuperación combina los datos y pide confirmación; no borra la memoria local. El cerebro y la inferencia siguen ejecutándose localmente. La primera autorización puede exigir volver a consentir los nuevos permisos de Google.


**Nota sobre Google OAuth:** el modo `file://` permite ejecutar el núcleo local, pero Google OAuth requiere un origen web HTTPS autorizado en la configuración del cliente OAuth. Para usar Calendar, Gmail, Drive o la sincronización entre dispositivos, E.D. debe abrirse desde un despliegue HTTPS (por ejemplo, GitHub Pages) cuyo dominio esté autorizado en Google Cloud. No se debe pegar una clave secreta en el HTML; el ID de cliente OAuth no es una contraseña.


## Conocimiento local sin conexión

La biblioteca inicial de E.D. contiene 30 fichas educativas aprobadas en español, empaquetadas dentro del JavaScript que se carga desde `index.html`. Incluye ciencia, matemáticas, historia, tecnología, programación y lenguaje. Así, la recuperación de estas fichas no utiliza `fetch` ni necesita conexión, y también funciona cuando se abre el archivo local desde ChromeOS. El núcleo responde con el contenido encontrado y su identificador de fuente; si no encuentra material suficiente, debe reconocerlo en lugar de inventar. La biblioteca puede ampliarse con nuevas fichas revisadas.
