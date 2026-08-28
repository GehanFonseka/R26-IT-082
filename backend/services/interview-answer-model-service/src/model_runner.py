import json
import re
import threading
from pathlib import Path
from typing import Any

import numpy as np
import torch
import torch.nn as nn
from transformers import AutoConfig, AutoModel, AutoModelForSequenceClassification, AutoTokenizer

TOKEN_RE = re.compile(r"[A-Za-z0-9']+")

def _safe_div(numerator, denominator):
    return float(numerator / denominator) if denominator else 0.0

def lexical_features(question, reference, answer):
    question_tokens = TOKEN_RE.findall(str(question).lower())
    reference_tokens = TOKEN_RE.findall(str(reference).lower())
    answer_tokens = TOKEN_RE.findall(str(answer).lower())
    question_set, reference_set, answer_set = set(question_tokens), set(reference_tokens), set(answer_tokens)
    reference_answer_intersection = len(reference_set & answer_set)
    question_answer_intersection = len(question_set & answer_set)
    return np.array([
        _safe_div(reference_answer_intersection, len(reference_set | answer_set)),
        _safe_div(reference_answer_intersection, len(reference_set)),
        _safe_div(reference_answer_intersection, len(answer_set)),
        _safe_div(question_answer_intersection, len(question_set)),
        min(_safe_div(len(answer_tokens), max(len(reference_tokens), 1)), 3.0) / 3.0,
        min(len(answer_tokens), 300) / 300.0,
        min(len(reference_tokens), 300) / 300.0,
        min(len(question_tokens), 120) / 120.0,
    ], dtype=np.float32)

def softmax_np(values):
    values = np.asarray(values, dtype=np.float64)
    values = values - np.max(values)
    probabilities = np.exp(values)
    return probabilities / probabilities.sum()

class AdvancedASAGModel(nn.Module):
    def __init__(self, base_config, extra_dim, class_weights, class_centers):
        super().__init__()
        self.backbone = AutoModel.from_config(base_config)
        self.register_buffer("class_weights_tensor", torch.tensor(class_weights, dtype=torch.float32))
        self.register_buffer("class_centers_tensor", torch.tensor(class_centers, dtype=torch.float32))
        hidden = self.backbone.config.hidden_size
        self.fusion = nn.Sequential(
            nn.Linear(hidden * 2 + extra_dim, 768), nn.LayerNorm(768), nn.GELU(), nn.Dropout(0.20),
            nn.Linear(768, 384), nn.LayerNorm(384), nn.GELU(), nn.Dropout(0.20),
        )
        self.classifier = nn.Linear(384, 5)
        self.regressor = nn.Linear(384, 1)
        self.ordinal_head = nn.Linear(384, 4)

    def mean_pool(self, hidden, attention_mask):
        mask = attention_mask.unsqueeze(-1).float()
        return (hidden * mask).sum(1) / mask.sum(1).clamp(min=1e-6)

    def forward(self, input_ids, attention_mask, token_type_ids=None, extra_features=None):
        inputs = {"input_ids": input_ids, "attention_mask": attention_mask}
        if token_type_ids is not None:
            inputs["token_type_ids"] = token_type_ids
        output = self.backbone(**inputs, return_dict=True)
        cls_vector = output.last_hidden_state[:, 0, :]
        mean_vector = self.mean_pool(output.last_hidden_state, attention_mask)
        fused = self.fusion(torch.cat([cls_vector, mean_vector, extra_features], dim=1))
        return self.classifier(fused), self.regressor(fused).squeeze(-1), self.ordinal_head(fused)

class InterviewAnswerModelRunner:
    """Loads the supplied V5 checkpoint and applies its saved inference recipe."""

    def __init__(self, model_dir: Path, nli_model_dir: Path, device_name: str = "cpu", max_length: int = 384, model_id: str = "Final_ASAG_Interview_Scorer_V5", nli_model_id: str = "cross-encoder/nli-deberta-v3-base"):
        self.model_dir = Path(model_dir)
        self.nli_model_dir = Path(nli_model_dir)
        self.device_name = device_name
        self.max_length = max_length
        self.model_id = model_id
        self.nli_model_id = nli_model_id
        self.tokenizer = None
        self.nli_tokenizer = None
        self.model = None
        self.nli_model = None
        self.config: dict[str, Any] = {}
        self.loaded = False
        self._lock = threading.Lock()

    def load(self) -> None:
        if self.loaded:
            return
        config_path = self.model_dir / "model_config.json"
        state_path = self.model_dir / "model_state.pt"
        if not config_path.exists() or not state_path.exists():
            raise FileNotFoundError(f"V5 model files are missing from {self.model_dir}")
        if not self.nli_model_dir.exists():
            raise FileNotFoundError(f"NLI model directory does not exist: {self.nli_model_dir}")
        self.config = json.loads(config_path.read_text(encoding="utf-8"))
        requested_device = self.device_name.lower().strip()
        if requested_device.startswith("cuda") and not torch.cuda.is_available():
            requested_device = "cpu"
        self.device = torch.device(requested_device)
        base_config = AutoConfig.from_pretrained(self.model_dir, local_files_only=True)
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_dir, local_files_only=True, use_fast=True)
        self.nli_tokenizer = AutoTokenizer.from_pretrained(self.nli_model_dir, local_files_only=True, use_fast=True)
        self.nli_model = AutoModelForSequenceClassification.from_pretrained(self.nli_model_dir, local_files_only=True).to(self.device).eval()
        self.model = AdvancedASAGModel(base_config, self.config["extra_dim"], self.config["class_weights"], self.config["class_centers"])
        state = torch.load(state_path, map_location="cpu", weights_only=True)
        self.model.load_state_dict(state, strict=True)
        self.model.to(self.device).eval()
        self.loaded = True

    def predict(self, question: str, reference_answer: str, candidate_answer: str) -> dict[str, Any]:
        if not self.loaded or self.model is None or self.nli_model is None:
            raise RuntimeError("Interview answer scoring model is not loaded")
        question, reference_answer, candidate_answer = str(question or "").strip(), str(reference_answer or "").strip(), str(candidate_answer or "").strip()
        if not question:
            raise ValueError("question is required")
        if not reference_answer:
            raise ValueError("referenceAnswer is required")
        if not candidate_answer:
            raise ValueError("candidateAnswer is required")
        premise = f"Question: {question}\nReference answer: {reference_answer}"
        with self._lock, torch.no_grad():
            nli_inputs = self.nli_tokenizer(premise, candidate_answer, truncation=True, max_length=int(self.config["nli_max_length"]), return_tensors="pt")
            nli_inputs = {key: value.to(self.device) for key, value in nli_inputs.items()}
            nli_probs = torch.softmax(self.nli_model(**nli_inputs).logits[0], dim=-1).cpu().numpy().astype(np.float32)
            extra = np.concatenate([lexical_features(question, reference_answer, candidate_answer), nli_probs]).astype(np.float32)
            inputs = self.tokenizer(premise, candidate_answer, truncation=True, max_length=int(self.config.get("max_length", self.max_length)), return_tensors="pt")
            inputs = {key: value.to(self.device) for key, value in inputs.items()}
            extra_tensor = torch.tensor(extra, dtype=torch.float32, device=self.device).unsqueeze(0)
            class_logits, reg_logit, ordinal_logits = self.model(extra_features=extra_tensor, **inputs)
        raw_probs = torch.softmax(class_logits[0], dim=-1).cpu().numpy()
        reg_score = torch.sigmoid(reg_logit[0]).item()
        ordinal_score = torch.sigmoid(ordinal_logits[0]).mean().item()
        class_score = float(np.sum(raw_probs * np.asarray(self.config["class_centers"])))
        weights = self.config["blend_weights"]
        blend = weights[0] * class_score + weights[1] * reg_score + weights[2] * ordinal_score
        score = float(np.clip(float(self.config["calibration_a"]) * blend + float(self.config["calibration_b"]), 0.0, 1.0))
        if self.config["decision_mode"] == "logit_bias":
            probabilities = softmax_np(class_logits[0].cpu().numpy() + np.asarray(self.config["logit_biases"]))
            class_id = int(np.argmax(probabilities))
        elif self.config["decision_mode"] == "fused_score_thresholds":
            probabilities = raw_probs
            class_id = int(np.digitize([score], self.config["optimized_thresholds"])[0])
        else:
            probabilities = raw_probs
            class_id = int(np.argmax(probabilities))
        class_names = self.config["class_names"]
        return {"score": round(score * 100, 2), "rating": class_names[class_id], "confidence": round(float(probabilities[class_id]) * 100, 2), "probabilities": {name: round(float(probability) * 100, 2) for name, probability in zip(class_names, probabilities)}, "modelId": self.model_id}
