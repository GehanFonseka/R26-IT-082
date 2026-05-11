from __future__ import annotations

import re
from typing import Any


DEGREE_PATTERNS: list[tuple[str, str, int]] = [
    (r"\b(ph\.?d|doctorate|doctoral)\b", "Doctorate / PhD", 5),
    (r"\b(master|msc|m\.sc|mba|mtech|m\.tech|ma\b)\b", "Master's Degree", 4),
    (r"\b(bachelor|bsc|b\.sc|bba|ba\b|beng|b\.eng|btech|b\.tech)\b", "Bachelor's Degree", 3),
    (r"\b(diploma|hnd|higher national diploma|associate degree)\b", "Diploma / Associate Degree", 2),
    (r"\b(high school|advanced level|a/l|secondary school)\b", "School Qualification", 1),
]

CERTIFICATION_PATTERNS: list[tuple[str, str, str]] = [
    (r"\baws certified solutions architect\b", "AWS Certified Solutions Architect", "cloud"),
    (r"\baws certified\b", "AWS Certified", "cloud"),
    (r"\baz-900\b|\bazure fundamentals\b", "Microsoft Azure Fundamentals", "cloud"),
    (r"\bgoogle cloud\b|\bgcp\b", "Google Cloud Certification", "cloud"),
    (r"\bcissp\b", "CISSP", "security"),
    (r"\bcomptia security\+?\b|\bsecurity\+\b", "CompTIA Security+", "security"),
    (r"\bceh\b|ethical hacker", "Certified Ethical Hacker", "security"),
    (r"\bpmp\b|project management professional", "PMP", "project_management"),
    (r"\bscrum master\b|\bcsm\b", "Certified Scrum Master", "project_management"),
    (r"\bgoogle analytics\b", "Google Analytics Certification", "analytics"),
    (r"\bpower bi\b", "Power BI Certification / Experience", "analytics"),
    (r"\btableau\b", "Tableau Certification / Experience", "analytics"),
    (r"\btensorflow\b", "TensorFlow Certification / Experience", "machine_learning"),
    (r"\bcoursera\b|\budemy\b|\bedx\b", "Online Course Certificate", "online_learning"),
]

FIELD_PATTERNS: list[tuple[str, list[str]]] = [
    ("Business / Management", ["business management", "business administration", "management", "mba", "bba"]),
    ("Computer Science / IT", ["computer science", "software", "information technology", "it ", "data", "cloud", "cybersecurity"]),
    ("Design / Product", ["product design", "ux", "user experience", "design management", "product management"]),
    ("Marketing / Sales", ["marketing", "sales", "brand", "digital marketing"]),
    ("Human Resources", ["human resource", "hr management", "talent acquisition"]),
]


def _dedupe(items: list[dict[str, Any]], key: str = "name") -> list[dict[str, Any]]:
    seen: set[str] = set()
    result: list[dict[str, Any]] = []
    for item in items:
        value = str(item.get(key, "")).strip().lower()
        if not value or value in seen:
            continue
        seen.add(value)
        result.append(item)
    return result


def _detect_credential_context(text: str, match_start: int) -> dict[str, Any]:
    window = text[max(0, match_start - 100): match_start + 160]
    year_match = re.search(r"\b(19\d{2}|20\d{2})\b", window)
    issuer_match = re.search(
        r"\b(?:from|by|issued by|at)\s+([A-Z][A-Za-z&. ]{2,60})",
        window,
    )
    return {
        "year": year_match.group(1) if year_match else None,
        "issuer_hint": issuer_match.group(1).strip() if issuer_match else None,
    }


def validate_credentials_from_cv(cv_text: str, required_skills: list[str] | None = None) -> dict[str, Any]:
    text = cv_text or ""
    lowered = text.lower()
    required_skill_text = " ".join(str(skill).lower() for skill in required_skills or [])

    degrees: list[dict[str, Any]] = []
    for pattern, label, level in DEGREE_PATTERNS:
        for match in re.finditer(pattern, lowered, flags=re.IGNORECASE):
            context = _detect_credential_context(text, match.start())
            field = "Unspecified"
            for field_name, field_terms in FIELD_PATTERNS:
                if any(term in lowered for term in field_terms):
                    field = field_name
                    break
            degrees.append(
                {
                    "name": label,
                    "level": level,
                    "field": field,
                    "year": context["year"],
                    "issuer_hint": context["issuer_hint"],
                    "evidence": text[max(0, match.start() - 45): match.end() + 80].strip(),
                }
            )

    certifications: list[dict[str, Any]] = []
    for pattern, label, category in CERTIFICATION_PATTERNS:
        for match in re.finditer(pattern, lowered, flags=re.IGNORECASE):
            context = _detect_credential_context(text, match.start())
            certifications.append(
                {
                    "name": label,
                    "category": category,
                    "year": context["year"],
                    "issuer_hint": context["issuer_hint"],
                    "evidence": text[max(0, match.start() - 45): match.end() + 80].strip(),
                }
            )

    degrees = _dedupe(degrees)
    certifications = _dedupe(certifications)

    highest_degree_level = max((item["level"] for item in degrees), default=0)
    role_alignment_hits = 0
    for degree in degrees:
        degree_text = f"{degree.get('name', '')} {degree.get('field', '')}".lower()
        if any(term and term in degree_text for term in required_skill_text.split()):
            role_alignment_hits += 1
    for cert in certifications:
        cert_text = f"{cert.get('name', '')} {cert.get('category', '')}".lower()
        if any(term and term in cert_text for term in required_skill_text.split()):
            role_alignment_hits += 1

    evidence_count = len(degrees) + len(certifications)
    score = 20.0
    score += min(highest_degree_level * 10.0, 45.0)
    score += min(len(certifications) * 8.0, 24.0)
    score += min(role_alignment_hits * 7.0, 21.0)
    if any(item.get("issuer_hint") for item in [*degrees, *certifications]):
        score += 6.0
    if any(item.get("year") for item in [*degrees, *certifications]):
        score += 5.0

    score = round(max(0.0, min(100.0, score)), 2)
    if score >= 75:
        band = "HIGH"
    elif score >= 45:
        band = "MEDIUM"
    else:
        band = "LOW"

    flags: list[str] = []
    if evidence_count == 0:
        flags.append("No degree or certification evidence detected in CV text.")
    if degrees and not any(item.get("issuer_hint") for item in degrees):
        flags.append("Degree detected, but institution/issuer was not clearly identified.")
    if certifications and not any(item.get("year") for item in certifications):
        flags.append("Certification detected, but issue year was not clearly identified.")

    return {
        "model": "credential_validation_rule_model_v1",
        "credential_trust_score_0_100": score,
        "credential_trust_band": band,
        "degrees": degrees,
        "certifications": certifications,
        "role_alignment_hits": role_alignment_hits,
        "flags": flags,
        "summary": (
            "Credential evidence is strong and relevant."
            if band == "HIGH"
            else "Credential evidence is present but should be verified by HR."
            if band == "MEDIUM"
            else "Credential evidence is weak or missing; request supporting documents."
        ),
        "verification_note": "This validates evidence in CV text only. HR should verify certificates with issuing institutions before final hiring decisions.",
    }
