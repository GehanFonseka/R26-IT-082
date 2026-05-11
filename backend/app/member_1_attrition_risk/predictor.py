from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Iterable, Optional

import pandas as pd
import xgboost as xgb

from ..shared.model_loader import ModelBundle
from ..shared.utils import (
    build_top_factors,
    coerce_feature_value,
    compute_risk_band,
    dedupe_preserve_order,
    get_default_value,
)


@dataclass
class PreparedFeatures:
    row_dict: dict[str, Any]
    dataframe: pd.DataFrame
    inferred_fields: list[str]
    defaulted_fields: list[str]
    assumptions_used: list[str]
    missing_fields: list[str]


def build_prepared_features(
    raw_values: dict[str, Any],
    bundle: ModelBundle,
    inferred_fields: Optional[Iterable[str]] = None,
    base_assumptions: Optional[Iterable[str]] = None,
) -> PreparedFeatures:
    source = raw_values or {}
    lower_lookup = {str(key).lower(): key for key in source.keys()}

    row: dict[str, Any] = {}
    defaulted_fields: list[str] = []
    assumptions: list[str] = list(base_assumptions or [])
    missing_fields: list[str] = []

    provided_inferred = list(inferred_fields or [])

    for column in bundle.expected_columns:
        source_key = column
        if source_key not in source:
            source_key = lower_lookup.get(column.lower(), column)

        raw_value = source.get(source_key)

        if raw_value in {None, ""}:
            row[column] = get_default_value(column)
            defaulted_fields.append(column)
            missing_fields.append(column)
            assumptions.append(
                f"{column} defaulted because it was not found in CV/request payload."
            )
            continue

        try:
            row[column] = coerce_feature_value(
                column=column,
                value=raw_value,
                numeric_columns=bundle.numeric_columns,
                categorical_columns=bundle.categorical_columns,
            )
        except ValueError:
            row[column] = get_default_value(column)
            defaulted_fields.append(column)
            assumptions.append(
                f"{column} defaulted because provided value could not be parsed safely."
            )

    df = pd.DataFrame([row], columns=bundle.expected_columns)

    # Include both parser-inferred and explicitly provided fields in the response.
    provided_fields = [
        col
        for col in bundle.expected_columns
        if source.get(col) not in {None, ""} or source.get(lower_lookup.get(col.lower(), "")) not in {None, ""}
    ]

    inferred_final = dedupe_preserve_order(
        [field for field in provided_inferred if field in bundle.expected_columns]
        + provided_fields
    )

    assumptions_final = dedupe_preserve_order(assumptions)

    return PreparedFeatures(
        row_dict=row,
        dataframe=df,
        inferred_fields=inferred_final,
        defaulted_fields=dedupe_preserve_order(defaulted_fields),
        assumptions_used=assumptions_final,
        missing_fields=dedupe_preserve_order(missing_fields),
    )


def predict_attrition(bundle: ModelBundle, prepared: PreparedFeatures) -> dict[str, Any]:
    transformed = bundle.preprocess.transform(prepared.dataframe)
    matrix = xgb.DMatrix(transformed)

    raw_probability = float(bundle.booster.predict(matrix)[0])
    attrition_probability = max(0.0, min(1.0, raw_probability))
    retention_probability = 1.0 - attrition_probability

    risk_score = round(attrition_probability * 100, 2)
    predicted_attrition = int(attrition_probability >= bundle.threshold)

    return {
        "attrition_probability": round(attrition_probability, 4),
        "retention_probability": round(retention_probability, 4),
        "attrition_risk_score_0_100": risk_score,
        "predicted_attrition": predicted_attrition,
        "risk_band": compute_risk_band(risk_score),
        "risk_band_rule": "LOW < 35, MEDIUM 35-65, HIGH > 65",
        "top_factors": build_top_factors(prepared.row_dict, prepared.defaulted_fields),
    }
