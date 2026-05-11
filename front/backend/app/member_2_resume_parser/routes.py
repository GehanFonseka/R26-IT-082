from __future__ import annotations

from pathlib import Path
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, File, UploadFile

from ..shared.cv_cache import get_cached_cv, store_cached_cv
from ..shared.errors import friendly_error
from ..shared.schemas import CvCacheTextResponse, CvCacheUploadResponse, ErrorResponse
from ..shared.utils import (
    MAX_UPLOAD_SIZE_BYTES,
    clean_filename,
    is_allowed_upload,
    safe_remove_file,
    uploads_dir,
)
from .cv_parser import extract_text_from_file

router = APIRouter(prefix="/api/v1/cv-cache", tags=["Member 2 - Resume Parsing"])


@router.post(
    "/upload",
    response_model=CvCacheUploadResponse,
    responses={400: {"model": ErrorResponse}},
)
async def upload_cv_to_cache(
    cv_file: UploadFile = File(...),
) -> dict[str, Any]:
    file_name = clean_filename(cv_file.filename or "cv_upload")

    if not is_allowed_upload(cv_file.content_type, file_name):
        raise friendly_error(
            400,
            "Unsupported file type. Allowed: PDF, DOCX, TXT",
            f"Received content_type={cv_file.content_type}, filename={file_name}",
        )

    content = await cv_file.read()
    if not content:
        raise friendly_error(400, "Uploaded file is empty")

    if len(content) > MAX_UPLOAD_SIZE_BYTES:
        raise friendly_error(400, "Uploaded file exceeds 10MB limit")

    cache_entry = store_cached_cv(
        filename=file_name,
        content_type=cv_file.content_type,
        content=content,
    )

    return {
        "cv_cache_id": cache_entry.cv_cache_id,
        "filename": cache_entry.filename,
        "content_type": cache_entry.content_type,
        "created_at": cache_entry.created_at.isoformat(),
        "expires_at": cache_entry.expires_at.isoformat(),
        "ttl_seconds": int((cache_entry.expires_at - cache_entry.created_at).total_seconds()),
    }


@router.get(
    "/{cv_cache_id}/text",
    response_model=CvCacheTextResponse,
    responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
async def get_cached_cv_text(
    cv_cache_id: str,
) -> dict[str, Any]:
    try:
        cached_cv = get_cached_cv(cv_cache_id)
    except KeyError as exc:
        raise friendly_error(
            404,
            "cv_cache_id not found or expired",
            "Upload the CV again to refresh temporary cache.",
        ) from exc

    file_name = clean_filename(cached_cv.filename or "cv_cached_upload")
    if not is_allowed_upload(cached_cv.content_type, file_name):
        raise friendly_error(
            400,
            "Unsupported cached file type. Allowed: PDF, DOCX, TXT",
            f"Cached content_type={cached_cv.content_type}, filename={file_name}",
        )

    temp_path = uploads_dir() / f"{uuid4().hex}{Path(file_name).suffix.lower()}"

    try:
        temp_path.write_bytes(cached_cv.content)
        raw_text = extract_text_from_file(temp_path)
        return {
            "cv_cache_id": cv_cache_id,
            "filename": file_name,
            "text": raw_text,
            "char_count": len(raw_text),
        }
    except ValueError as exc:
        raise friendly_error(400, str(exc)) from exc
    finally:
        safe_remove_file(temp_path)
