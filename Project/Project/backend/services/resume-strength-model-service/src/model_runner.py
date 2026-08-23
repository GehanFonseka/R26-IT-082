import os
import re
from datetime import datetime
from pathlib import Path
from typing import Any

import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer


def duration_years(value: Any) -> float:
    text = str(value or "").lower()
    years = [float(item) for item in re.findall(r"(\d+(?:\.\d+)?)\s*(?:years?|yrs?)", text)]
    months = [float(item) for item in re.findall(r"(\d+(?:\.\d+)?)\s*(?:months?|mos?)", text)]
    explicit = sum(years) + sum(item / 12 for item in months)
    if explicit > 0:
        return min(explicit, 15)

    year_values = [int(item) for item in re.findall(r"\b(?:19|20)\d{2}\b", text)]
    if not year_values:
        return 0.0
    start = min(year_values)
    end = datetime.now().year if re.search(r"\b(?:present|current|ongoing)\b", text) else max(year_values)
    return min(max(end - start, 0.25), 15) if end >= start else 0.0


def proficiency(score: float) -> str:
    if score >= 70:
        return "Advanced"
    if score >= 40:
        return "Intermediate"
    return "Beginner"


def model_input(item: dict[str, Any]) -> tuple[str, float]:
    skill = str(item.get("skill") or "").strip()
    project = str(item.get("project") or "").strip()
    experience = str(item.get("experience") or item.get("experienceText") or "").strip()
    certifications = str(item.get("certifications") or "").strip()
    years = duration_years(experience)
    if not years and item.get("experienceYears") is not None:
        try:
            years = min(max(float(item["experienceYears"]), 0), 15)
        except (TypeError, ValueError):
            years = 0.0

    text = "\n".join([
        "[SKILL]",
        skill,
        "",
        "[PROJECT]",
        project,
        "",
        "[PROFESSIONAL EXPERIENCE]",
        experience,
        "",
        "[ESTIMATED PROFESSIONAL SKILL YEARS]",
        f"{years:.2f}",
        "",
        "[CERTIFICATIONS]",
        certifications,
    ])
    return text, years


class ResumeStrengthRunner:
    def __init__(self, model_dir: str | Path, device: str = "cpu", max_length: int = 256):
        self.model_dir = Path(model_dir).resolve()
        requested_device = device.lower()
        self.device = "cuda" if requested_device == "cuda" and torch.cuda.is_available() else "cpu"
        self.max_length = max_length
        self.tokenizer = None
        self.model = None

    @property
    def loaded(self) -> bool:
        return self.tokenizer is not None and self.model is not None

    def load(self) -> None:
        if not self.model_dir.exists():
            raise FileNotFoundError(f"Resume strength model directory does not exist: {self.model_dir}")
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_dir, local_files_only=True, use_fast=False)
        self.model = AutoModelForSequenceClassification.from_pretrained(self.model_dir, local_files_only=True)
        self.model.to(self.device)
        self.model.eval()

    def predict_many(self, items: list[dict[str, Any]]) -> list[dict[str, Any]]:
        if not self.loaded:
            raise RuntimeError("Resume strength model is not loaded")
        if not items:
            return []

        texts = []
        years = []
        for item in items:
            text, duration = model_input(item)
            texts.append(text)
            years.append(duration)

        encoded = self.tokenizer(
            texts,
            return_tensors="pt",
            truncation=True,
            padding=True,
            max_length=self.max_length,
        )
        encoded = {key: value.to(self.device) for key, value in encoded.items()}
        with torch.inference_mode():
            logits = self.model(**encoded).logits
            scores = torch.sigmoid(logits).float().cpu().numpy() * 100

        results = []
        for item, score, years in zip(items, scores, years):
            project_score = round(float(score[0]), 2)
            skill_score = round(float(score[1]), 2)
            alignment_score = round(float(score[2]), 2)
            results.append({
                "skill": str(item.get("skill") or "").strip(),
                "projectStrength": project_score,
                "skillEvidenceStrength": skill_score,
                "experienceProjectAlignment": alignment_score,
                "skillProficiency": proficiency(skill_score),
                "experienceYears": round(years, 2),
            })
        return results

    def predict(self, item: dict[str, Any]) -> dict[str, Any]:
        return self.predict_many([item])[0]
