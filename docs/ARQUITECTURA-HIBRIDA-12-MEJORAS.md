# E.D.-2 · Arquitectura híbrida: 12 líneas de mejora

El cerebro neuronal interpreta lenguaje y propone respuestas. Los módulos deterministas verifican aquello que pueden comprobar. Un coordinador decide qué comprobaciones aplicar. La respuesta distingue entre verificado, inferido y no verificado; ningún verificador certifica afirmaciones fuera de su ámbito.

1. **Cerebro neuronal:** Transformer causal y entrenamiento completo de embeddings, atención, FFN y cabeza. Estado: forward y entrenamiento parcial de lmHead; backpropagation completa pendiente.
2. **Razonamiento:** parser estructurado, representación de tareas, motor de reglas y resolución por pasos. Estado: motor aritmético determinista inicial; parser de lenguaje natural pendiente.
3. **Autocorrección:** detección de incoherencias, reintentos limitados y comparación de resultados. Estado: verificación numérica inicial; coordinador pendiente.
4. **Memoria:** contexto, hechos consentidos, conocimiento y episodios. Estado: IndexedDB/Map y búsqueda léxica; búsqueda semántica y sincronización segura pendientes.
5. **Aprendizaje progresivo:** corpus con procedencia/licencia, entrenamiento reproducible y validación separada. Estado: preparación de corpus y entrenamiento parcial; pipeline integral pendiente.
6. **Tutor de estudios:** explicación paso a paso, ejercicios, corrección y planes adaptativos. Estado: utilidades iniciales de perfil/formato; tutor integrado pendiente.
7. **Verificación:** calculadora, pruebas, fuentes y confianza calibrada. Estado: verificador aritmético inicial; verificación factual pendiente.
8. **Herramientas:** archivos, búsqueda, calendario y acciones con permisos explícitos. Estado: herramientas existentes; enrutador híbrido y permisos unificados pendientes.
9. **Lenguaje natural:** comprensión robusta en español, referencias y contexto. Estado: tokenizers existentes; parser y evaluación lingüística pendientes.
10. **Velocidad:** medición de latencia/RAM, caché, lotes y optimizaciones guiadas por benchmarks. Estado: benchmark reproducible pendiente.
11. **Seguridad y privacidad:** mínimo privilegio, confirmaciones, datos locales, exportación y borrado. Estado: controles parciales; auditoría integral pendiente.
12. **Evaluación continua:** pruebas inéditas y métricas de exactitud, razonamiento, memoria y regresiones. Estado: tests unitarios parciales; benchmark completo pendiente.

## Secuencia de implementación
A. Estabilizar contratos y tests.
B. Construir parser estructurado y coordinador neuronal-lógico.
C. Implementar backpropagation completa con gradcheck en modelos pequeños.
D. Integrar tutor, perfil de aprendizaje local y memoria en el chat.
E. Añadir holdout y benchmarks antes de afirmar mejoras.
F. Optimizar rendimiento y ampliar herramientas/seguridad según resultados.

## Criterios de aceptación
- Ninguna respuesta se marca como verificada sin una comprobación aplicable que haya pasado.
- Tests de casos válidos, inválidos, límites y entradas maliciosas.
- Entrenamiento y evaluación separados para evitar fuga de datos.
- Cambios probados antes de integrarse en main.
