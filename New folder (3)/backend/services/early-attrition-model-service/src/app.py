import os
from pathlib import Path
from typing import Any
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, Field

try:
    from .model_runner import EarlyAttritionRunner
except ImportError:
    from model_runner import EarlyAttritionRunner


ROOT = Path(__file__).resolve().parents[1]
MODEL_FILE = Path(os.getenv("MODEL_FILE", ROOT / "model" / "model.pkl"))
MODEL_ID = os.getenv("MODEL_ID", "early-attrition-logistic-v1")
runner = EarlyAttritionRunner(MODEL_FILE, MODEL_ID)
model_error = ""
try:
    runner.load()
except Exception as error:
    model_error = str(error)

app = FastAPI(title="Local Early Attrition Model Service", version="1.0.0")


class PredictRequest(BaseModel):
    features: dict[str, Any]
    simulation: dict[str, Any] = Field(default_factory=dict)


def request_id(request: Request) -> str:
    return request.headers.get("x-request-id") or str(uuid4())


@app.get("/health")
def health(request: Request):
    return {"success": not bool(model_error), "service": "early-attrition-model-service", "status": "ok" if not model_error else "degraded", "modelLoaded": not bool(model_error), "modelId": MODEL_ID, "target": "EarlyAttrition", "modelError": model_error or None, "requestId": request_id(request)}


@app.post("/predict")
def predict(payload: PredictRequest, request: Request):
    if model_error:
        raise HTTPException(status_code=503, detail={"success": False, "message": "EarlyAttrition model is unavailable", "error": model_error})
    try:
        result = runner.predict(payload.features)
    except (TypeError, ValueError) as error:
        raise HTTPException(status_code=422, detail={"success": False, "message": "Invalid EarlyAttrition model input", "error": str(error)}) from error
    return {**result, "simulation": payload.simulation, "requestId": request_id(request)}
