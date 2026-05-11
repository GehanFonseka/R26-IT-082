from __future__ import annotations

from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Body

from ..shared.errors import friendly_error
from ..shared.schemas import ErrorResponse, MatchingRequest, MatchingResponse
from .matching_engine import TargetDocument, recommend_matches

router = APIRouter(prefix="/api/v1/matching", tags=["Member 3 - Job Matching"])


@router.post(
    "/recommend",
    response_model=MatchingResponse,
    responses={400: {"model": ErrorResponse}},
)
async def match_recommendations(
    payload: MatchingRequest = Body(...),
) -> dict[str, Any]:
    request_id = str(uuid4())

    try:
        targets = [
            TargetDocument(
                target_id=item.id or f"T{index + 1}",
                target_title=item.title or item.id or f"Target {index + 1}",
                text=item.text,
            )
            for index, item in enumerate(payload.targets)
        ]
        result = recommend_matches(
            mode=payload.mode,
            source_text=payload.source_text,
            targets=targets,
            top_k=payload.top_k,
        )
        return {"request_id": request_id, **result}
    except ValueError as exc:
        raise friendly_error(400, str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise friendly_error(
            500,
            "Unexpected error while computing matching recommendations",
            str(exc),
        ) from exc
