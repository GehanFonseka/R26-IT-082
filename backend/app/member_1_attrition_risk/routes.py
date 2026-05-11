from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Optional
from uuid import uuid4

from fastapi import APIRouter, Body, File, Form, HTTPException, UploadFile

from ..shared.cv_cache import get_cached_cv
from ..shared.errors import friendly_error
from ..shared.model_loader import get_model_bundle
from ..shared.schemas import AttritionResponse, ErrorResponse, SchemaResponse
from ..shared.utils import (
    MAX_UPLOAD_SIZE_BYTES,
    build_example_payload,
    clean_filename,
    is_allowed_upload,
    merge_candidate_meta_overrides,
    parse_candidate_meta,
    safe_remove_file,
    uploads_dir,
)
from ..member_2_resume_parser.cv_parser import extract_features_from_cv_text, extract_text_from_file
from .predictor import build_prepared_features, predict_attrition

LOGGER = logging.getLogger("attrition_backend")

router = APIRouter(prefix="/api/v1/attrition", tags=["Member 1 - Attrition Risk"])

EMPLOYMENT_HISTORY_FIELDS: list[tuple[str, str]] = [
    ("TotalWorkingYears", "Total Working Years"),
    ("YearsAtCompany", "Years At Company"),
    ("YearsInCurrentRole", "Years In Current Role"),
    ("YearsSinceLastPromotion", "Years Since Last Promotion"),
    ("YearsWithCurrManager", "Years With Current Manager"),
    ("NumCompaniesWorked", "Companies Worked"),
]


def _build_response_payload(
    request_id: str,
    row_dict: dict[str, Any],
    prediction: dict[str, Any],
    inferred_fields: list[str],
    defaulted_fields: list[str],
    missing_fields: list[str],
    assumptions_used: list[str],
) -> dict[str, Any]:
    bundle = get_model_bundle()
    inferred_set = set(inferred_fields)
    defaulted_set = set(defaulted_fields)
    metrics: list[dict[str, Any]] = []

    for field_name, label in EMPLOYMENT_HISTORY_FIELDS:
        raw_value = row_dict.get(field_name)
        if raw_value is None:
            continue

        try:
            value = float(raw_value)
        except (TypeError, ValueError):
            continue

        source = "provided"
        if field_name in defaulted_set:
            source = "defaulted"
        elif field_name in inferred_set:
            source = "inferred"

        metrics.append(
            {
                "key": field_name,
                "label": label,
                "value": round(value, 2),
                "source": source,
            }
        )

    return {
        "request_id": request_id,
        "model": bundle.model_name,
        "threshold": bundle.threshold,
        "attrition_probability": prediction["attrition_probability"],
        "retention_probability": prediction["retention_probability"],
        "attrition_risk_score_0_100": prediction["attrition_risk_score_0_100"],
        "predicted_attrition": prediction["predicted_attrition"],
        "risk_band": prediction["risk_band"],
        "risk_band_rule": prediction["risk_band_rule"],
        "inferred_fields": inferred_fields,
        "defaulted_fields": defaulted_fields,
        "missing_fields": missing_fields,
        "assumptions_used": assumptions_used,
        "top_factors": prediction["top_factors"],
        "employment_history": {"metrics": metrics},
    }


@router.get("/schema", response_model=SchemaResponse)
async def attrition_schema() -> dict[str, Any]:
    bundle = get_model_bundle()
    return {
        "expected_columns": bundle.expected_columns,
        "example_payload": build_example_payload(
            expected_columns=bundle.expected_columns,
            numeric_columns=bundle.numeric_columns,
            categorical_columns=bundle.categorical_columns,
        ),
    }


@router.post(
    "/score",
    response_model=AttritionResponse,
    responses={400: {"model": ErrorResponse}},
)
async def score_from_json(
    payload: dict[str, Any] = Body(...),
) -> dict[str, Any]:
    if not isinstance(payload, dict):
        raise friendly_error(400, "Request body must be a JSON object")

    request_id = str(uuid4())
    bundle = get_model_bundle()

    prepared = build_prepared_features(
        raw_values=payload,
        bundle=bundle,
        inferred_fields=list(payload.keys()),
        base_assumptions=[],
    )
    prediction = predict_attrition(bundle, prepared)

    LOGGER.info(
        "request_id=%s source=json inferred=%d defaulted=%d",
        request_id,
        len(prepared.inferred_fields),
        len(prepared.defaulted_fields),
    )

    return _build_response_payload(
        request_id=request_id,
        row_dict=prepared.row_dict,
        prediction=prediction,
        inferred_fields=prepared.inferred_fields,
        defaulted_fields=prepared.defaulted_fields,
        missing_fields=prepared.missing_fields,
        assumptions_used=prepared.assumptions_used,
    )


@router.post(
    "/score-from-cv",
    response_model=AttritionResponse,
    responses={400: {"model": ErrorResponse}},
)
async def score_from_cv(
    cv_file: Optional[UploadFile] = File(default=None),
    cv_cache_id: Optional[str] = Form(default=None),
    candidate_meta: Optional[str] = Form(default=None),
) -> dict[str, Any]:
    request_id = str(uuid4())
    bundle = get_model_bundle()

    if cv_file is None and not cv_cache_id:
        raise friendly_error(400, "Provide either cv_file upload or cv_cache_id")

    if cv_file is not None:
        file_name = clean_filename(cv_file.filename or "cv_upload")

        if not is_allowed_upload(cv_file.content_type, file_name):
            raise friendly_error(
                400,
                "Unsupported file type. Allowed: PDF, DOCX, TXT",
                f"Received content_type={cv_file.content_type}, filename={file_name}",
            )

        content = await cv_file.read()
        content_type = cv_file.content_type
        source_label = "cv_upload"
    else:
        cache_id = str(cv_cache_id or "").strip()
        if not cache_id:
            raise friendly_error(400, "cv_cache_id cannot be empty")

        try:
            cached_cv = get_cached_cv(cache_id)
        except KeyError as exc:
            raise friendly_error(
                400,
                "cv_cache_id not found or expired",
                "Upload the CV again to refresh temporary cache.",
            ) from exc

        file_name = clean_filename(cached_cv.filename or "cv_cached_upload")
        content = cached_cv.content
        content_type = cached_cv.content_type
        source_label = f"cv_cache:{cache_id[:8]}"

        if not is_allowed_upload(content_type, file_name):
            raise friendly_error(
                400,
                "Unsupported cached file type. Allowed: PDF, DOCX, TXT",
                f"Cached content_type={content_type}, filename={file_name}",
            )

    if not content:
        raise friendly_error(400, "Uploaded file is empty")

    if len(content) > MAX_UPLOAD_SIZE_BYTES:
        raise friendly_error(400, "Uploaded file exceeds 10MB limit")

    try:
        parsed_candidate_meta = parse_candidate_meta(candidate_meta)
    except ValueError as exc:
        raise friendly_error(400, str(exc)) from exc

    temp_path = uploads_dir() / f"{uuid4().hex}{Path(file_name).suffix.lower()}"

    try:
        temp_path.write_bytes(content)
        raw_text = extract_text_from_file(temp_path)

        extracted_features, inferred_fields, cv_assumptions = extract_features_from_cv_text(raw_text)
        merged_features = dict(extracted_features)

        overridden_fields = merge_candidate_meta_overrides(
            merged_features,
            parsed_candidate_meta,
            bundle.expected_columns,
        )

        if overridden_fields:
            cv_assumptions.append("candidate_meta values were used to override inferred CV fields.")

        prepared = build_prepared_features(
            raw_values=merged_features,
            bundle=bundle,
            inferred_fields=inferred_fields + overridden_fields,
            base_assumptions=cv_assumptions,
        )
        prediction = predict_attrition(bundle, prepared)

        LOGGER.info(
            "request_id=%s source=%s chars=%d inferred=%d defaulted=%d",
            request_id,
            source_label,
            len(raw_text),
            len(prepared.inferred_fields),
            len(prepared.defaulted_fields),
        )

        return _build_response_payload(
            request_id=request_id,
            row_dict=prepared.row_dict,
            prediction=prediction,
            inferred_fields=prepared.inferred_fields,
            defaulted_fields=prepared.defaulted_fields,
            missing_fields=prepared.missing_fields,
            assumptions_used=prepared.assumptions_used,
        )
    except ValueError as exc:
        raise friendly_error(400, str(exc)) from exc
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        raise friendly_error(500, "Unexpected error while processing CV", str(exc)) from exc
    finally:
        safe_remove_file(temp_path)
