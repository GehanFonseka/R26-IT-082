import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, Field

try:
    from .model_runner import ResumeStrengthRunner
except ImportError:  # Supports uvicorn app:app --app-dir src for local development.
    from model_runner import ResumeStrengthRunner


ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = Path(os.getenv("MODEL_DIR", ROOT / "model"))
if not MODEL_DIR.is_absolute():
    MODEL_DIR = (Path.cwd() / MODEL_DIR).resolve()
MODEL_DEVICE = os.getenv("MODEL_DEVICE", "cpu")
MODEL_MAX_LENGTH = int(os.getenv("MODEL_MAX_LENGTH", "256"))
runner = ResumeStrengthRunner(MODEL_DIR, MODEL_DEVICE, MODEL_MAX_LENGTH)
model_error = ""


@asynccontextmanager
async def lifespan(_app: FastAPI):
    global model_error
    try:
        runner.load()
        print(f"resume-strength-model-service loaded from {MODEL_DIR}")
    except Exception as error:  # Keep health endpoint available with a useful failure state.
        model_error = str(error)
        print(f"resume-strength-model-service model loading failed: {model_error}")
    yield


app = FastAPI(title="Resume Strength Model Service", version="1.0.0", lifespan=lifespan)


class PredictRequest(BaseModel):
    skill: str
    project: str = ""
    experience: str = ""
    experienceText: str = ""
    experienceYears: float | None = None
    certifications: str = ""


class BatchPredictRequest(BaseModel):
    items: list[PredictRequest] = Field(default_factory=list, max_length=256)


def request_id(request: Request) -> str:
    return request.headers.get("x-request-id") or str(uuid4())


@app.get("/health")
def health(request: Request):
    return {
        "success": not bool(model_error),
        "service": "resume-strength-model-service",
        "status": "ok" if not model_error else "degraded",
        "modelLoaded": runner.loaded,
        "modelDirectory": str(MODEL_DIR),
        "modelError": model_error or None,
        "requestId": request_id(request),
    }


@app.post("/predict")
def predict(payload: PredictRequest, request: Request):
    if model_error or not runner.loaded:
        raise HTTPException(status_code=503, detail={"success": False, "message": "Resume strength model is unavailable", "error": model_error or "Model is not loaded"})
    try:
        result = runner.predict(payload.model_dump())
    except Exception as error:
        raise HTTPException(status_code=422, detail={"success": False, "message": "Resume strength inference failed", "error": str(error)}) from error
    return {"success": True, "data": result, "requestId": request_id(request)}


@app.post("/predict/batch")
def predict_batch(payload: BatchPredictRequest, request: Request):
    if model_error or not runner.loaded:
        raise HTTPException(status_code=503, detail={"success": False, "message": "Resume strength model is unavailable", "error": model_error or "Model is not loaded"})
    if not payload.items:
        raise HTTPException(status_code=400, detail={"success": False, "message": "At least one skill context is required"})
    try:
        results = runner.predict_many([item.model_dump() for item in payload.items])
    except Exception as error:
        raise HTTPException(status_code=422, detail={"success": False, "message": "Resume strength inference failed", "error": str(error)}) from error
    return {"success": True, "data": results, "requestId": request_id(request)}
