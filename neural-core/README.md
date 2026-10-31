# E.D.-2 Neural Core 0.1

Primer prototipo de un modelo neuronal de lenguaje entrenado desde cero.

## Garantías de diseño

- No llama a Gemini, ChatGPT, Claude ni a APIs de IA.
- No descarga modelos ni pesos preentrenados.
- Inicializa sus propios pesos aleatorios.
- Entrena mediante retropropagación y descenso de gradiente.
- Funciona con JavaScript estándar y módulos ES.
- No requiere paquetes externos.

## Qué es

Es un modelo experimental de predicción del siguiente carácter: una ventana de caracteres entra en una capa oculta tanh y una capa softmax predice el carácter siguiente. Es una red neuronal real, pero deliberadamente pequeña.

## Qué NO es

No es todavía un Transformer, no tiene comprensión general, no razona como una persona y no es comparable con los asistentes comerciales. El objetivo de esta versión es validar el ciclo completo: tokenizar, inicializar pesos, calcular pérdida, entrenar, generar y exportar/importar.

## Prueba

Sirve los archivos desde un servidor web estático que admita módulos ES y abre `neural-core/test.html`. También puede probarse en un entorno estático compatible. No se recomienda abrirlo mediante `file://`, porque algunos navegadores bloquean módulos ES locales.

## Próximos pasos

1. Añadir barajado de ejemplos y Adam.
2. Añadir evaluación separada de entrenamiento.
3. Añadir guardado en IndexedDB.
4. Medir memoria y velocidad en Chromebook.
5. Diseñar un Transformer pequeño después de validar esta base.

## Seguridad y privacidad

El prototipo no transmite el corpus ni los pesos a ningún servidor. La prueba se ejecuta localmente en el navegador. El usuario debe proporcionar el corpus de entrenamiento.
