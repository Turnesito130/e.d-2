# E.D.-2 — Cerebro propio

Proyecto de asistente personal modular. La prioridad de esta etapa es el razonamiento verificable, la planificación, la memoria controlada y el uso seguro de herramientas.

## Principios de ingeniería

- No fingir capacidades: cada función debe tener implementación y pruebas.
- Modelo y arquitectura cognitiva son cosas distintas. El runtime coordina tareas; no implica que el modelo fundacional se haya entrenado desde cero.
- Las herramientas disponibles se registran explícitamente. No existe acceso automático al sistema operativo.
- Las operaciones externas, sensibles o destructivas requieren autorización explícita; las acciones dañinas contra personas o animales no se implementan.
- Los permisos reales dependen del navegador, dispositivo, sistema operativo y APIs autorizadas.
- Mantener trazabilidad de las acciones y distinguir entre planificado, autorizado, ejecutado y fallido.

## Estado actual

- El prototipo web contiene un motor neuronal local experimental y utilidades deterministas.
- Se incorpora Agent Runtime v0.1: planificador acotado, clasificación de riesgo, registro de herramientas, validación de planes y auditoría.
- El runtime se conecta al flujo de mensajes para cálculos, notas expresamente solicitadas, búsquedas, apertura de URL y temporizadores.
- Las pruebas se pueden ejecutar con Node.js: `node --test tests/agent-runtime.test.mjs`.
- Esta versión no ofrece control universal del dispositivo ni inteligencia general. Es una base verificable para conectar herramientas de forma gradual.

## Hitos

1. Runtime de agentes y pruebas.
2. Memoria estructurada con procedencia, confianza, fechas y contradicciones.
3. Enrutador de herramientas con permisos por dispositivo.
4. Evaluaciones reproducibles del razonamiento y la planificación.
5. Integración gradual de voz, visión y control autorizado del dispositivo.
