from __future__ import annotations

import asyncio
import os
import tempfile
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from faster_whisper import WhisperModel
from dotenv import load_dotenv


SERVICE_NAME = "speech-to-text-service"
SERVICE_DIRECTORY = Path(__file__).resolve().parents[1]
PROJECT_DIRECTORY = Path(__file__).resolve().parents[1]
load_dotenv(PROJECT_DIRECTORY / ".env")
load_dotenv(SERVICE_DIRECTORY / ".env")

PORT = int(os.getenv("PORT", "4005"))
MODEL_SIZE = os.getenv("WHISPER_MODEL_SIZE", "tiny")
DEVICE = os.getenv("WHISPER_DEVICE", "cpu")
COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "int8" if DEVICE == "cpu" else "float16")
MODEL_DIR = os.getenv("WHISPER_MODEL_DIR") or None
BEAM_SIZE = int(os.getenv("WHISPER_BEAM_SIZE", "1"))
MAX_AUDIO_BYTES = int(os.getenv("MAX_AUDIO_BYTES", str(5 * 1024 * 1024)))

model: WhisperModel | None = None
model_load_error = ""
transcription_lock = asyncio.Lock()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    global model, model_load_error
    try:
        model = WhisperModel(
            MODEL_SIZE,
            device=DEVICE,
            compute_type=COMPUTE_TYPE,
            download_root=MODEL_DIR,
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


def error_response(message: str, status_code: int, request_id: str | None = None, error: str | None = None):
    body = {"success": False, "message": message}
    if error:
        body["error"] = error
    if request_id:
        body["requestId"] = request_id
    return JSONResponse(status_code=status_code, content=body)


def normalize_language(language: str | None) -> str | None:
    value = (language or "").strip().lower()
    if not value:
        return None
    return value.split("-")[0]


def transcribe_file(file_path: str, language: str | None):
    if model is None:
        raise RuntimeError("Speech-to-text model is not loaded")
    segments, info = model.transcribe(
        file_path,
        language=language,
        beam_size=BEAM_SIZE,
        vad_filter=True,
        condition_on_previous_text=False,
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
        "model": MODEL_SIZE,
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
