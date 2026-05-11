from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any

import numpy as np


LABEL_DESCRIPTIONS = {
    "technical_skills": "Technical skill evidence",
    "backend_engineering": "Backend engineering profile",
    "frontend_engineering": "Frontend engineering profile",
    "machine_learning": "Machine learning profile",
    "data_analytics": "Data analytics profile",
    "cloud_devops": "Cloud and DevOps profile",
    "security": "Security profile",
    "leadership_management": "Leadership and management evidence",
    "project_management": "Project management evidence",
    "product_management": "Product management evidence",
    "experience_depth": "Professional experience depth",
    "education_credentials": "Education and credential evidence",
    "communication": "Communication evidence",
    "entry_level": "Entry-level profile signal",
    "healthcare_domain": "Healthcare domain signal",
    "marketing_sales": "Marketing and sales signal",
    "human_resources": "Human resources signal",
}


def _default_model_path() -> Path:
    return Path(__file__).resolve().parent / "model_artifacts" / "resume_explainer.joblib"


@lru_cache(maxsize=1)
def _load_artifact() -> dict[str, Any] | None:
    path = _default_model_path()
    if not path.exists():
        return None

    try:
        import joblib

        return joblib.load(path)
    except Exception:
        return None


def _top_terms_for_label(artifact: dict[str, Any], text: str, label_index: int, limit: int = 6) -> list[str]:
    vectorizer = artifact["vectorizer"]
    classifier = artifact["classifier"]
    matrix = vectorizer.transform([text])
    feature_names = vectorizer.get_feature_names_out()

    estimator = classifier.estimators_[label_index]
    coefficients = getattr(estimator, "coef_", None)
    if coefficients is None:
        return []

    dense = matrix.toarray()[0]
    weights = np.asarray(coefficients[0])
    positive_strength = dense * np.maximum(weights, 0)
    indices = np.where(positive_strength > 0)[0]
    ranked = sorted(indices, key=lambda idx: positive_strength[idx], reverse=True)
    return [str(feature_names[idx]) for idx in ranked[:limit]]


def analyze_resume_with_trained_model(cv_text: str) -> dict[str, Any] | None:
    text = (cv_text or "").strip()
    if not text:
        return None

    artifact = _load_artifact()
    if artifact is None:
        return None

    try:
        vectorizer = artifact["vectorizer"]
        classifier = artifact["classifier"]
        label_binarizer = artifact["label_binarizer"]
        matrix = vectorizer.transform([text])
        probabilities = classifier.predict_proba(matrix)[0]
    except Exception:
        return None

    label_scores: list[dict[str, Any]] = []
    for index, label in enumerate(label_binarizer.classes_):
        confidence = round(float(probabilities[index]) * 100, 2)
        if confidence < 15:
            continue

        label_scores.append(
            {
                "label": str(label),
                "description": LABEL_DESCRIPTIONS.get(str(label), str(label).replace("_", " ").title()),
                "confidence_0_100": confidence,
                "evidence_terms": _top_terms_for_label(artifact, text, index),
            }
        )

    label_scores.sort(key=lambda item: item["confidence_0_100"], reverse=True)

    return {
        "model_name": str(artifact.get("model_name", "tfidf_logistic_resume_explainer_v1")),
        "model_source": str(artifact.get("model_source", "local_resume_explainer")),
        "label_scores": label_scores[:8],
    }
