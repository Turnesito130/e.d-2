# E.D.-2 — Módulo de Finanzas y Trading (modo simulador)

## Visión
Convertir E.D.-2 en un copiloto personal de mercados: educación financiera, análisis de instrumentos, lectura de datos, gestión de riesgo, hipótesis de trading y acompañamiento en un simulador. La meta es rigor y utilidad, no prometer rentabilidad ni imitar la personalidad o los resultados de una persona famosa.

## Límites iniciales obligatorios
- Solo simulación / paper trading en la primera etapa.
- Sin conexión a cuentas bancarias o brokers, sin órdenes reales y sin ejecución autónoma.
- Ninguna señal se presenta como certeza ni como garantía de beneficio.
- Mostrar siempre fuente, fecha/hora, mercado, instrumento y retraso de los datos.
- Si faltan datos, son antiguos o el mercado está cerrado, decirlo y no inventar precios.
- El usuario decide y confirma cada operación simulada.

## Capacidades objetivo

### 1. Conocimiento financiero
- Conceptos de mercados, acciones, ETFs, índices, bonos, divisas, materias primas, criptoactivos, derivados y tipos de órdenes.
- Estados financieros: ingresos, márgenes, flujo de caja, balance, deuda, valoración y dilución.
- Macro: inflación, tipos, empleo, bancos centrales y ciclos económicos.
- Trading: tendencia, rango, volatilidad, volumen, liquidez, soportes/resistencias e indicadores.
- Diferenciar inversión, trading, especulación y gestión de patrimonio.
- Mantener conceptos y fórmulas versionados y con referencias; no confundir material educativo con datos actuales.

### 2. Analizador de mercado
Entrada normalizada: instrumento, mercado, marco temporal, OHLCV, spread, volumen, timestamp, zona horaria y proveedor.
Salida estructurada:
- Estado de datos: válido / incompleto / retrasado / no disponible.
- Tendencia y régimen estimado (tendencia, rango, alta volatilidad).
- Niveles y métricas calculadas.
- Escenarios alcista, bajista y neutral, con condiciones que invalidan cada uno.
- Riesgos, eventos y limitaciones.
- No generar señal si faltan datos esenciales.

### 3. Gestión de riesgo y tamaño de posición
La cantidad no se decide por intuición ni por una promesa de rentabilidad.
Para una simulación sencilla:
- riesgo monetario = capital simulado × porcentaje de riesgo elegido;
- riesgo por unidad = distancia entre entrada y stop × valor monetario por punto/unidad;
- tamaño teórico = riesgo monetario / riesgo por unidad.
Redondear según lote mínimo y mostrar el riesgo estimado, exposición, apalancamiento y pérdidas potenciales. Rechazar cálculos con stop inexistente, riesgo por unidad cero, datos no válidos o tamaño fuera de límites.
Incluir comisiones, spread, deslizamiento y gaps cuando existan datos. La fórmula no garantiza que la pérdida real quede limitada al stop.

### 4. Copiloto del simulador
Flujo propuesto:
1. Detectar o recibir el instrumento y los datos del simulador.
2. Confirmar que el modo es demo.
3. Mostrar análisis y calidad/frescura de datos.
4. Proponer escenarios y condiciones de entrada/salida, no órdenes obligatorias.
5. Calcular tamaño solo con capital, riesgo permitido, entrada, stop y especificaciones del instrumento.
6. El usuario revisa y confirma la operación simulada.
7. Registrar la hipótesis, captura/datos, decisión y resultado para revisar el proceso.

### 5. Diario y evaluación
- Guardar operaciones demo, razonamiento, reglas, riesgo previsto y resultado.
- Métricas: retorno, drawdown, profit factor, tasa de acierto, esperanza matemática, Sharpe/Sortino cuando haya muestra suficiente, costes y exposición.
- Separar backtest, paper trading y resultados reales.
- Evitar sesgo de supervivencia, look-ahead, sobreajuste y fuga de datos.
- Probar fuera de muestra y en distintos regímenes de mercado.

## Arquitectura sugerida
- `finance/knowledge`: glosario, fórmulas y material educativo versionado.
- `finance/market-data`: adaptadores de datos con fuente, timestamp y validación.
- `finance/indicators`: cálculos deterministas y pruebas unitarias.
- `finance/analysis`: escenarios y explicaciones.
- `finance/risk`: dimensionamiento, límites y validaciones deterministas.
- `finance/simulator`: interfaz de solo lectura/confirmación para paper trading.
- `finance/journal`: diario local y métricas.
- `finance/evaluation`: backtests, pruebas fuera de muestra y reportes.

El modelo neuronal puede resumir, interpretar preguntas y proponer hipótesis. Los cálculos, indicadores, límites de riesgo y validaciones deben ejecutarse en módulos deterministas comprobables. El coordinador debe etiquetar hechos, cálculos, hipótesis y datos desconocidos.

## Pruebas de aceptación
1. Recalcular indicadores con series conocidas y comparar con valores de referencia.
2. Detectar datos vacíos, timestamps fuera de orden, huecos, precios imposibles y datos retrasados.
3. Verificar tamaños de posición con casos de referencia, lotes mínimos, comisiones y distintos valores por punto.
4. Rechazar entradas sin stop o con riesgo inválido.
5. Repetir análisis deterministas con los mismos datos y obtener los mismos resultados.
6. Comprobar que ningún adaptador puede enviar órdenes ni acceder a una cuenta real en esta etapa.
7. Backtests sin usar datos futuros; pruebas walk-forward y fuera de muestra.
8. Registrar cada recomendación con datos y parámetros que permitan reproducirla.

## Fases
- Fase 0: identificar plataforma del simulador, instrumentos y datos disponibles.
- Fase 1: glosario financiero y motor de cálculos/indicadores con tests.
- Fase 2: motor de riesgo y calculadora de tamaño de posición.
- Fase 3: análisis de mercado y escenarios explicables.
- Fase 4: integración de solo lectura con el simulador concreto.
- Fase 5: diario, backtesting y evaluación sostenida.

## Estado
Este documento es la especificación inicial. No significa que estas funciones estén implementadas ni que E.D.-2 tenga datos de mercado en tiempo real. La integración depende de conocer el simulador exacto y las interfaces que ofrece.
