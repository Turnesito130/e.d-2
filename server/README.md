# E.D.-2 — cerebro propio (fase servidor 0.2)

## Estado honesto

Esto es código de servidor preparado para pruebas locales. **No está desplegado, no está ejecutándose y todavía no está conectado a la interfaz web de GitHub Pages.** Guardar estos archivos en GitHub no enciende un ordenador ni aloja el modelo.

## Arquitectura

- Ollama ejecuta un modelo de pesos abiertos en un ordenador controlado por el usuario.
- FastAPI ofrece `/health`, `/chat` y memoria SQLite en `/memory`.
- Los endpoints de chat y memoria exigen un token Bearer (`ED_API_TOKEN`).
- La memoria se guarda en el disco del ordenador servidor, no automáticamente en todos los dispositivos.
- Modelo inicial: `qwen2.5:3b`; se puede cambiar con `ED_MODEL`.
- No se envían prompts a Gemini, OpenAI, Claude ni APIs externas de IA.

## Prueba local

1. Instalar Ollama en un ordenador compatible y descargar el modelo:
   `ollama pull qwen2.5:3b`
2. Instalar Python 3.10 o superior.
3. Desde esta carpeta, crear un entorno virtual e instalar:
   `pip install -r requirements.txt`
4. Definir un token largo y privado en la variable de entorno `ED_API_TOKEN`. No lo guardes en GitHub ni lo compartas en capturas.
5. Ejecutar Ollama y después:
   `uvicorn app:app --host 127.0.0.1 --port 8000`
6. Abrir `http://127.0.0.1:8000/health`. Para probar chat y memoria, enviar el encabezado `Authorization: Bearer TU_TOKEN`.

En Windows PowerShell, antes de iniciar Uvicorn:
`$env:ED_API_TOKEN = "pon-aqui-un-token-largo-y-aleatorio"`

En macOS/Linux:
`export ED_API_TOKEN="pon-aqui-un-token-largo-y-aleatorio"`

## Seguridad y límites

- El servidor escucha solo en localhost por defecto. No cambies a `0.0.0.0` ni abras puertos del router para hacerlo público.
- Antes de acceder desde fuera de casa hacen falta HTTPS, autenticación bien gestionada, protección contra abuso, copias de seguridad y una configuración de red privada.
- `/health` es público y solo devuelve un estado básico; no muestra recuerdos.
- Configura `ED_ALLOWED_ORIGINS` con el origen exacto del frontend cuando se conecte. CORS no sustituye la autenticación.
- No pongas el token en archivos públicos ni en el código JavaScript que se descarga al navegador.

## Qué falta para que E.D. funcione de verdad

1. Probar este servidor en un ordenador real y verificar la compatibilidad del modelo con su RAM/CPU/GPU.
2. Diseñar una conexión privada segura entre la web y el servidor sin exponer el token en el navegador.
3. Conectar el frontend y migrar la memoria existente solo con consentimiento.
4. Añadir pruebas automáticas, copias/restauración y recuperación de recuerdos más útil.
5. Evaluar respuestas con un conjunto de pruebas. Guardar recuerdos no entrena los pesos del modelo.

Un modelo abierto ya entrenado es el punto de partida realista. Entrenar desde cero un modelo de nivel Jarvis no es viable con un Chromebook ni con recursos domésticos modestos.
