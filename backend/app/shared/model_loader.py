from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Optional

import joblib
import xgboost as xgb


@dataclass(frozen=True)
class ModelBundle:
    booster: xgb.Booster
    preprocess: Any
    expected_columns: list[str]
    categorical_columns: list[str]
    numeric_columns: list[str]
    threshold: float
    model_name: str
    config: dict[str, Any]


_BUNDLE: Optional[ModelBundle] = None


def _ensure_file(path: Path) -> None:
    if not path.exists() or not path.is_file():
        raise FileNotFoundError(f"Required model artifact not found: {path}")


def load_model_bundle(model_dir: Path) -> ModelBundle:
    model_dir = model_dir.resolve()

    config_path = model_dir / "config.json"
    schema_path = model_dir / "schema.json"
    preprocess_path = model_dir / "preprocess.joblib"
    booster_path = model_dir / "attrition_xgb.json"

    for path in (config_path, schema_path, preprocess_path, booster_path):
        _ensure_file(path)

    with config_path.open("r", encoding="utf-8") as f:
        config = json.load(f)

    with schema_path.open("r", encoding="utf-8") as f:
        schema = json.load(f)

    preprocess = joblib.load(preprocess_path)

    booster = xgb.Booster()
    booster.load_model(str(booster_path))

    expected_columns = schema.get("expected_columns", [])
    categorical_columns = schema.get("categorical_columns", [])
    numeric_columns = schema.get("numeric_columns", [])

    if not expected_columns:
        raise ValueError("schema.json does not contain expected_columns")

    return ModelBundle(
        booster=booster,
        preprocess=preprocess,
        expected_columns=expected_columns,
        categorical_columns=categorical_columns,
        numeric_columns=numeric_columns,
        threshold=float(config.get("threshold", 0.5)),
        model_name=str(config.get("model_name", "talent_acquisition_attrition_xgb")),
        config=config,
    )


def default_model_dir() -> Path:
    return Path(__file__).resolve().parents[1] / "member_1_attrition_risk" / "model_artifacts"


def init_model_bundle(model_dir: Optional[Path] = None) -> ModelBundle:
    global _BUNDLE
    bundle = load_model_bundle(model_dir or default_model_dir())
    _BUNDLE = bundle
    return bundle


def get_model_bundle() -> ModelBundle:
    if _BUNDLE is None:
        raise RuntimeError("Model bundle is not initialized")

    return _BUNDLE
