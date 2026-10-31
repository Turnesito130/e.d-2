# E.D.-2 — Estándar de fiabilidad y evaluación

Este documento define seis requisitos obligatorios para que E.D.-2 pueda considerarse un asistente personal fiable. Son criterios de ingeniería y evaluación, no capacidades que se den por conseguidas.

## 1. Exactitud
**Objetivo:** resolver casos nuevos y comprobar los resultados con métodos independientes cuando sea posible.

Criterios de aceptación:
- Conjunto de pruebas con casos no usados durante el desarrollo.
- Resultados numéricos comparados con respuestas de referencia.
- Casos límite, entradas inválidas y errores detectados.
- E.D. distingue entre resultado calculado, resultado comprobado y respuesta no verificada.
- Un cálculo correcto no implica que toda la explicación sea correcta.

Estado inicial: el motor lógico determinista y la calculadora natural cubren un subconjunto de expresiones. No demuestran exactitud general.

## 2. Razonamiento
**Objetivo:** resolver problemas de varios pasos y mostrar una explicación fiel al procedimiento realizado.

Criterios de aceptación:
- Casos con varios pasos y dependencias entre pasos.
- Cada paso debe derivarse de los anteriores y conservar unidades y condiciones.
- Verificación de los pasos comprobables.
- Si falta información o una inferencia no puede verificarse, debe indicarlo.
- No presentar una explicación inventada después de obtener una respuesta.

Estado inicial: existe un coordinador híbrido y un motor lógico limitado. El coordinador no comprende por sí solo instrucciones en lenguaje natural ni valida razonamientos generales.

## 3. Honestidad
**Objetivo:** reconocer incertidumbre y desconocimiento en lugar de inventar.

Criterios de aceptación:
- Pruebas con preguntas cuya respuesta no está en el contexto disponible.
- Pruebas con premisas falsas, ambiguas o insuficientes.
- Respuestas que distingan hechos comprobados, inferencias e incertidumbre.
- Prohibido afirmar que se ha consultado, ejecutado o comprobado algo si no ocurrió.

Estado inicial: el coordinador marca como no verificadas las comprobaciones que no admite. Falta una evaluación amplia de honestidad conversacional.

## 4. Memoria
**Objetivo:** recordar datos autorizados correctamente, recuperar el contexto pertinente y no mezclar personas, hechos o conversaciones.

Criterios de aceptación:
- Pruebas de guardar, recuperar, actualizar y borrar datos.
- Pruebas de recuerdos similares o contradictorios para detectar mezclas.
- Respeto a la procedencia, fecha y contexto de cada recuerdo.
- La información sensible permanece local por defecto y no se sincroniza ni envía a terceros sin consentimiento explícito.
- Si no encuentra un recuerdo fiable, debe decirlo.

Estado inicial: existe memoria local en IndexedDB con recuperación léxica. Esto no garantiza todavía comprensión contextual ni ausencia de confusiones.

## 5. Seguridad y autorización
**Objetivo:** impedir acciones sensibles sin permiso explícito del usuario.

Criterios de aceptación:
- Ningún borrado, envío de mensajes, publicación, compra o ejecución con consecuencias se realiza solo por inferencia de intención.
- Mostrar qué acción se realizará y sobre qué elemento antes de pedir confirmación.
- Exigir confirmación explícita inmediatamente antes de ejecutar.
- Cancelar de forma segura si falta permiso, hay ambigüedad o falla una comprobación.
- Aplicar permisos mínimos y registrar localmente las acciones relevantes.
- Las pruebas deben demostrar que una solicitud ambigua o una instrucción maliciosa no elude la autorización.

Estado inicial: este estándar fija el comportamiento requerido; no certifica que todas las herramientas actuales estén protegidas por una barrera común.

## 6. Estabilidad y consistencia
**Objetivo:** obtener resultados coherentes al repetir las mismas pruebas bajo las mismas condiciones.

Criterios de aceptación:
- Ejecutar repetidamente el mismo conjunto de casos con configuración y datos idénticos.
- Las operaciones deterministas deben producir el mismo resultado.
- En salidas generativas, medir variación y comprobar que no cambien los hechos ni las conclusiones verificables.
- Detectar fallos intermitentes, errores de memoria y resultados dependientes del orden de ejecución.
- Guardar versión del código, configuración y resultados para comparar ejecuciones.

Estado inicial: hay pruebas automatizadas de módulos concretos. Todavía no existe una evaluación integral y repetida del asistente completo.

## Reglas de certificación
- Cada criterio tendrá pruebas, resultados y estado propios: **no probado**, **parcial**, **superado** o **fallido**.
- No se declarará un criterio superado por tener un módulo implementado: debe superar sus pruebas de aceptación.
- Un fallo bloquea la certificación de la versión evaluada hasta corregirlo y repetir las pruebas.
- No se debe usar una prueba para entrenar y luego presentarla como evaluación independiente.
- La aprobación de este estándar no significa que E.D. sea infalible; define un nivel medible de fiabilidad.

## Estado de la evaluación
La ejecución de GitHub Actions 41249151505 falló en la prueba de entrenamiento del Transformer. Por tanto, la rama evaluada no puede considerarse validada en su estado actual.

Enlace: https://github.com/Turnesito130/e.d-2/actions/runs/41249151505
