import asyncio
import json
import time
from uuid import uuid4
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException
from starlette.concurrency import run_in_threadpool
from config import MAX_BYTES, MAX_JOBS, VISION_ENABLED, VISION_MODEL, TIMEOUT
from contracts import ReadInput
from model_worker import worker
from body_limit import BodyLimit

@asynccontextmanager
async def lifespan(app):
    yield
    worker.close()

app = FastAPI(title="Local Certificate Reader", version="1.0.0", lifespan=lifespan)
app.add_middleware(BodyLimit)
jobs = asyncio.Semaphore(MAX_JOBS)

def failure(request, message, status):
    return JSONResponse({"success": False, "message": message,
        "requestId": request.headers.get("x-request-id") or str(uuid4())}, status_code=status)

@app.middleware("http")
async def request_limits(request: Request, call_next):
    try:
        content_length = int(request.headers.get("content-length", "0"))
    except ValueError:
        return failure(request, "Invalid request length.", 400)
    if content_length > MAX_BYTES * 1.4:
        return failure(request, "Certificate content is too large.", 413)
    return await call_next(request)

@app.exception_handler(RequestValidationError)
async def validation_error(request, error):
    return failure(request, "A supported certificate document within the configured limits is required.", 422)

@app.exception_handler(HTTPException)
async def http_error(request, error):
    return failure(request, "The local certificate reader request could not be processed.", error.status_code)

@app.get("/health")
async def health(request: Request):
    return {"success": True, "service": "certificate-reader-service", "status": "ok",
        "workerReady": bool(worker.process and worker.process.is_alive()), "visionEnabled": VISION_ENABLED, "visionModel": VISION_MODEL,
        "requestId": request.headers.get("x-request-id") or str(uuid4())}

@app.post("/read-certificate")
async def read(payload: ReadInput, request: Request):
    request_id = request.headers.get("x-request-id") or str(uuid4())
    if jobs.locked():
        return failure(request, "The local certificate reader is busy. Try again shortly.", 429)
    started = time.monotonic()
    async with jobs:
        try:
            response = await run_in_threadpool(worker.read, payload, request_id)
            if "error" in response:
                return failure(request, response["error"], response["status"])
            result = response["data"]
        except ValueError:
            return failure(request, "The certificate image or PDF could not be decoded safely.", 422)
        except Exception:
            return failure(request, "Local OCR is unavailable. Install the certificate reader dependencies and models.", 503)
    print(json.dumps({"service": "certificate-reader-service", "event": "certificate.read.completed",
        "requestId": request_id, "source": result["source"], "durationMs": round((time.monotonic() - started) * 1000)}), flush=True)
    return {"success": True, "data": result, "requestId": request_id}
