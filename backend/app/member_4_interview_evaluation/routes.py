from __future__ import annotations

from typing import Any, Optional
from uuid import uuid4

from fastapi import APIRouter, Body, Header

from ..shared.ats_store import ROLE_ADMIN, ROLE_RECRUITER, get_ats_store
from ..shared.errors import friendly_error
from ..shared.schemas import ErrorResponse, InterviewEvaluationRequest, InterviewEvaluationResponse
from .interview_scorer import evaluate_interview_answer

router = APIRouter(prefix="/api/v1/interview", tags=["Member 4 - Interview Evaluation"])


def _extract_bearer_token(authorization: Optional[str]) -> str:
    if not authorization:
        return ""
    parts = authorization.strip().split()
    if len(parts) != 2:
        return ""
    scheme, token = parts
    if scheme.lower() != "bearer":
        return ""
    return token.strip()


def _require_hr_or_admin_user(authorization: Optional[str]) -> dict[str, Any]:
    token = _extract_bearer_token(authorization)
    if not token:
        raise friendly_error(401, "Authentication required for interview evaluation")

    user = get_ats_store().get_user_by_token(token)
    if not user:
        raise friendly_error(401, "Invalid or expired token")

    if user.get("role") not in {ROLE_RECRUITER, ROLE_ADMIN}:
        raise friendly_error(403, "Interview evaluation is allowed only for HR/recruiter users")

    return user


@router.post(
    "/evaluate",
    response_model=InterviewEvaluationResponse,
    responses={400: {"model": ErrorResponse}},
)
async def evaluate_interview(
    payload: InterviewEvaluationRequest = Body(...),
    authorization: Optional[str] = Header(default=None),
) -> dict[str, Any]:
    _require_hr_or_admin_user(authorization)

    request_id = str(uuid4())
    answer_text = (payload.answer_text or "").strip()
    question_text = payload.question_text

    if not answer_text:
        raise friendly_error(400, "answer_text is required and cannot be empty")

    try:
        result = evaluate_interview_answer(
            answer_text=answer_text,
            question_text=question_text,
        )
        return {"request_id": request_id, **result}
    except ValueError as exc:
        raise friendly_error(400, str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise friendly_error(
            500,
            "Unexpected error while evaluating interview answer",
            str(exc),
        ) from exc
