from __future__ import annotations

import asyncio
import importlib
import os
import tempfile
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel
module_prefix = f"{__package__}." if __package__ else ""
settings = importlib.import_module(f"{module_prefix}settings")
response_utils = importlib.import_module(f"{module_prefix}response_utils")
BEAM_SIZE, COMPUTE_TYPE, DEVICE, HOTWORDS, INITIAL_PROMPT, MAX_AUDIO_BYTES, MODEL_PATH, MODEL_SIZE, PORT, SERVICE_NAME = (
    settings.BEAM_SIZE, settings.COMPUTE_TYPE, settings.DEVICE, settings.HOTWORDS, settings.INITIAL_PROMPT,
    settings.MAX_AUDIO_BYTES, settings.MODEL_PATH, settings.MODEL_SIZE, settings.PORT, settings.SERVICE_NAME,
)
error_response = response_utils.error_response
normalize_language = response_utils.normalize_language

model: WhisperModel | None = None
model_load_error = ""
transcription_lock = asyncio.Lock()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    global model, model_load_error
    try:
        if not MODEL_PATH.is_dir():
            raise FileNotFoundError(f"Local Whisper model directory not found: {MODEL_PATH}")
        model = WhisperModel(
            str(MODEL_PATH),
            device=DEVICE,
            compute_type=COMPUTE_TYPE,
        )
    except Exception as exc:  # noqa: BLE001 - keep health available when a local model cannot load.
        model = None
        model_load_error = str(exc)
    yield
    model = None


app = FastAPI(title=SERVICE_NAME, lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

def transcribe_file(file_path: str, language: str | None):
    if model is None:
        raise RuntimeError("Speech-to-text model is not loaded")
    segments, info = model.transcribe(
        file_path,
        language=language,
        task="transcribe",
        initial_prompt=INITIAL_PROMPT,
        hotwords=HOTWORDS,
        beam_size=BEAM_SIZE,
        vad_filter=True,
        condition_on_previous_text=True,
    )
    result_segments = []
    text_parts = []
    for segment in segments:
        text = segment.text.strip()
        if not text:
            continue
        text_parts.append(text)
        result_segments.append({
            "start": round(float(segment.start), 2),
            "end": round(float(segment.end), 2),
            "text": text,
        })
    return {
        "text": " ".join(text_parts).strip(),
        "language": getattr(info, "language", None) or language or "auto",
        "languageProbability": round(float(getattr(info, "language_probability", 0) or 0), 4),
        "segments": result_segments,
        "model": str(MODEL_PATH),
    }

@app.get("/health")
async def health(request: Request):
    return {
        "success": True,
        "service": SERVICE_NAME,
        "status": "ok" if model is not None else "degraded",
        "modelLoaded": model is not None,
        "model": MODEL_SIZE,
        **({"modelError": model_load_error} if model_load_error else {}),
        "requestId": request.headers.get("x-request-id"),
    }


@app.post("/transcribe")
async def transcribe(request: Request, file: UploadFile = File(...), language: str | None = None):
    if model is None:
        return error_response("Speech-to-text model is still loading", 503, request.headers.get("x-request-id"))
    if not file.content_type or not file.content_type.startswith("audio/"):
        return error_response("An audio recording is required", 400, request.headers.get("x-request-id"))

    contents = await file.read(MAX_AUDIO_BYTES + 1)
    if len(contents) > MAX_AUDIO_BYTES:
        return error_response("Audio segment is too large", 413, request.headers.get("x-request-id"))
    if not contents:
        return error_response("Audio segment is empty", 400, request.headers.get("x-request-id"))

    suffix = Path(file.filename or "segment.webm").suffix or ".webm"
    temporary_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temporary_file:
            temporary_file.write(contents)
            temporary_path = temporary_file.name
        async with transcription_lock:
            result = await run_in_threadpool(transcribe_file, temporary_path, normalize_language(language))
        return {"success": True, "data": result, "requestId": request.headers.get("x-request-id")}
    except RuntimeError as exc:
        return error_response("Speech-to-text inference failed", 503, request.headers.get("x-request-id"), str(exc))
    except Exception as exc:  # noqa: BLE001 - convert decoder/model errors to the API contract.
        return error_response("Could not transcribe this audio segment", 422, request.headers.get("x-request-id"), str(exc))
    finally:
        if temporary_path:
            try:
                os.unlink(temporary_path)
            except OSError:
                pass


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    message = exc.detail if isinstance(exc.detail, str) else "Speech-to-text request failed"
    return error_response(message, exc.status_code, request.headers.get("x-request-id"))


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    return error_response("Speech-to-text service failed", 500, request.headers.get("x-request-id"), str(exc))

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("server:app", host="0.0.0.0", port=PORT)
