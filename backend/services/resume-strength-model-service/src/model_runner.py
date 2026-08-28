import json
from pathlib import Path
from typing import Any

import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

try:
    from .model_decode import decode_outputs
    from .model_input import format_model_input
except ImportError:
    from model_decode import decode_outputs
    from model_input import format_model_input


class ResumeStrengthRunner:
    def __init__(self, model_dir: str | Path, device: str = "cpu", max_length: int = 384):
        self.model_dir = Path(model_dir).resolve()
        self.device = "cuda" if device.lower() == "cuda" and torch.cuda.is_available() else "cpu"
        self.max_length = max_length
        self.tokenizer = None
        self.model = None
        self.calibration = {"project_advanced": 1.0, "skill_advanced": 1.0, "alignment_advanced": 1.0}

    @property
    def loaded(self) -> bool:
        return self.tokenizer is not None and self.model is not None

    def load(self) -> None:
        if not self.model_dir.exists():
            raise FileNotFoundError(f"Resume strength model directory does not exist: {self.model_dir}")
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_dir, local_files_only=True, use_fast=False)
        self.model = AutoModelForSequenceClassification.from_pretrained(self.model_dir, local_files_only=True)
        if int(self.model.config.num_labels) != 12:
            raise ValueError(f"Expected V5 12-output checkpoint, found {self.model.config.num_labels} labels")
        metrics_path = self.model_dir / "metrics.json"
        if metrics_path.is_file():
            metrics = json.loads(metrics_path.read_text(encoding="utf-8"))
            self.calibration.update(metrics.get("probability_calibration", {}))
        self.model.to(self.device)
        self.model.eval()

    def predict_many(self, items: list[dict[str, Any]]) -> list[dict[str, Any]]:
        if not self.loaded:
            raise RuntimeError("Resume strength model is not loaded")
        if not items:
            return []
        texts, years = zip(*(format_model_input(item) for item in items))
        encoded = self.tokenizer(list(texts), return_tensors="pt", truncation=True, padding=True, max_length=self.max_length)
        encoded = {key: value.to(self.device) for key, value in encoded.items()}
        with torch.inference_mode():
            logits = self.model(**encoded).logits.float().cpu()
        return decode_outputs(logits, items, list(years), self.calibration)

    def predict(self, item: dict[str, Any]) -> dict[str, Any]:
        return self.predict_many([item])[0]
