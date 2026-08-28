import re
from datetime import datetime
from typing import Any


CLASS_TERMS = {
    "complexity": ["microservice", "distributed", "real-time", "machine learning", "cloud", "api gateway", "automation", "multi-tenant"],
    "engineering": ["docker", "kubernetes", "ci/cd", "testing", "aws", "azure", "deployment", "security", "jwt", "monitoring", "pipeline"],
    "scale": ["production", "enterprise", "client", "customer", "users", "large-scale", "high traffic", "commercial", "live system", "organization"],
}
HIGH_OWNERSHIP = ["lead developer", "team lead", "technical lead", "architect", "designed and developed", "led ", "owned ", "independently developed"]
MEDIUM_OWNERSHIP = ["developed", "implemented", "built", "created", "engineered", "integrated", "designed", "optimized", "maintained"]
ALIASES = {
    "javascript": ["javascript", "java script", "js"], "typescript": ["typescript", "type script", "ts"],
    "react": ["react", "reactjs", "react.js", "react js"], "node.js": ["node.js", "nodejs", "node js"],
    "express.js": ["express.js", "expressjs", "express js", "express"], "python": ["python", "python3"],
    "java": ["java"], "mongodb": ["mongodb", "mongo db"], "postgresql": ["postgresql", "postgres", "postgre sql"],
}


def text_value(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, list):
        return " | ".join(filter(None, (text_value(item) for item in value)))
    if isinstance(value, dict):
        return " | ".join(f"{key}: {text_value(item)}" for key, item in value.items() if text_value(item))
    return re.sub(r"\s+", " ", str(value)).strip()


def variants(skill: str) -> list[str]:
    name = text_value(skill).strip()
    return list(dict.fromkeys([name, *ALIASES.get(name.lower(), [])]))


def has_skill(skill: str, value: str) -> bool:
    return any(re.search(r"(?<!\w)" + re.escape(alias) + r"(?!\w)", value or "", re.I) for alias in variants(skill))


def count_skill(skill: str, value: str) -> int:
    spans = set()
    for alias in variants(skill):
        spans.update((match.start(), match.end()) for match in re.finditer(r"(?<!\w)" + re.escape(alias) + r"(?!\w)", value or "", re.I))
    return len(spans)


def duration_years(value: Any) -> float:
    text = text_value(value).lower()
    years = sum(float(item) for item in re.findall(r"(\d+(?:\.\d+)?)\s*(?:years?|yrs?)", text))
    months = sum(float(item) / 12 for item in re.findall(r"(\d+(?:\.\d+)?)\s*(?:months?|mos?)", text))
    if years + months:
        return min(years + months, 15)
    found = [int(item) for item in re.findall(r"\b(?:19|20)\d{2}\b", text)]
    if not found:
        return 0.0
    end = datetime.now().year if re.search(r"\b(present|current|ongoing)\b", text) else max(found)
    return min(max(end - min(found), 0.25), 15) if end >= min(found) else 0.0


def keyword_hits(value: str, terms: list[str]) -> int:
    lower = value.lower()
    return sum(term in lower for term in terms)


def format_model_input(item: dict[str, Any]) -> tuple[str, float]:
    skill = text_value(item.get("skill"))
    project = text_value(item.get("project"))
    experience_entries = [text_value(value) for value in item.get("experienceEntries", []) if text_value(value)]
    experience = text_value(item.get("experience")) or text_value(item.get("experienceText")) or " | ".join(experience_entries)
    projects = [text_value(value) for value in item.get("allProjects", []) if text_value(value)] or [project]
    all_skills = list(dict.fromkeys([skill, *(text_value(value) for value in item.get("allSkills", []))]))
    related_projects = [value for value in projects if has_skill(skill, value)]
    professional = int(has_skill(skill, experience))
    certification = int(has_skill(skill, text_value(item.get("certifications"))))
    years = min(sum(duration_years(value) for value in experience_entries), 10) if experience_entries else duration_years(experience)
    if not years:
        years = max(0.0, min(float(item.get("experienceYears") or 0), 15))
    project_skills = [value for value in all_skills if has_skill(value, project)]
    experience_skills = {value.lower() for value in all_skills if has_skill(value, experience)}
    project_skill_set = {value.lower() for value in project_skills}
    overlap = len(experience_skills & project_skill_set) / len(project_skill_set) if project_skill_set else 0.0
    lower_project = project.lower()
    numeric = int(bool(re.search(r"\b\d+(?:\.\d+)?\s*(?:%|ms|milliseconds|sec|seconds|users|requests|fps|accuracy|x)\b", lower_project)))
    fields = [
        "[SKILL]", skill, "", "[STRUCTURED SKILL EVIDENCE]",
        f"professional_evidence={professional}", f"certification_evidence={certification}",
        f"consistency_evidence={int(professional and bool(related_projects))}", f"estimated_skill_years={years:.2f}",
        f"experience_mentions={count_skill(skill, experience)}", f"all_project_mentions={count_skill(skill, ' | '.join(projects))}",
        f"current_project_mentions={count_skill(skill, project)}", f"related_project_count={len(related_projects)}",
        f"project_skill_count={len(project_skills)}", f"complexity_keyword_hits={keyword_hits(project, CLASS_TERMS['complexity'])}",
        f"engineering_keyword_hits={keyword_hits(project, CLASS_TERMS['engineering'])}", f"scale_keyword_hits={keyword_hits(project, CLASS_TERMS['scale'])}",
        f"ownership_high={int(any(term in lower_project for term in HIGH_OWNERSHIP))}",
        f"ownership_medium={int(any(term in lower_project for term in MEDIUM_OWNERSHIP))}", f"numeric_impact={numeric}",
        f"technical_overlap_ratio={overlap:.4f}", "", "[PROJECT]", project, "", "[PROFESSIONAL EXPERIENCE]", experience,
        "", "[CERTIFICATIONS]", text_value(item.get("certifications")),
    ]
    return "\n".join(fields), years
