from __future__ import annotations

from typing import Optional

from fastapi import HTTPException


def friendly_error(
    status_code: int,
    error: str,
    details: Optional[str] = None,
) -> HTTPException:
    return HTTPException(status_code=status_code, detail={"error": error, "details": details})
