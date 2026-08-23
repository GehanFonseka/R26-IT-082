import json
import threading
from pathlib import Path
from typing import Any

import numpy as np
import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer


class InterviewAnswerModelRunner:
    """Loads the supplied V2 checkpoint once and applies its exact inference recipe."""

    def __init__(self, model_dir: Path, device_name: str = "cpu", max_length: int = 384, model_id: str = "Final_Interview_Answer_Scoring_Model_V2"):
        self.model_dir = model_dir
        self.device_name = device_name
        self.max_length = max_length
        self.model_id = model_id
        self.tokenizer = None
        self.model = None
        self.config: dict[str, Any] = {}
        self.loaded = False
        self._lock = threading.Lock()

    def load(self) -> None:
        if self.loaded:
            return
        if not self.model_dir.exists():
            raise FileNotFoundError(f"Model directory does not exist: {self.model_dir}")
        config_path = self.model_dir / "scoring_config.json"
        if not config_path.exists():
            raise FileNotFoundError(f"scoring_config.json is missing from {self.model_dir}")
        self.config = json.loads(config_path.read_text(encoding="utf-8"))
        requested_device = self.device_name.lower().strip()
        if requested_device.startswith("cuda") and not torch.cuda.is_available():
            requested_device = "cpu"
        self.device = torch.device(requested_device)
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_dir, local_files_only=True, use_fast=True)
        self.model = AutoModelForSequenceClassification.from_pretrained(self.model_dir, local_files_only=True)
        self.model.to(self.device)
        self.model.eval()
        self.loaded = True

    @property
    def class_names(self) -> list[str]:
        return list(self.config.get("class_names", ["Wrong", "Poor", "Average", "Good", "Excellent"]))

    def _score_to_class(self, score: float) -> int:
        thresholds = np.asarray(self.config["optimized_thresholds"], dtype=float)
        return int(np.digitize([score], thresholds)[0])

    def predict(self, question: str, reference_answer: str, candidate_answer: str) -> dict[str, Any]:
        if not self.loaded or self.tokenizer is None or self.model is None:
            raise RuntimeError("Interview answer scoring model is not loaded")
        question = str(question or "").strip()
        reference_answer = str(reference_answer or "").strip()
        candidate_answer = str(candidate_answer or "").strip()
        if not question:
            raise ValueError("question is required")
        if not reference_answer:
            raise ValueError("referenceAnswer is required")
        if not candidate_answer:
            raise ValueError("candidateAnswer is required")

        premise = f"Interview Question: {question}\nExpected Answer: {reference_answer}"
        hypothesis = f"Candidate Answer: {candidate_answer}"
        with self._lock, torch.no_grad():
            inputs = self.tokenizer(
                premise,
                hypothesis,
                return_tensors="pt",
                truncation=True,
                max_length=int(self.config.get("max_length", self.max_length)),
                padding=True,
            )
            inputs = {key: value.to(self.device) for key, value in inputs.items()}
            outputs = self.model(**inputs)

        probabilities = torch.softmax(outputs.logits[0], dim=-1).cpu().numpy()
        centers = np.asarray(self.config["class_score_centers"], dtype=float)
        raw_score = float(np.sum(probabilities * centers))
        calibrated_score = float(np.clip(
            float(self.config["calibration_a"]) * raw_score + float(self.config["calibration_b"]),
            0.0,
            1.0,
        ))
        class_id = self._score_to_class(calibrated_score)
        class_names = self.class_names
        return {
            "score": round(calibrated_score * 100, 2),
            "rating": class_names[class_id],
            "confidence": round(float(probabilities.max()) * 100, 2),
            "probabilities": {
                class_names[index]: round(float(probability) * 100, 2)
                for index, probability in enumerate(probabilities)
            },
            "modelId": self.model_id,
        }
