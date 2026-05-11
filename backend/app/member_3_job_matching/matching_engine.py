from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


STOPWORDS = {
    "and",
    "the",
    "for",
    "with",
    "that",
    "this",
    "from",
    "have",
    "has",
    "will",
    "your",
    "our",
    "are",
    "was",
    "were",
    "about",
    "into",
    "across",
    "within",
    "using",
    "use",
    "you",
    "their",
    "they",
    "them",
    "candidate",
    "candidates",
    "role",
    "job",
}

SKILL_PATTERNS = {
    "python": ["python", "django", "flask", "fastapi", "pandas", "numpy"],
    "java": ["java", "spring", "spring boot", "jvm"],
    "javascript": ["javascript", "js", "node", "nodejs", "node.js", "typescript", "ts"],
    "react": ["react", "redux", "next.js", "nextjs", "frontend", "front end", "ui component"],
    "sql": ["sql", "postgres", "postgresql", "mysql", "database", "relational"],
    "aws": ["aws", "ec2", "s3", "lambda", "cloudwatch"],
    "docker": ["docker", "container", "containers", "containerization"],
    "kubernetes": ["kubernetes", "k8s", "helm"],
    "machine_learning": ["machine learning", "ml", "scikit", "xgboost", "tensorflow", "pytorch", "model training"],
    "data_analysis": ["data analysis", "pandas", "numpy", "analytics", "dashboard", "dashboards", "power bi", "tableau", "bi"],
    "nlp": ["nlp", "natural language processing", "text classification", "language model"],
    "communication": ["communication", "stakeholder", "presentation", "documentation", "collaboration"],
    "leadership": ["leadership", "lead", "led", "mentoring", "mentor", "ownership"],
    "product": ["product", "roadmap", "prioritization", "user feedback"],
    "project_management": ["project management", "scrum", "agile", "kanban", "sprint"],
    "product_design": ["product design", "design manager", "product designer", "ux", "user experience", "design leadership"],
    "business_management": ["business management", "business", "management", "manager"],
    "product_strategy": ["product strategy", "product", "roadmap", "customer needs"],
    "user_research": ["user research", "customer research", "customer needs", "user needs"],
    "testing": ["testing", "qa", "quality assurance", "selenium", "automation testing", "api testing", "regression"],
    "security": ["security", "cybersecurity", "siem", "incident response", "network security"],
}

SEMANTIC_ALIASES = {
    "backend": ["api", "rest", "endpoint", "endpoints", "server", "server-side", "service", "services", "microservice", "database"],
    "frontend": ["ui", "user interface", "responsive", "browser", "react", "component"],
    "data": ["analytics", "dashboard", "reporting", "bi", "sql", "insight"],
    "cloud": ["aws", "infrastructure", "deployment", "linux", "terraform"],
    "devops": ["ci/cd", "pipeline", "deployment", "docker", "kubernetes", "monitoring"],
    "qa": ["testing", "automation", "selenium", "regression", "quality"],
    "machine": ["ml", "model", "training", "prediction", "tensorflow", "pytorch"],
    "product": ["product design", "product strategy", "roadmap", "customer needs", "user research", "business"],
    "design": ["product design", "ux", "user experience", "design manager", "design leadership"],
    "management": ["manager", "leadership", "business management", "priorities", "stakeholder"],
}

EXPERIENCE_RE = re.compile(r"(\d{1,2}(?:\.\d)?)\s*\+?\s*(?:years?|yrs?)", re.IGNORECASE)


@dataclass
class TargetDocument:
    target_id: str
    target_title: str
    text: str


def _clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def _tokenize(text: str) -> set[str]:
    tokens = re.findall(r"[A-Za-z][A-Za-z0-9+#.-]{2,}", text.lower())
    return {
        token
        for token in tokens
        if token not in STOPWORDS and not token.isdigit()
    }


def _expand_text(text: str) -> str:
    lowered = text.lower()
    additions: list[str] = []

    for canonical, aliases in SEMANTIC_ALIASES.items():
        if canonical in lowered or any(alias in lowered for alias in aliases):
            additions.extend([canonical, *aliases])

    for skill, patterns in SKILL_PATTERNS.items():
        if any(pattern in lowered for pattern in patterns):
            additions.extend([skill, *patterns])

    if not additions:
        return text

    return f"{text}\n{' '.join(additions)}"


def _extract_skills(text: str) -> set[str]:
    lowered = text.lower()
    found: set[str] = set()

    for skill, patterns in SKILL_PATTERNS.items():
        if any(pattern in lowered for pattern in patterns):
            found.add(skill)

    return found


def _extract_experience_years(text: str) -> float | None:
    values = []
    for match in EXPERIENCE_RE.findall(text):
        try:
            years = float(match)
        except ValueError:
            continue

        if 0 <= years <= 45:
            values.append(years)

    if not values:
        return None

    return float(max(values))


def _experience_alignment(source_years: float | None, target_years: float | None) -> float:
    if source_years is None and target_years is None:
        return 0.5
    if source_years is None and target_years is not None:
        return 0.15
    if source_years is not None and target_years is None:
        return 0.5

    assert source_years is not None and target_years is not None

    if target_years <= 0:
        return 0.5

    ratio = source_years / max(target_years, 1.0)
    if ratio >= 1:
        return _clamp(0.8 + min((ratio - 1) * 0.05, 0.2))

    return _clamp(ratio)


def _title_alignment(source_tokens: set[str], target_title: str) -> float:
    title_tokens = _tokenize(_expand_text(target_title))
    if not title_tokens:
        return 0.5
    return len(source_tokens.intersection(title_tokens)) / max(len(title_tokens), 1)


def _band_from_score(score_0_100: float) -> str:
    if score_0_100 >= 75:
        return "HIGH"
    if score_0_100 >= 50:
        return "MEDIUM"
    return "LOW"


def _best_terms(
    source_vector: np.ndarray,
    target_vector: np.ndarray,
    features: list[str],
    limit: int = 6,
) -> tuple[list[str], list[str]]:
    overlap_strength = source_vector * target_vector
    overlap_indices = np.where(overlap_strength > 0)[0]
    overlap_sorted = sorted(overlap_indices, key=lambda idx: overlap_strength[idx], reverse=True)
    matched = [features[idx] for idx in overlap_sorted[:limit]]

    missing_strength = np.maximum(target_vector - source_vector, 0.0)
    missing_indices = np.where(missing_strength > 0)[0]
    missing_sorted = sorted(missing_indices, key=lambda idx: missing_strength[idx], reverse=True)
    missing = [features[idx] for idx in missing_sorted[:limit]]

    return matched, missing


def recommend_matches(
    *,
    mode: str,
    source_text: str,
    targets: list[TargetDocument],
    top_k: int = 5,
) -> dict[str, Any]:
    cleaned_source = (source_text or "").strip()
    if not cleaned_source:
        raise ValueError("source_text cannot be empty")

    if not targets:
        raise ValueError("targets cannot be empty")

    cleaned_targets = [target for target in targets if (target.text or "").strip()]
    if not cleaned_targets:
        raise ValueError("All targets are empty")

    expanded_source = _expand_text(cleaned_source)
    expanded_targets = [
        TargetDocument(
            target_id=target.target_id,
            target_title=target.target_title,
            text=_expand_text(target.text),
        )
        for target in cleaned_targets
    ]

    corpus = [expanded_source, *[target.text for target in expanded_targets]]
    vectorizer = TfidfVectorizer(
        lowercase=True,
        stop_words="english",
        ngram_range=(1, 2),
        min_df=1,
    )
    matrix = vectorizer.fit_transform(corpus)
    source_matrix = matrix[0]
    target_matrix = matrix[1:]
    cosine_scores = cosine_similarity(source_matrix, target_matrix)[0]

    source_tokens = _tokenize(expanded_source)
    source_skills = _extract_skills(expanded_source)
    source_years = _extract_experience_years(cleaned_source)

    feature_names = vectorizer.get_feature_names_out().tolist()
    source_dense = source_matrix.toarray()[0]

    recommendations: list[dict[str, Any]] = []
    for index, target in enumerate(cleaned_targets):
        target_text = expanded_targets[index].text
        target_tokens = _tokenize(target_text)
        target_skills = _extract_skills(target_text)
        target_years = _extract_experience_years(target.text)
        title_alignment = _title_alignment(source_tokens, target.target_title)

        semantic_similarity = _clamp(float(cosine_scores[index]))
        keyword_overlap = (
            len(source_tokens.intersection(target_tokens)) / max(len(target_tokens), 1)
        )
        skill_overlap = (
            len(source_skills.intersection(target_skills)) / max(len(target_skills), 1)
            if target_skills
            else 0.5
        )
        experience_alignment = _experience_alignment(source_years, target_years)

        weighted_score = (
            semantic_similarity * 0.35
            + keyword_overlap * 0.2
            + skill_overlap * 0.25
            + title_alignment * 0.15
            + experience_alignment * 0.05
        )
        if skill_overlap >= 0.3 and title_alignment >= 0.4:
            weighted_score = max(weighted_score, 0.58)
        score_0_100 = round(weighted_score * 100, 2)

        target_dense = target_matrix[index].toarray()[0]
        matched_keywords, missing_keywords = _best_terms(
            source_vector=source_dense,
            target_vector=target_dense,
            features=feature_names,
        )

        if matched_keywords:
            lead_signal = ", ".join(matched_keywords[:3])
            explanation = f"Strong alignment on {lead_signal}."
        else:
            explanation = "Low direct keyword alignment."

        if missing_keywords:
            explanation += f" Missing emphasis on {', '.join(missing_keywords[:3])}."

        recommendations.append(
            {
                "target_id": target.target_id,
                "target_title": target.target_title,
                "score_0_100": score_0_100,
                "match_band": _band_from_score(score_0_100),
                "explanation": explanation,
                "matched_keywords": matched_keywords,
                "missing_keywords": missing_keywords,
                "breakdown": {
                    "semantic_similarity": round(semantic_similarity * 100, 2),
                    "keyword_overlap": round(keyword_overlap * 100, 2),
                    "skill_overlap": round(skill_overlap * 100, 2),
                    "title_alignment": round(title_alignment * 100, 2),
                    "experience_alignment": round(experience_alignment * 100, 2),
                },
            }
        )

    recommendations.sort(key=lambda item: item["score_0_100"], reverse=True)
    selected = recommendations[: max(1, top_k)]

    for rank, item in enumerate(selected, start=1):
        item["rank"] = rank

    best = selected[0]
    if mode == "cv_to_jobs":
        summary = (
            f"Best matching role is '{best['target_title']}' "
            f"with score {best['score_0_100']}."
        )
    else:
        summary = (
            f"Best matching candidate is '{best['target_title']}' "
            f"with score {best['score_0_100']}."
        )

    return {
        "mode": mode,
        "source_text_char_count": len(cleaned_source),
        "recommendations": selected,
        "summary": summary,
    }
