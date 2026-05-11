from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .member_1_attrition_risk.routes import router as attrition_router
from .shared.ats_store import init_ats_store
from .shared.hiring_cycle import router as hiring_cycle_router
from .shared.model_loader import init_model_bundle
from .shared.schemas import HealthResponse
from .member_4_interview_evaluation.interview_scorer import init_interview_model_bundle
from .member_4_interview_evaluation.routes import router as interview_router
from .member_3_job_matching.routes import router as matching_router
from .member_2_resume_parser.routes import router as resume_router

LOGGER = logging.getLogger("ai_recruitment_backend")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)

FOUR_MEMBER_MODEL_ROUTERS = [
    attrition_router,  # Member 1: models/01_attrition_risk_model_training.ipynb
    resume_router,  # Member 2: models/02_resume_parser_model_training.ipynb
    matching_router,  # Member 3: models/03_job_matching_model_training.ipynb
    interview_router,  # Member 4: models/04_interview_evaluation_model_training.ipynb
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    project_root = Path(__file__).resolve().parents[1]

    bundle = init_model_bundle()
    interview_bundle = init_interview_model_bundle()
    ats_store = init_ats_store(project_root)

    app.state.model_bundle = bundle
    app.state.ats_store = ats_store

    LOGGER.info(
        "Attrition model loaded | model=%s | threshold=%.6f | columns=%d",
        bundle.model_name,
        bundle.threshold,
        len(bundle.expected_columns),
    )
    LOGGER.info(
        "Interview model initialized | model=%s | source=%s",
        interview_bundle.model_name,
        interview_bundle.model_source,
    )
    LOGGER.info("ATS store initialized | path=%s", ats_store.store_path)
    yield


app = FastAPI(
    title="AI Talent Acquisition API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for model_router in FOUR_MEMBER_MODEL_ROUTERS:
    app.include_router(model_router)

app.include_router(hiring_cycle_router)


@app.get("/health", response_model=HealthResponse)
async def health() -> dict[str, str]:
    return {"status": "ok"}
