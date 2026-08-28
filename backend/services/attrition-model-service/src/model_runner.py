from pathlib import Path
from typing import Any

import joblib
import pandas as pd


class ModelRunner:
    def __init__(self, model_path: Path, model_id: str, threshold: float):
        self.model_path = model_path
        self.model_id = model_id
        self.threshold = threshold
        self.model: Any = None
        self.artifact: dict[str, Any] = {}
        self.feature_names: list[str] = []
        self.categorical_features: list[str] = []
        self.numerical_features: list[str] = []

    def load(self) -> None:
        if not self.model_path.exists():
            raise FileNotFoundError(f"Model artifact not found: {self.model_path}")
        loaded = joblib.load(self.model_path)
        self.artifact = loaded if isinstance(loaded, dict) else {"model": loaded}
        self.model = self.artifact.get("model") or self.artifact.get("estimator") or self.artifact.get("classifier")
        if self.model is None:
            raise ValueError("The joblib artifact does not contain a supported model key")
        self.feature_names = self.artifact.get("model_features") or self.artifact.get("feature_names") or list(getattr(self.model, "feature_names_", []))
        self.categorical_features = self.artifact.get("categorical_features", [])
        self.numerical_features = self.artifact.get("numerical_features", [])
        self.threshold = float(self.artifact.get("threshold", self.threshold))

    def predict(self, features: dict[str, Any], metadata: dict[str, Any] | None = None) -> dict[str, Any]:
        frame = pd.DataFrame([{name: features.get(name) for name in self.feature_names}], columns=self.feature_names)
        for name in self.categorical_features:
            if name in frame:
                frame[name] = frame[name].fillna("Missing").astype(str)
        for name in self.numerical_features:
            if name in frame:
                frame[name] = pd.to_numeric(frame[name], errors="coerce").fillna(0)
        return self.predict_frame(frame, metadata)

    def predict_frame(self, frame: pd.DataFrame, metadata: dict[str, Any] | None = None) -> dict[str, Any]:
        missing = [name for name in self.feature_names if name not in frame]
        if missing:
            raise ValueError(f"Missing model features: {', '.join(missing[:8])}")
        probability = float(self.model.predict_proba(frame[self.feature_names])[0][1])
        risk_score = round(probability * 100)
        risk_level = "low" if risk_score < 35 else "medium" if risk_score < 65 else "high"
        label = {"low": "Low attrition risk", "medium": "Moderate attrition risk", "high": "High attrition risk"}[risk_level]
        model_input = self._model_input(frame)
        result = {
            "success": True, "riskScore": risk_score, "riskLevel": risk_level, "riskLabel": label,
            "probability": probability, "predictedAttrition": probability >= self.threshold,
            "threshold": self.threshold, "modelId": self.model_id, "method": "local-catboost-v7",
            "modelInput": model_input, "featureValues": model_input, "topRiskDrivers": self._drivers(frame),
        }
        if metadata:
            result.update(metadata)
        return result

    @staticmethod
    def _model_input(frame: pd.DataFrame) -> dict[str, Any]:
        values = frame.iloc[0].to_dict()
        return {name: value.item() if hasattr(value, "item") else value for name, value in values.items()}

    def _drivers(self, frame: pd.DataFrame) -> list[dict[str, Any]]:
        if not hasattr(self.model, "get_feature_importance"):
            return []
        try:
            shap_values = self.model.get_feature_importance(type="ShapValues", data=frame[self.feature_names])[0]
        except Exception:
            return []
        rows = []
        for name, value, contribution in zip(self.feature_names, frame.iloc[0], shap_values[:-1]):
            amount = float(contribution)
            direction = "increases attrition risk" if amount >= 0 else "reduces attrition risk"
            clean_value = value.item() if hasattr(value, "item") else value
            rows.append({
                "feature": name, "value": clean_value, "contribution": round(amount, 4),
                "direction": direction, "explanation": f"{name} {direction}.",
            })
        return sorted(rows, key=lambda item: abs(item["contribution"]), reverse=True)[:5]
