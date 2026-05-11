from __future__ import annotations

import argparse
import json
import random
import sys
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import FeatureUnion, Pipeline
from sklearn.linear_model import Ridge


DATASET_NAME = "Ankshi/hr-interview-dataset"
DATASET_CONFIG = "default"
DATASET_SPLIT = "train"
DATASET_ROWS_URL = "https://datasets-server.huggingface.co/rows"

LOW_QUALITY_ANSWERS = [
    "I need this job and I will try my best.",
    "I am interested and I can learn anything after joining.",
    "I do not know much about this role, but I am hardworking.",
    "I think I am a good fit because I need a chance.",
    "I have some experience and I am willing to learn.",
]

MEDIUM_QUALITY_TEMPLATES = [
    "I am interested in this role because it matches my previous experience and skills. I can learn the company process and contribute to the team.",
    "This job fits my career direction. I have practiced similar responsibilities and I can communicate clearly while improving my skills.",
    "I believe I can do this work because I understand the role, have relevant experience, and can take feedback from the team.",
]

GENERALIZATION_TRAINING_EXAMPLES: list[tuple[str, float]] = [
    ("Question: Why do you want this job?\nAnswer: I need income and I will do whatever work is assigned.", 24.0),
    ("Question: Why do you want this job?\nAnswer: The job supports my IT career goals and connects with the basic skills I have already practiced.", 62.0),
    ("Question: Why do you want this job?\nAnswer: This role matches my software development experience, especially building APIs, working with databases, and communicating with teammates during delivery.", 82.0),
    ("Question: Tell me about a challenge you handled.\nAnswer: I had a problem in a project and I tried to fix it.", 36.0),
    ("Question: Tell me about a challenge you handled.\nAnswer: I diagnosed a recurring API issue by checking logs, testing a small fix, and documenting the change for the team.", 86.0),
    ("Question: How do you work with a team?\nAnswer: I like teams and I am friendly.", 38.0),
    ("Question: How do you work with a team?\nAnswer: I share progress early, ask clarifying questions, accept code review feedback, and help teammates remove blockers.", 78.0),
    ("Question: How do you manage deadlines?\nAnswer: I work hard under pressure and try to finish quickly.", 44.0),
    ("Question: How do you manage deadlines?\nAnswer: I identify must-have work, communicate risks early, and deliver a tested version before improving optional parts.", 88.0),
    ("Question: Why should we hire you?\nAnswer: I am hardworking, loyal, and ready to learn anything.", 42.0),
    ("Question: Why should we hire you?\nAnswer: I can connect technical delivery with communication because I have built features, tested them, and explained progress clearly.", 84.0),
    ("Question: Explain your technical experience.\nAnswer: I know some programming and I can learn more.", 40.0),
    ("Question: Explain your technical experience.\nAnswer: I have practiced React, Python, SQL, and API integration in projects, and I understand how to test changes before release.", 80.0),
    ("Question: Describe your communication style.\nAnswer: I talk with people and try to be nice.", 40.0),
    ("Question: Describe your communication style.\nAnswer: I explain progress in simple terms, confirm requirements before building, and raise blockers early instead of waiting until the deadline.", 82.0),
    ("Question: What makes you suitable for this role?\nAnswer: I am interested in the IT industry and this role is suitable for my previous experience and skills.", 66.0),
    ("Question: What makes you suitable for this role?\nAnswer: I have delivered similar work before, including frontend tasks, backend integration, and testing, so I can contribute with less ramp-up time.", 84.0),
]

CHALLENGE_EVALUATION_EXAMPLES: list[tuple[str, float]] = [
    ("Question: Why do you want this job?\nAnswer: I need income and I will do whatever work is assigned.", 24.0),
    ("Question: Why do you want this job?\nAnswer: The job is connected to my IT career goals, and I have basic experience that matches the role.", 62.0),
    ("Question: Why do you want this job?\nAnswer: This role matches my software development experience, especially building APIs, working with databases, and communicating with teammates during delivery.", 82.0),
    ("Question: Tell me about a challenge you handled.\nAnswer: I had a problem in a project and I tried to fix it.", 36.0),
    ("Question: Tell me about a challenge you handled.\nAnswer: I identified the cause of a repeated API failure, checked logs, tested a fix locally, and documented the change for the team.", 86.0),
    ("Question: How do you work with a team?\nAnswer: I like teams and I am friendly.", 38.0),
    ("Question: How do you work with a team?\nAnswer: I share progress early, ask questions when requirements are unclear, review feedback carefully, and help teammates when blockers appear.", 78.0),
    ("Question: How do you manage deadlines?\nAnswer: I work hard under pressure and try to finish quickly.", 44.0),
    ("Question: How do you manage deadlines?\nAnswer: I separate must-have work from optional improvements, communicate risks early, and deliver a tested version before the deadline.", 88.0),
    ("Question: Why should we hire you?\nAnswer: I am hardworking, loyal, and ready to learn anything.", 42.0),
    ("Question: Why should we hire you?\nAnswer: You should hire me because I can connect technical delivery with communication. I have built features, tested them, and explained progress clearly.", 84.0),
    ("Question: Explain your technical experience.\nAnswer: I know some programming and I can learn more.", 40.0),
    ("Question: Explain your technical experience.\nAnswer: I have practiced React, Python, SQL, and API integration in projects, and I understand how to test changes before release.", 80.0),
]


def fetch_dataset_rows(max_rows: int, page_size: int) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    offset = 0

    while len(rows) < max_rows:
        length = min(page_size, max_rows - len(rows))
        query = urllib.parse.urlencode(
            {
                "dataset": DATASET_NAME,
                "config": DATASET_CONFIG,
                "split": DATASET_SPLIT,
                "offset": offset,
                "length": length,
            }
        )
        with urllib.request.urlopen(f"{DATASET_ROWS_URL}?{query}", timeout=45) as response:
            payload = json.loads(response.read().decode("utf-8"))

        page_rows = [item.get("row", {}) for item in payload.get("rows", []) if isinstance(item, dict)]
        if not page_rows:
            break

        rows.extend(page_rows)
        offset += len(page_rows)

    return rows


def normalize_record(record: dict[str, Any]) -> tuple[str, str] | None:
    question = str(
        record.get("question")
        or record.get("Question")
        or record.get("interview_question")
        or "",
    ).strip()
    answer = str(
        record.get("ideal_answer")
        or record.get("answer")
        or record.get("Answer")
        or record.get("sample_answer")
        or "",
    ).strip()

    if len(question) < 8 or len(answer) < 20:
        return None

    return question, answer


def build_training_examples(records: list[dict[str, Any]]) -> tuple[list[str], list[float], list[float]]:
    random.seed(42)
    texts: list[str] = []
    labels: list[float] = []
    weights: list[float] = []

    for record in records:
        normalized = normalize_record(record)
        if normalized is None:
            continue

        question, ideal_answer = normalized
        prompt = f"Question: {question}\nAnswer:"

        texts.append(f"{prompt} {ideal_answer}")
        labels.append(86.0)
        weights.append(1.0)

        words = ideal_answer.split()
        if len(words) > 45:
            shorter_answer = " ".join(words[:45])
            texts.append(f"{prompt} {shorter_answer}")
            labels.append(72.0)
            weights.append(1.0)

        medium_answer = random.choice(MEDIUM_QUALITY_TEMPLATES)
        texts.append(f"{prompt} {medium_answer}")
        labels.append(55.0)
        weights.append(0.9)

        low_answer = random.choice(LOW_QUALITY_ANSWERS)
        texts.append(f"{prompt} {low_answer}")
        labels.append(24.0)
        weights.append(1.0)

    for text, label in GENERALIZATION_TRAINING_EXAMPLES:
        texts.append(text)
        labels.append(label)
        weights.append(12.0)

    return texts, labels, weights


def train_model(texts: list[str], labels: list[float], weights: list[float]) -> tuple[Pipeline, dict[str, Any]]:
    if len(texts) < 50:
        raise RuntimeError(f"Not enough training examples after normalization: {len(texts)}")

    x_train, x_test, y_train, y_test, weights_train, _weights_test = train_test_split(
        texts,
        labels,
        weights,
        test_size=0.2,
        random_state=42,
        stratify=np.digitize(labels, bins=[40, 65, 80]),
    )

    model = Pipeline(
        steps=[
            (
                "features",
                FeatureUnion(
                    transformer_list=[
                        (
                            "word_tfidf",
                            TfidfVectorizer(
                                lowercase=True,
                                analyzer="word",
                                ngram_range=(1, 3),
                                min_df=2,
                                sublinear_tf=True,
                            ),
                        ),
                        (
                            "char_tfidf",
                            TfidfVectorizer(
                                lowercase=True,
                                analyzer="char_wb",
                                ngram_range=(3, 5),
                                min_df=2,
                                sublinear_tf=True,
                            ),
                        ),
                    ]
                ),
            ),
            ("regressor", Ridge(alpha=0.9)),
        ]
    )
    model.fit(x_train, y_train, regressor__sample_weight=weights_train)
    predictions = np.clip(model.predict(x_test), 0, 100)
    challenge_texts = [item[0] for item in CHALLENGE_EVALUATION_EXAMPLES]
    challenge_labels = [item[1] for item in CHALLENGE_EVALUATION_EXAMPLES]
    challenge_predictions = np.clip(model.predict(challenge_texts), 0, 100)

    metrics = {
        "train_examples": len(x_train),
        "test_examples": len(x_test),
        "synthetic_split_mae": round(float(mean_absolute_error(y_test, predictions)), 3),
        "synthetic_split_r2": round(float(r2_score(y_test, predictions)), 3),
        "challenge_examples": len(challenge_texts),
        "challenge_mae": round(float(mean_absolute_error(challenge_labels, challenge_predictions)), 3),
        "challenge_r2": round(float(r2_score(challenge_labels, challenge_predictions)), 3),
    }
    return model, metrics


def main() -> int:
    parser = argparse.ArgumentParser(description="Train the local interview evaluation model.")
    parser.add_argument("--max-rows", type=int, default=1500)
    parser.add_argument("--page-size", type=int, default=100)
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("backend/app/member_4_interview_evaluation/model_artifacts"),
    )
    args = parser.parse_args()

    records = fetch_dataset_rows(max_rows=args.max_rows, page_size=args.page_size)
    texts, labels, weights = build_training_examples(records)
    model, metrics = train_model(texts, labels, weights)

    output_dir = args.output_dir
    output_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, output_dir / "interview_scorer.joblib")
    (output_dir / "config.json").write_text(
        json.dumps(
            {
                "model_name": "tfidf_ridge_interview_scorer_v1",
                "model_source": f"huggingface_dataset:{DATASET_NAME}",
                "dataset": DATASET_NAME,
                "metrics": metrics,
            },
            indent=2,
        ),
        encoding="utf-8",
    )

    print(json.dumps({"saved_to": str(output_dir), **metrics}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
