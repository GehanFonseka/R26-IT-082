from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd


class EarlyAttritionRunner:
    def __init__(self, model_path: Path, model_id: str):
        self.model_path = model_path
        self.model_id = model_id
        self.bundle: dict[str, Any] = {}
        self.model: Any = None
        self.features: list[str] = []
        self.threshold = 0.393

    def load(self) -> None:
        if not self.model_path.exists():
            raise FileNotFoundError(f"Model artifact not found: {self.model_path}")
        self.bundle = joblib.load(self.model_path)
        self.model = self.bundle["model"]
        self.features = list(self.bundle["features"])
        self.threshold = float(self.bundle.get("threshold", self.threshold))

    def predict(self, values: dict[str, Any]) -> dict[str, Any]:
        missing = [name for name in self.features if name not in values]
        if missing:
            raise ValueError(f"Missing EarlyAttrition features: {', '.join(missing)}")
        numbers = {name: float(values[name]) for name in self.features}
        invalid = [name for name, value in numbers.items() if not np.isfinite(value) or not 0 <= value <= 1]
        if invalid:
            raise ValueError(f"EarlyAttrition features must be between 0 and 1: {', '.join(invalid)}")
        frame = pd.DataFrame([numbers], columns=self.features)
        probability = float(self.model.predict_proba(frame)[0, 1])
        risk_score = round(probability * 100, 2)
        risk_level = "low" if probability < 0.25 else "medium" if probability < 0.60 else "high"
        return {
            "success": True,
            "target": self.bundle.get("target", "EarlyAttrition"),
            "modelId": self.model_id,
            "modelVersion": self.model_id,
            "method": "local-logistic-regression",
            "probability": probability,
            "riskScore": risk_score,
            "riskLevel": risk_level,
            "threshold": self.threshold,
            "predictedAttrition": probability >= self.threshold,
            "topRiskDrivers": self._drivers(frame),
            "featureValues": numbers, "modelInput": numbers,
        }

    def _drivers(self, frame: pd.DataFrame) -> list[dict[str, Any]]:
        scaler = self.model.named_steps["scaler"]
        classifier = self.model.named_steps["classifier"]
        contributions = classifier.coef_[0] * scaler.transform(frame)[0]
        rows = []
        for name, value, contribution in zip(self.features, frame.iloc[0], contributions):
            direction = "increases attrition risk" if contribution >= 0 else "reduces attrition risk"
            rows.append({"feature": name, "value": round(float(value), 4), "contribution": round(float(contribution), 4), "direction": direction, "explanation": f"{name} {direction}."})
        return sorted(rows, key=lambda item: abs(item["contribution"]), reverse=True)[:5]
