# E.D.-2 · Entrenamiento híbrido 0.3

## Objetivo
Preparar un flujo reproducible para mejorar un modelo abierto mediante ejemplos de calidad, evaluación reservada y futura adaptación LoRA, mientras se desarrolla la arquitectura propia de E.D.-2.

## Qué se incorpora
- `data/training/curated-es.jsonl`: corpus inicial original en español, con dominios de ciencia, matemáticas, historia, tecnología, programación, lenguaje y conocimiento general.
- `js/neural-core/training-corpus.mjs`: lectura JSONL, validación de esquema, detección de IDs duplicados, selección por partición, exportación de ejemplos aprobados y evaluación reservada.
- `tests/training-corpus.test.mjs`: pruebas automatizadas de validación, separación train/eval, exportación y evaluación.
- Manifiesto de preparación LoRA: documenta parámetros y separa explícitamente preparación de entrenamiento real.

## Límites deliberados
Esta fase NO ejecuta fine-tuning, NO modifica pesos del modelo Qwen, NO descarga datasets externos y NO conecta todavía el pipeline al chat de producción. El manifiesto LoRA es una especificación de preparación, no un entrenador. El corpus inicial es pequeño y sirve para validar el flujo, no para producir por sí solo una mejora notable de inteligencia.

## Reglas de calidad
1. Solo ejemplos con estado `approved` entran en exportación.
2. Los ejemplos `eval` nunca se exportan como datos de entrenamiento.
3. Cada ejemplo conserva ID, dominio y procedencia.
4. Las puntuaciones deben proceder de un evaluador independiente y estar entre 0 y 1.
5. Los cambios de modelo deberán compararse con el mismo conjunto reservado antes de adoptarse.
6. Los datos personales, secretos y conversaciones privadas no se incorporan sin revisión y consentimiento explícito.

## Próximos pasos
1. Añadir más ejemplos revisados y casos difíciles.
2. Integrar recuperación de conocimiento (RAG) con fuentes y citas.
3. Conectar el evaluador a pruebas de regresión del modelo conversacional.
4. Preparar un entorno compatible para LoRA y medir memoria/VRAM, tiempo y calidad.
5. Solo después ejecutar un fine-tuning controlado y comparar el modelo base con el adaptado.
