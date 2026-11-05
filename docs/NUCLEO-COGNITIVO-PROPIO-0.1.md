# E.D.-2 · Núcleo cognitivo propio 0.1

## Decisión de arquitectura
El chat principal no utiliza Qwen, Gemini, ChatGPT, Claude ni APIs externas de IA. El proveedor `brain-provider.mjs` carga `native-cognition.mjs`, sin CDN, descarga de pesos o WebGPU.

## Funciones presentes
- Cálculo con un parser matemático determinista.
- Memoria de hechos enseñados expresamente con el comando «Aprende que [concepto] significa [explicación]».
- Recuperación de hechos aprendidos y capacidad de olvidar.
- Inferencia transitiva: puede deducir una relación si existen los pasos intermedios en los hechos enseñados; muestra la cadena usada.
- Recuperación léxica de la biblioteca local.
- Respuesta explícita cuando no encuentra base suficiente.

## Aprendizaje y privacidad
El aprendizaje no es automático ni modifica pesos neuronales. Solo incorpora los datos que el usuario enseña explícitamente. Los hechos se guardan en el almacenamiento local del navegador; no se sincronizan entre dispositivos en esta fase.

## Limitaciones
El núcleo es simbólico y tiene comprensión limitada del lenguaje. No es un modelo generativo general ni es comparable a los grandes asistentes. El laboratorio Transformer de E.D. está separado del chat y no debe considerarse entrenado ni inteligente hasta que supere evaluaciones independientes.

## Siguiente trabajo
1. Ampliar el parser y la lógica formal con detección de contradicciones.
2. Incorporar revisión de conocimiento y procedencia.
3. Conectar el entrenamiento de la red propia solo tras tener un corpus legal y suficientemente grande.
4. Evaluar generalización en preguntas que no aparezcan en el entrenamiento.
5. Medir rendimiento real en el PC y Chromebook disponibles.
