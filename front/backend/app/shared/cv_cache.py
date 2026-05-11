from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from threading import Lock
from typing import Optional
from uuid import uuid4


DEFAULT_CACHE_TTL_SECONDS = 30 * 60
MAX_CACHE_ITEMS = 128


@dataclass
class CachedCV:
    cv_cache_id: str
    filename: str
    content_type: Optional[str]
    content: bytes
    created_at: datetime
    expires_at: datetime


_CACHE: dict[str, CachedCV] = {}
_LOCK = Lock()


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _cleanup_expired_locked(now: datetime) -> None:
    expired_keys = [
        key
        for key, entry in _CACHE.items()
        if entry.expires_at <= now
    ]
    for key in expired_keys:
        _CACHE.pop(key, None)


def _evict_if_oversized_locked() -> None:
    if len(_CACHE) <= MAX_CACHE_ITEMS:
        return

    # Prefer evicting the earliest-expiring entries first.
    oldest_keys = sorted(_CACHE, key=lambda key: _CACHE[key].expires_at)
    while len(_CACHE) > MAX_CACHE_ITEMS and oldest_keys:
        key = oldest_keys.pop(0)
        _CACHE.pop(key, None)


def store_cached_cv(
    *,
    filename: str,
    content_type: Optional[str],
    content: bytes,
    ttl_seconds: int = DEFAULT_CACHE_TTL_SECONDS,
) -> CachedCV:
    now = _utc_now()
    expires_at = now + timedelta(seconds=max(60, ttl_seconds))
    entry = CachedCV(
        cv_cache_id=uuid4().hex,
        filename=filename,
        content_type=content_type,
        content=content,
        created_at=now,
        expires_at=expires_at,
    )

    with _LOCK:
        _cleanup_expired_locked(now)
        _CACHE[entry.cv_cache_id] = entry
        _evict_if_oversized_locked()

    return entry


def get_cached_cv(cv_cache_id: str) -> CachedCV:
    now = _utc_now()

    with _LOCK:
        _cleanup_expired_locked(now)
        entry = _CACHE.get(cv_cache_id)
        if entry is None:
            raise KeyError(cv_cache_id)
        return entry


def remove_cached_cv(cv_cache_id: str) -> bool:
    with _LOCK:
        return _CACHE.pop(cv_cache_id, None) is not None
