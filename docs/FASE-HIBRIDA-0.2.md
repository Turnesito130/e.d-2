# E.D.-2 · Fase híbrida 0.2: orquestación neuronal-lógica

## Objetivo
Conectar de forma explícita el generador neuronal con la memoria contextual y los verificadores deterministas, sin confundir generación con verificación ni ejecutar herramientas por defecto.

## Entregado en esta fase
- `js/neural-core/reasoning-pipeline.mjs`: orquestador configurable que recibe un generador, recupera memoria pertinente, verifica únicamente comprobaciones admitidas y devuelve un estado explícito.
- `tests/reasoning-pipeline.test.mjs`: pruebas de verificación numérica, respuesta no verificable, entradas vacías, historial acotado y ausencia de ejecución implícita de herramientas.
- La planificación/ejecución de herramientas es opt-in (`planTools: true` y, separadamente, `executeTools: true`). La aprobación sensible se delega al runtime y por defecto se deniega.

## Contrato de integración
El generador recibe `{ input, memoryContext, history }` y devuelve texto o `{ answer, check }`. Las comprobaciones aceptadas actualmente son las que entiende `coordinateReasoning` (expresión matemática y respuesta numérica). Cualquier otro tipo queda como `unverified`.

## Límites conocidos
- Esta fase añade una capa reutilizable; todavía no está conectada al flujo principal de `js/brain.js`.
- No añade razonamiento general fiable, verificación factual web, búsqueda semántica ni aprendizaje de pesos.
- La memoria sigue usando la implementación actual y su recuperación léxica.
- El estado `verified` certifica solo la comprobación matemática concreta, no toda la explicación en lenguaje natural.
- La prueba real del modelo WebGPU depende del navegador y hardware; CI no la sustituye.

## Siguiente fase
Integrar el orquestador en el chat detrás de una ruta controlada, añadir un parser de tareas estructuradas y ampliar los verificadores con pruebas independientes antes de habilitar más acciones.
