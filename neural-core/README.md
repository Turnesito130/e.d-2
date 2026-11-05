# E.D.-2 Neural Core — laboratorio de IA propia

Este laboratorio contiene componentes neuronales implementados en JavaScript: tokenizador BPE, redes pequeñas, atención, un Transformer causal experimental, entrenamiento y evaluación. No descarga pesos preentrenados ni usa APIs de IA.

## Estado del laboratorio

Los componentes neuronales son experimentales y **no son el generador que utiliza actualmente el chat principal**. El chat funciona con el núcleo simbólico descrito en el README principal. No confundas un Transformer inicializado con pesos aleatorios con un modelo ya entrenado.

El entrenamiento desde cero requiere un corpus amplio, legal, de calidad y separado entre entrenamiento y evaluación. Un corpus pequeño puede probar el código, pero no produce por sí solo conocimiento general ni capacidades comparables a los grandes modelos.

## Componentes

- Tokenizador BPE entrenable desde el corpus.
- Modelos neuronales pequeños y Transformer causal experimental.
- Entrenamiento, optimizador y evaluación.
- Atención y memoria experimental.
- Importación/exportación de parámetros.

## Reglas de calidad

1. No se incorporan pesos ni modelos externos.
2. Conservar procedencia y licencia de los textos.
3. Separar datos de entrenamiento y evaluación para evitar fuga.
4. Medir pérdida, perplejidad y resultados en preguntas no vistas.
5. No conectar el modelo al chat hasta superar pruebas de calidad, estabilidad y rendimiento.

## Pruebas

Ejecuta `node --test tests/*.test.mjs` con Node.js 22 o superior. Para pruebas visuales del navegador, sirve el repositorio con un servidor estático compatible con módulos ES.
