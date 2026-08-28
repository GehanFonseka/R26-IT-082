import os
from pathlib import Path
from typing import Any
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, Field

try:
    from .feature_adapter import FeatureAdapter
    from .model_runner import ModelRunner
except ImportError:
    from feature_adapter import FeatureAdapter
    from model_runner import ModelRunner


ROOT = Path(__file__).resolve().parents[1]
MODEL_FILE = Path(os.getenv("MODEL_FILE", ROOT / "attrition_risk_catboost_v7_optuna.joblib"))
DATASET_FILE = Path(os.getenv("MODEL_DATASET_FILE", ROOT / "Sri_Lankan_Hiring_Attrition_Dataset.csv"))
MODEL_ID = os.getenv("MODEL_ID", "attrition-risk-catboost-v7")
runner = ModelRunner(MODEL_FILE, MODEL_ID, float(os.getenv("MODEL_THRESHOLD", "0.33")))
model_error = ""
adapter: FeatureAdapter | None = None
try:
    runner.load()
    adapter = FeatureAdapter(DATASET_FILE, runner.artifact.get("features", []), runner.feature_names, runner.categorical_features, runner.numerical_features)
except Exception as error:
    model_error = str(error)

app = FastAPI(title="Local Attrition Model Service", version="1.0.0")


class PredictRequest(BaseModel):
    candidate: dict[str, Any] | None = None
    simulation: dict[str, Any] = Field(default_factory=dict)
    features: dict[str, Any] | None = None


def request_id(request: Request) -> str:
    return request.headers.get("x-request-id") or str(uuid4())


@app.get("/health")
def health(request: Request):
    return {"success": not bool(model_error), "service": "attrition-model-service", "status": "ok" if not model_error else "degraded", "modelLoaded": not bool(model_error), "modelId": MODEL_ID, "modelError": model_error or None, "requestId": request_id(request)}


@app.post("/predict")
def predict(payload: PredictRequest, request: Request):
    if model_error:
        raise HTTPException(status_code=503, detail={"success": False, "message": "Local attrition model is unavailable", "error": model_error})
    candidate = payload.candidate or {}
    try:
        exact_features = payload.features or candidate.get("modelFeatures")
        if exact_features:
            result = runner.predict(exact_features, {"inputSource": "exact-features", "inputCoverage": 1})
        elif adapter and candidate:
            frame, metadata = adapter.build(candidate, payload.simulation)
            result = runner.predict_frame(frame, metadata)
        else:
            raise ValueError("candidate or exact model features are required")
    except Exception as error:
        raise HTTPException(status_code=422, detail={"success": False, "message": "Unable to prepare local model input", "error": str(error)}) from error
    return {**result, "simulation": payload.simulation, "requestId": request_id(request)}
