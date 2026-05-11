from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Optional


@dataclass(frozen=True)
class InterviewModelBundle:
    model_name: str
    model_source: str
    tokenizer: Optional[Any] = None
    model: Optional[Any] = None
    id2label: Optional[dict[int, str]] = None


_BUNDLE: Optional[InterviewModelBundle] = None
_RUBRIC_MODEL: Optional[Any] = None

_RUBRIC_TRAINING_EXAMPLES: list[tuple[str, float]] = [
    ("I need this job. I will try my best.", 22.0),
    ("I do not know much about the role but I can learn anything if selected.", 28.0),
    ("I am hardworking and interested in this job. I have some experience and want to improve.", 40.0),
    ("This job is suitable because I am interested in IT and I have previous experience with similar work.", 58.0),
    ("My interest is in the IT industry and this role matches my previous experience and skills, so I believe I can contribute well.", 66.0),
    ("I have worked on similar projects before, and my skills match the responsibilities of this role. I can learn the company process quickly and contribute to the team.", 72.0),
    ("I built React interfaces, developed Python APIs, worked with SQL databases, and tested features before release. That experience matches this role and helps me contribute quickly.", 82.0),
    ("In my previous project, I owned a backend API from design to deployment, fixed performance issues, coordinated with frontend developers, and delivered the feature on time.", 88.0),
    ("I would first clarify the requirement, identify risks, split the work into must-have and later improvements, then communicate progress and deliver the highest-impact scope first.", 84.0),
    ("When I face a production issue, I reproduce it, check logs, isolate the cause, apply the safest fix, test the result, and document what changed for the team.", 90.0),
    ("I communicate clearly with teammates, ask for feedback early, and take ownership of quality instead of only finishing the assigned task.", 76.0),
    ("I have experience but I am not sure whether I can do all the work. Maybe I can learn after joining.", 36.0),
    ("I like technology and I think this company is good. I want a chance to grow.", 46.0),
    ("The role fits my career direction because it uses the skills I have practiced: coding, database work, communication, and solving user-facing problems.", 70.0),
    ("I led a small team project where we built a dashboard, handled API integration, reviewed each other's code, and improved usability after testing with users.", 86.0),
    ("I am a strong fit because I understand the technical responsibilities, have delivered similar work, and can explain progress clearly to both technical and non-technical people.", 84.0),
    ("I don't have experience. I need money and I can try.", 18.0),
    ("I can work under pressure and I am a fast learner.", 38.0),
    ("I handled a tight deadline by prioritizing core requirements, discussing blockers early, and delivering a stable version before adding optional improvements.", 87.0),
    ("I would contribute by writing reliable code, testing my changes, communicating blockers early, and aligning my work with the team's standards.", 80.0),
]


def _root_dir() -> Path:
    return Path(__file__).resolve().parents[2]


def _clamp(value: float, min_value: float, max_value: float) -> float:
    return max(min_value, min(max_value, value))


def _candidate_model_dirs(root_dir: Path) -> list[Path]:
    candidates = [
        Path(__file__).resolve().parent / "model_artifacts",
        root_dir / "ttrition model bundle",
        root_dir / "attrition_model_bundle",
        root_dir / "interview_model_bundle",
        root_dir / "backend" / "interview_model_bundle",
        root_dir / "component2_fast_model",
    ]

    seen: set[str] = set()
    unique_candidates: list[Path] = []
    for path in candidates:
        normalized = str(path.resolve()) if path.exists() else str(path)
        if normalized in seen:
            continue
        seen.add(normalized)
        unique_candidates.append(path)

    return unique_candidates


def _is_hf_model_dir(path: Path) -> bool:
    if not path.exists() or not path.is_dir():
        return False

    has_weights = any(
        (path / name).is_file()
        for name in ("model.safetensors", "pytorch_model.bin", "tf_model.h5", "flax_model.msgpack")
    )
    has_tokenizer = any(
        (path / name).is_file()
        for name in ("tokenizer.json", "vocab.txt", "special_tokens_map.json")
    )
    return has_weights and has_tokenizer


def _is_sklearn_model_dir(path: Path) -> bool:
    return path.exists() and path.is_dir() and (path / "interview_scorer.joblib").is_file()


def _load_sklearn_interview_model(model_dir: Path) -> Optional[InterviewModelBundle]:
    try:
        import joblib
    except Exception:
        return None

    config: dict[str, Any] = {}
    config_path = model_dir / "config.json"
    if config_path.exists():
        try:
            config = json.loads(config_path.read_text(encoding="utf-8"))
        except Exception:
            config = {}

    try:
        model = joblib.load(model_dir / "interview_scorer.joblib")
    except Exception:
        return None

    return InterviewModelBundle(
        model_name=str(config.get("model_name") or "tfidf_random_forest_interview_scorer_v1"),
        model_source=str(config.get("model_source") or f"local_sklearn_model:{model_dir.name}"),
        model=model,
    )


def _normalize_id2label(raw: Any) -> dict[int, str]:
    if not isinstance(raw, dict):
        return {}

    normalized: dict[int, str] = {}
    for key, value in raw.items():
        try:
            idx = int(key)
        except (TypeError, ValueError):
            continue
        normalized[idx] = str(value)
    return normalized


def _load_label_map(model_dir: Path, fallback_map: Any) -> dict[int, str]:
    label_map_path = model_dir / "label_mappings.json"
    if label_map_path.exists():
        try:
            with label_map_path.open("r", encoding="utf-8") as f:
                payload = json.load(f)
            id2label = payload.get("id2label", {})
            normalized = _normalize_id2label(id2label)
            if normalized:
                return normalized
        except Exception:
            pass

    normalized_fallback = _normalize_id2label(fallback_map)
    if normalized_fallback:
        return normalized_fallback

    return {0: "0", 1: "1"}


def load_interview_model_bundle(root_dir: Optional[Path] = None) -> InterviewModelBundle:
    root = (root_dir or _root_dir()).resolve()
    model_dirs = _candidate_model_dirs(root)

    sklearn_model_dir = next((path for path in model_dirs if _is_sklearn_model_dir(path)), None)
    if sklearn_model_dir is not None:
        sklearn_bundle = _load_sklearn_interview_model(sklearn_model_dir)
        if sklearn_bundle is not None:
            return sklearn_bundle

    detected_model_dir = next((path for path in model_dirs if _is_hf_model_dir(path)), None)

    if detected_model_dir is None:
        return InterviewModelBundle(
            model_name="tfidf_rubric_interview_regressor_v2",
            model_source="local_rubric_examples",
        )

    try:
        from transformers import AutoModelForSequenceClassification, AutoTokenizer
    except Exception:
        return InterviewModelBundle(
            model_name="tfidf_rubric_interview_regressor_v2",
            model_source="local_rubric_examples",
        )

    try:
        tokenizer = AutoTokenizer.from_pretrained(str(detected_model_dir))
        model = AutoModelForSequenceClassification.from_pretrained(str(detected_model_dir))
        model.eval()

        id2label = _load_label_map(detected_model_dir, getattr(model.config, "id2label", {}))
        model_name = str(getattr(model.config, "_name_or_path", detected_model_dir.name))

        return InterviewModelBundle(
            model_name=model_name,
            model_source=f"local_hf_model:{detected_model_dir.name}",
            tokenizer=tokenizer,
            model=model,
            id2label=id2label,
        )
    except Exception:
        return InterviewModelBundle(
            model_name="tfidf_rubric_interview_regressor_v2",
            model_source="local_rubric_examples",
        )


def init_interview_model_bundle(root_dir: Optional[Path] = None) -> InterviewModelBundle:
    global _BUNDLE
    _BUNDLE = load_interview_model_bundle(root_dir)
    return _BUNDLE


def get_interview_model_bundle() -> InterviewModelBundle:
    global _BUNDLE
    if _BUNDLE is None:
        _BUNDLE = load_interview_model_bundle()
    return _BUNDLE


def _words(text: str) -> list[str]:
    return re.findall(r"[A-Za-z][A-Za-z'-]{1,}", text.lower())


def _count_phrase_hits(text: str, phrases: list[str]) -> int:
    lowered = text.lower()
    return sum(lowered.count(phrase) for phrase in phrases)


def _trained_rubric_model() -> Optional[Any]:
    global _RUBRIC_MODEL
    if _RUBRIC_MODEL is not None:
        return _RUBRIC_MODEL

    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.pipeline import Pipeline
        from sklearn.linear_model import Ridge
    except Exception:
        return None

    texts = [item[0] for item in _RUBRIC_TRAINING_EXAMPLES]
    labels = [item[1] for item in _RUBRIC_TRAINING_EXAMPLES]
    model = Pipeline(
        steps=[
            (
                "tfidf",
                TfidfVectorizer(
                    lowercase=True,
                    ngram_range=(1, 2),
                    analyzer="word",
                    min_df=1,
                    sublinear_tf=True,
                ),
            ),
            ("regressor", Ridge(alpha=1.0)),
        ]
    )
    model.fit(texts, labels)
    _RUBRIC_MODEL = model
    return _RUBRIC_MODEL


def _predict_rubric_score(answer_text: str, question_text: Optional[str]) -> Optional[float]:
    model = _trained_rubric_model()
    if model is None:
        return None

    try:
        _ = question_text
        return float(model.predict([answer_text])[0])
    except Exception:
        return None


def _lexical_diversity(words: list[str]) -> float:
    if not words:
        return 0.0
    return len(set(words)) / len(words)


def _question_alignment(answer_words: list[str], question_text: Optional[str]) -> float:
    if not question_text or not question_text.strip():
        return 68.0

    stopwords = {
        "about", "after", "also", "because", "been", "being", "could", "does",
        "from", "have", "here", "into", "need", "that", "their", "them",
        "then", "there", "these", "they", "this", "what", "when", "where",
        "which", "with", "would", "your", "you", "why", "think",
    }
    question_terms = {token for token in _words(question_text) if len(token) >= 4 and token not in stopwords}
    answer_terms = {token for token in answer_words if len(token) >= 4 and token not in stopwords}
    if not question_terms:
        return 68.0

    overlap_ratio = len(question_terms.intersection(answer_terms)) / len(question_terms)
    return _clamp(35.0 + overlap_ratio * 65.0, 20.0, 100.0)


def _concreteness_score(answer_text: str, words: list[str]) -> float:
    number_bonus = 10.0 if re.search(r"\b\d+[%\w-]*\b", answer_text) else 0.0
    uppercase_tokens = len(re.findall(r"\b[A-Z][A-Za-z0-9+#.-]{1,}\b", answer_text))
    long_word_ratio = len([word for word in words if len(word) >= 7]) / max(1, len(words))
    return _clamp(35.0 + long_word_ratio * 120.0 + min(uppercase_tokens, 5) * 4.0 + number_bonus, 0.0, 100.0)


def _calibrate_interview_score(
    raw_score: float,
    *,
    word_count: int,
    alignment_score: float,
    concreteness_score: float,
    lexical_diversity: float,
    vague_hits: int,
) -> float:
    if word_count < 18:
        score = _clamp(raw_score - 18.0, 0, 34)
    elif word_count < 35:
        score = _clamp(raw_score - 8.0, 0, 58 if concreteness_score >= 58 else 46)
    elif word_count < 65:
        score = _clamp(raw_score + 2.0, 0, 76 if concreteness_score >= 55 else 62)
    else:
        score = _clamp(raw_score + 8.0, 0, 94 if concreteness_score >= 55 else 78)

    if alignment_score < 45 and concreteness_score < 60:
        score = min(score, 55.0)
    if lexical_diversity < 0.48 and word_count >= 20:
        score = min(score, 64.0)
    if vague_hits >= 2 and concreteness_score < 58:
        score = min(score, 48.0)

    return score


def _heuristic_analysis(answer_text: str, question_text: Optional[str]) -> dict[str, Any]:
    words = _words(answer_text)
    word_count = len(words)
    sentence_count = max(1, len(re.findall(r"[.!?]+", answer_text)))
    avg_sentence_length = word_count / sentence_count
    vague_hits = _count_phrase_hits(
        answer_text,
        [
            "hardworking",
            "try my best",
            "willing to learn",
            "learn anything",
            "good fit",
            "need a job",
            "interested in this job",
            "some experience",
        ],
    )

    if word_count < 20:
        length_quality = _clamp((word_count / 20) * 55, 0, 55)
    elif word_count <= 160:
        length_quality = _clamp(62.0 + (word_count - 20) * 0.35, 62, 95)
    else:
        length_quality = _clamp(95.0 - (word_count - 160) * 0.15, 55, 95)
    if word_count > 260:
        length_quality = max(55.0, 100.0 - (word_count - 260) * 0.25)

    diversity = _lexical_diversity(words)
    relevance_score = _question_alignment(words, question_text)
    concreteness = _concreteness_score(answer_text, words)
    rubric_score = _predict_rubric_score(answer_text, question_text)
    if rubric_score is None:
        rubric_score = 50.0

    clarity_score = _clamp(
        30.0 + length_quality * 0.52 + diversity * 30.0 - abs(avg_sentence_length - 18) * 0.9,
        0,
        100,
    )
    confidence_score = _clamp(
        25.0 + rubric_score * 0.55 + concreteness * 0.22 + length_quality * 0.12,
        0,
        100,
    )
    collaboration_score = _clamp(30.0 + rubric_score * 0.38 + relevance_score * 0.22 + diversity * 22.0, 0, 100)
    structure_score = _clamp(
        28.0 + rubric_score * 0.42 + concreteness * 0.26 + length_quality * 0.18,
        0,
        100,
    )

    raw_overall_score = (
        clarity_score * 0.28
        + confidence_score * 0.24
        + collaboration_score * 0.2
        + structure_score * 0.2
        + relevance_score * 0.08
    )
    overall_score = _calibrate_interview_score(
        raw_overall_score,
        word_count=word_count,
        alignment_score=relevance_score,
        concreteness_score=concreteness,
        lexical_diversity=diversity,
        vague_hits=vague_hits,
    )

    strengths: list[str] = []
    concerns: list[str] = []
    suggestions: list[str] = []

    if clarity_score >= 70:
        strengths.append("Clear and understandable communication style.")
    if confidence_score >= 70:
        strengths.append("Confident delivery with ownership language.")
    if collaboration_score >= 65:
        strengths.append("Shows collaborative and team-oriented mindset.")
    if structure_score >= 68:
        strengths.append("Answer follows a structured problem-solving flow.")

    if clarity_score < 45:
        concerns.append("Answer clarity is low or too fragmented.")
        suggestions.append("Use shorter, direct sentences and remove filler phrases.")
    if confidence_score < 45:
        concerns.append("Low confidence signals in wording.")
        suggestions.append("Use concrete ownership statements and measurable outcomes.")
    if collaboration_score < 45:
        concerns.append("Limited collaboration/teamwork evidence.")
        suggestions.append("Include examples involving teamwork and stakeholder coordination.")
    if structure_score < 45:
        concerns.append("Weak structure in explaining approach or impact.")
        suggestions.append("Answer with Situation -> Action -> Result structure.")
    if relevance_score < 45:
        concerns.append("Answer appears weakly aligned with the question.")
        suggestions.append("Reference key terms from the question and address them directly.")

    if not strengths:
        strengths.append("Response has enough content for baseline evaluation.")
    if not suggestions:
        suggestions.append("Add one quantified achievement to strengthen interview impact.")

    return {
        "word_count": word_count,
        "overall_score_0_100": round(float(overall_score), 2),
        "breakdown": {
            "communication_clarity": round(float(clarity_score), 2),
            "confidence_professionalism": round(float(confidence_score), 2),
            "collaboration_team_orientation": round(float(collaboration_score), 2),
            "problem_solving_structure": round(float(structure_score), 2),
            "relevance_to_question": round(float(relevance_score), 2),
        },
        "strengths": strengths[:4],
        "concerns": concerns[:4],
        "suggestions": suggestions[:4],
    }


def _positive_label_index(id2label: dict[int, str], num_labels: int, predicted_idx: int) -> int:
    positive_markers = {"1", "positive", "high", "good", "fluent", "strong", "acceptable"}

    for idx, label in id2label.items():
        lowered = label.lower().strip()
        if lowered in positive_markers:
            return idx
        if any(marker in lowered for marker in ("good", "fluent", "high", "strong")):
            return idx

    if num_labels == 2:
        return 1

    return predicted_idx


def _predict_with_hf_model(bundle: InterviewModelBundle, answer_text: str) -> Optional[dict[str, Any]]:
    if bundle.model is None or bundle.tokenizer is None:
        return None

    try:
        import torch
    except Exception:
        return None

    encoded = bundle.tokenizer(
        answer_text,
        truncation=True,
        max_length=256,
        return_tensors="pt",
    )

    with torch.no_grad():
        output = bundle.model(**encoded)
        logits = output.logits
        probabilities = torch.softmax(logits, dim=-1)[0].cpu().tolist()

    predicted_idx = int(max(range(len(probabilities)), key=lambda idx: probabilities[idx]))
    predicted_label = str((bundle.id2label or {}).get(predicted_idx, predicted_idx))
    confidence = float(probabilities[predicted_idx])
    positive_idx = _positive_label_index(bundle.id2label or {}, len(probabilities), predicted_idx)
    quality_probability = float(probabilities[positive_idx])

    return {
        "predicted_label": predicted_label,
        "confidence": confidence,
        "quality_probability": quality_probability,
    }


def _predict_with_sklearn_model(
    bundle: InterviewModelBundle,
    answer_text: str,
    question_text: Optional[str],
) -> Optional[dict[str, Any]]:
    if bundle.model is None or bundle.tokenizer is not None:
        return None
    if not hasattr(bundle.model, "predict"):
        return None

    text = answer_text
    if question_text and question_text.strip():
        text = f"Question: {question_text.strip()}\nAnswer: {answer_text}"

    try:
        score = float(bundle.model.predict([text])[0])
    except Exception:
        return None

    score = _clamp(score, 0.0, 100.0)
    return {
        "predicted_label": "1" if score >= 55 else "0",
        "confidence": _clamp(0.55 + abs(score - 50.0) / 100.0, 0.55, 0.95),
        "quality_probability": score / 100.0,
    }


def evaluate_interview_answer(answer_text: str, question_text: Optional[str] = None) -> dict[str, Any]:
    text = (answer_text or "").strip()
    if not text:
        raise ValueError("answer_text is required and cannot be empty")

    bundle = get_interview_model_bundle()
    heuristic = _heuristic_analysis(text, question_text)
    model_prediction = _predict_with_sklearn_model(bundle, text, question_text) or _predict_with_hf_model(bundle, text)

    if model_prediction is not None:
        model_score = round(model_prediction["quality_probability"] * 100, 2)
        heuristic_score = float(heuristic["overall_score_0_100"])
        if model_score >= heuristic_score:
            overall_score = round(model_score * 0.7 + heuristic_score * 0.3, 2)
        else:
            blended_score = model_score * 0.35 + heuristic_score * 0.65
            overall_score = round(max(blended_score, heuristic_score - 3.0), 2)
        confidence = round(max(model_prediction["confidence"] * 100, max(55.0, abs(overall_score - 50.0) * 1.9)), 2)
        predicted_label = "1" if overall_score >= 60 else str(model_prediction["predicted_label"])
    else:
        overall_score = heuristic["overall_score_0_100"]
        confidence = round(max(55.0, abs(overall_score - 50.0) * 1.9), 2)
    predicted_label = "1" if overall_score >= 55 else "0"

    hire_score = round(overall_score / 10.0, 1)
    band = "HIGH" if overall_score >= 65 else "MEDIUM" if overall_score >= 40 else "LOW"

    if band == "HIGH":
        summary = "Strong interview answer quality. Candidate communication is hire-ready."
    elif band == "MEDIUM":
        summary = "Moderate interview answer quality. Probe deeper with follow-up questions."
    else:
        summary = "Low interview answer quality. Candidate needs stronger communication examples."

    return {
        "model": bundle.model_name,
        "model_source": bundle.model_source,
        "overall_score_0_100": round(overall_score, 2),
        "hire_recommendation_score_0_10": hire_score,
        "band": band,
        "predicted_label": str(predicted_label),
        "confidence": confidence,
        "answer_word_count": heuristic["word_count"],
        "summary": summary,
        "soft_skill_breakdown": heuristic["breakdown"],
        "strengths": heuristic["strengths"],
        "concerns": heuristic["concerns"],
        "suggestions": heuristic["suggestions"],
    }
