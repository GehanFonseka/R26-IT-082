import os
from contextlib import asynccontextmanager
from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, Field

try:
    from .model_runner import InterviewAnswerModelRunner
except ImportError:  # Supports uvicorn app:app --app-dir src for local development.
    from model_runner import InterviewAnswerModelRunner


ROOT = Path(__file__).resolve().parents[1]
MODEL_ROOT = os.getenv("MODEL_ROOT")
if os.getenv("MODEL_DIR"):
    MODEL_DIR = Path(os.getenv("MODEL_DIR"))
elif MODEL_ROOT:
    MODEL_DIR = Path(MODEL_ROOT) / "interview-answer" / "v5"
else:
    MODEL_DIR = ROOT / "model" / "v5"
if not MODEL_DIR.is_absolute():
    MODEL_DIR = (Path.cwd() / MODEL_DIR).resolve()

if os.getenv("NLI_MODEL_DIR"):
    NLI_MODEL_DIR = Path(os.getenv("NLI_MODEL_DIR"))
elif MODEL_ROOT:
    NLI_MODEL_DIR = Path(MODEL_ROOT) / "interview-answer" / "nli"
else:
    NLI_MODEL_DIR = ROOT / "model" / "nli"
if not NLI_MODEL_DIR.is_absolute():
    NLI_MODEL_DIR = (Path.cwd() / NLI_MODEL_DIR).resolve()

MODEL_DEVICE = os.getenv("MODEL_DEVICE", "cpu")
MODEL_MAX_LENGTH = int(os.getenv("MODEL_MAX_LENGTH", "384"))
MODEL_ID = os.getenv("MODEL_ID", "Final_ASAG_Interview_Scorer_V5")
NLI_MODEL_ID = os.getenv("NLI_MODEL_ID", "cross-encoder/nli-deberta-v3-base")
LAZY_LOAD_MODEL = os.getenv("LAZY_LOAD_MODEL", "false").lower() in ("true", "1", "yes")

runner = InterviewAnswerModelRunner(MODEL_DIR, NLI_MODEL_DIR, MODEL_DEVICE, MODEL_MAX_LENGTH, MODEL_ID, NLI_MODEL_ID)
model_error = ""


@asynccontextmanager
async def lifespan(_app: FastAPI):
    global model_error
    if LAZY_LOAD_MODEL:
        print(f"interview-answer-model-service: lazy loading enabled, model will load on first inference request")
    else:
        try:
            runner.load()
            print(f"interview-answer-model-service loaded {MODEL_ID} from {MODEL_DIR}")
        except Exception as error:  # Keep health available with an actionable failure state.
            model_error = str(error)
            print(f"interview-answer-model-service model loading failed: {model_error}")
    yield


app = FastAPI(title="Interview Answer Scoring Model Service", version="2.0.0", lifespan=lifespan)


class PredictRequest(BaseModel):
    question: str = Field(min_length=1, max_length=10000)
    referenceAnswer: str = Field(min_length=1, max_length=16000)
    candidateAnswer: str = Field(min_length=1, max_length=16000)


def request_id(request: Request) -> str:
    return request.headers.get("x-request-id") or str(uuid4())


@app.get("/health")
def health(request: Request):
    status = "ok" if runner.loaded else ("standby" if LAZY_LOAD_MODEL and not model_error else "degraded")
    return {
        "success": not bool(model_error),
        "service": "interview-answer-model-service",
        "status": status,
        "modelLoaded": runner.loaded,
        "modelId": MODEL_ID,
        "lazyLoading": LAZY_LOAD_MODEL,
        "modelError": model_error or None,
        "requestId": request_id(request),
    }


@app.post("/predict")
def predict(payload: PredictRequest, request: Request):
    global model_error
    if not runner.loaded:
        try:
            runner.load()
            model_error = ""
        except Exception as error:
            model_error = str(error)
            raise HTTPException(status_code=503, detail={
                "success": False,
                "message": "Interview answer scoring model could not be loaded",
                "error": model_error,
            }) from error
    if model_error:
        raise HTTPException(status_code=503, detail={
            "success": False,
            "message": "Interview answer scoring model is unavailable",
            "error": model_error,
        })
    try:
        result = runner.predict(payload.question, payload.referenceAnswer, payload.candidateAnswer)
    except ValueError as error:
        raise HTTPException(status_code=400, detail={"success": False, "message": str(error)}) from error
    except Exception as error:
        raise HTTPException(status_code=422, detail={
            "success": False,
            "message": "Interview answer model inference failed",
            "error": str(error),
        }) from error
    return {"success": True, "data": result, "requestId": request_id(request)}
