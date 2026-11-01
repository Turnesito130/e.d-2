# E.D.-2 — cerebro propio (fase servidor 0.1)

## Estado honesto

Esta carpeta es un prototipo de servidor privado. **No está desplegado ni conectado a la web de GitHub Pages.** La interfaz estática de GitHub Pages no puede ejecutar Python ni alojar un modelo. Para usar este cerebro hace falta un ordenador encendido que ejecute Ollama y este servidor.

## Arquitectura

- Modelo local gestionado por Ollama; sin Gemini, OpenAI, Claude ni API externa de IA.
- FastAPI expone `/health`, `/chat` y una memoria SQLite en `/memory`.
- La memoria se guarda en `ed_memory.sqlite3` en el ordenador servidor.
- El modelo se puede cambiar con `ED_MODEL`; el valor inicial es `qwen2.5:3b`.

## Puesta en marcha en un ordenador propio

1. Instalar Ollama y descargar un modelo compatible, por ejemplo `ollama pull qwen2.5:3b`.
2. En esta carpeta crear un entorno Python e instalar `pip install -r requirements.txt`.
3. Ejecutar `uvicorn app:app --host 127.0.0.1 --port 8000`.
4. Comprobar `http://127.0.0.1:8000/health`.

Por seguridad, el servidor escucha en localhost. No lo publiques directamente en Internet: antes habría que añadir autenticación, HTTPS, límites de uso y copias de seguridad.

## Siguiente fase

Conectar el frontend a una URL privada configurada por el usuario, con autenticación y fallback local. Después añadir recuperación semántica de recuerdos, evaluación automática de respuestas y entrenamiento/ajuste controlado. Guardar un recuerdo no entrena los pesos del modelo.