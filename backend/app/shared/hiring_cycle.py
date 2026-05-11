from __future__ import annotations

import re
from pathlib import Path
from typing import Any, Callable, Literal, Optional, Union
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field

from .ats_store import (
    ROLE_ADMIN,
    ROLE_CANDIDATE,
    ROLE_RECRUITER,
    get_ats_store,
)
from .cv_cache import get_cached_cv
from .hiring_cycle_schemas import (
    AdminAiModulesResponse,
    AdminReportResponse,
    AiModuleStatusItem,
    ApplicationResponse,
    ApplicationStatusUpdateRequest,
    AuthResponse,
    CompanyCreateRequest,
    CompanyResponse,
    FinalDecisionRequest,
    GenericMessageResponse,
    InterviewResponse,
    InterviewScheduleRequest,
    InterviewSubmitRequest,
    LoginRequest,
    RecruiterCandidateCompareResponse,
    RecruiterCandidateCompareRow,
    RecruiterDashboardResponse,
    RecruiterManualRecheckRequest,
    RecruiterManualRecheckResponse,
    RegisterRequest,
    UserAccessUpdateRequest,
    UserSummary,
    VacancyCreateRequest,
    VacancyResponse,
    VacancyUpdateRequest,
)
from .model_loader import get_model_bundle
from .utils import (
    MAX_UPLOAD_SIZE_BYTES,
    clean_filename,
    is_allowed_upload,
    merge_candidate_meta_overrides,
    parse_candidate_meta,
    safe_remove_file,
    uploads_dir,
)
from ..member_1_attrition_risk.predictor import build_prepared_features, predict_attrition
from ..member_4_interview_evaluation.interview_scorer import evaluate_interview_answer, get_interview_model_bundle
from ..member_3_job_matching.matching_engine import TargetDocument, recommend_matches
from ..member_2_resume_parser.credential_validator import validate_credentials_from_cv
from ..member_2_resume_parser.cv_parser import extract_features_from_cv_text, extract_text_from_file
from ..member_2_resume_parser.resume_explainer_model import analyze_resume_with_trained_model

router = APIRouter(prefix="/api/v1", tags=["Hiring Cycle"])
security = HTTPBearer(auto_error=False)

DEFAULT_SKILLS = {
    "python",
    "java",
    "javascript",
    "react",
    "sql",
    "mysql",
    "postgresql",
    "fastapi",
    "spring",
    "node",
    "docker",
    "kubernetes",
    "aws",
    "nlp",
    "machine",
    "learning",
    "communication",
    "leadership",
}


class PublicJobCreateRequest(BaseModel):
    job_name: str = Field(min_length=1)
    required_skills: Union[str, list[str]] = Field(min_length=1)
    experience_level: str = "Not specified"
    responsibilities: str = ""
    work_type: Literal["remote", "onsite", "hybrid"] = "onsite"
    location: str = ""
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    image_url: str = ""


def _normalize_skills_list(required_skills: Union[str, list[str]]) -> list[str]:
    if isinstance(required_skills, str):
        raw = required_skills.split(",")
    else:
        raw = required_skills

    normalized: list[str] = []
    seen: set[str] = set()
    for item in raw:
        text = str(item).strip()
        lowered = text.lower()
        if text and lowered not in seen:
            normalized.append(text)
            seen.add(lowered)

    return normalized


def _parse_requested_models(raw: Optional[str]) -> set[str]:
    allowed = {"resume", "credentials", "matching", "risk"}
    if raw is None:
        return {"resume", "credentials", "matching", "risk"}

    parts = [item.strip().lower() for item in str(raw).split(",")]
    selected = {item for item in parts if item}
    cleaned = {item for item in selected if item in allowed}
    if not cleaned:
        raise ValueError("requested_models must include at least one of: resume, credentials, matching, risk")
    return cleaned


def _resolve_manual_recheck_models(raw_models: list[str]) -> list[str]:
    allowed = ["resume", "credentials", "matching", "interview", "risk"]
    if not raw_models:
        return allowed

    selected: list[str] = []
    for item in raw_models:
        value = str(item).strip().lower()
        if value in allowed and value not in selected:
            selected.append(value)

    if not selected:
        raise ValueError("requested_models must include one or more of: resume, credentials, matching, interview, risk")

    return selected


def _friendly_error(status_code: int, error: str, details: Optional[str] = None) -> HTTPException:
    return HTTPException(status_code=status_code, detail={"error": error, "details": details})


def _get_token_from_credentials(credentials: Optional[HTTPAuthorizationCredentials]) -> Optional[str]:
    if not credentials:
        return None
    if credentials.scheme.lower() != "bearer":
        return None
    return credentials.credentials


def _current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict[str, Any]:
    token = _get_token_from_credentials(credentials)
    if not token:
        raise _friendly_error(401, "Authentication required")

    user = get_ats_store().get_user_by_token(token)
    if not user:
        raise _friendly_error(401, "Invalid or expired token")

    return user


def _role_guard(*allowed_roles: str) -> Callable[[dict[str, Any]], dict[str, Any]]:
    def _dependency(user: dict[str, Any] = Depends(_current_user)) -> dict[str, Any]:
        if user.get("role") not in allowed_roles:
            raise _friendly_error(403, "Permission denied")
        return user

    return _dependency


def _build_vacancy_text(vacancy: dict[str, Any]) -> str:
    skills = ", ".join(vacancy.get("required_skills") or [])
    parts = [
        vacancy.get("title") or "",
        vacancy.get("department") or "",
        vacancy.get("experience_level") or "",
        vacancy.get("responsibilities") or "",
        skills,
        vacancy.get("location") or "",
        vacancy.get("work_type") or "",
    ]
    return "\n".join(part for part in parts if str(part).strip())


def _extract_basic_skills(text: str, vacancy_skills: Optional[list[str]] = None) -> list[str]:
    lowered = text.lower()
    tokens = set(re.findall(r"[a-z][a-z0-9+#.-]{2,}", lowered))
    seed = set(DEFAULT_SKILLS)

    for raw in vacancy_skills or []:
        for token in re.findall(r"[a-z][a-z0-9+#.-]{1,}", str(raw).lower()):
            seed.add(token)

    found = []
    for skill in sorted(seed):
        if skill in tokens or f" {skill} " in f" {lowered} ":
            found.append(skill)

    return found[:30]


async def _extract_cv_text_from_input(
    cv_file: Optional[UploadFile],
    cv_cache_id: Optional[str],
) -> tuple[str, str, str]:
    if cv_file is None and not cv_cache_id:
        raise ValueError("Provide either cv_file or cv_cache_id")

    if cv_file is not None:
        file_name = clean_filename(cv_file.filename or "cv_upload")
        if not is_allowed_upload(cv_file.content_type, file_name):
            raise ValueError("Unsupported file type. Allowed: PDF, DOCX, TXT")

        content = await cv_file.read()
        if not content:
            raise ValueError("Uploaded file is empty")

        if len(content) > MAX_UPLOAD_SIZE_BYTES:
            raise ValueError("Uploaded file exceeds 10MB limit")

        source_label = "upload"
    else:
        cache_key = str(cv_cache_id or "").strip()
        try:
            cached = get_cached_cv(cache_key)
        except KeyError as exc:
            raise ValueError("cv_cache_id not found or expired") from exc

        file_name = clean_filename(cached.filename or "cv_cached")
        if not is_allowed_upload(cached.content_type, file_name):
            raise ValueError("Unsupported cached file type. Allowed: PDF, DOCX, TXT")

        content = cached.content
        if len(content) > MAX_UPLOAD_SIZE_BYTES:
            raise ValueError("Cached CV exceeds 10MB limit")

        source_label = f"cache:{cache_key[:8]}"

    temp_path = uploads_dir() / f"{uuid4().hex}{Path(file_name).suffix.lower()}"
    try:
        temp_path.write_bytes(content)
        text = extract_text_from_file(temp_path)
        return text, file_name, source_label
    finally:
        safe_remove_file(temp_path)


def _compute_application_scores(
    *,
    cv_text: str,
    vacancy: dict[str, Any],
    candidate_meta: dict[str, Any],
) -> dict[str, Any]:
    vacancy_text = _build_vacancy_text(vacancy)
    matching_result = recommend_matches(
        mode="cv_to_jobs",
        source_text=cv_text,
        targets=[
            TargetDocument(
                target_id=vacancy.get("vacancy_id", "V1"),
                target_title=vacancy.get("title", "Vacancy"),
                text=vacancy_text,
            )
        ],
        top_k=1,
    )
    best_match = (matching_result.get("recommendations") or [{}])[0]
    credential_result = validate_credentials_from_cv(
        cv_text,
        vacancy.get("required_skills") or [],
    )

    bundle = get_model_bundle()
    extracted_features, inferred_fields, assumptions = extract_features_from_cv_text(cv_text)
    feature_payload = dict(extracted_features)
    overridden = merge_candidate_meta_overrides(feature_payload, candidate_meta, bundle.expected_columns)

    if overridden:
        assumptions.append("candidate_meta values were used to override inferred CV fields")

    prepared = build_prepared_features(
        raw_values=feature_payload,
        bundle=bundle,
        inferred_fields=inferred_fields + overridden,
        base_assumptions=assumptions,
    )
    risk_result = predict_attrition(bundle, prepared)

    match_score = float(best_match.get("score_0_100", 0.0) or 0.0)
    retention_score = float(risk_result.get("retention_probability", 0.0) or 0.0) * 100
    fit_score = round(match_score * 0.65 + retention_score * 0.35, 2)
    recommendation, recommendation_reason = _recommendation_for_hiring(
        fit_score=fit_score,
        final_score=fit_score,
        interview_score=0.0,
        risk_band=str(risk_result.get("risk_band", "")),
    )

    return {
        "matching": best_match,
        "matching_summary": matching_result.get("summary"),
        "credentials": credential_result,
        "risk": risk_result,
        "fit_score_0_100": fit_score,
        "fit_band": "HIGH" if fit_score >= 75 else "MEDIUM" if fit_score >= 50 else "LOW",
        "ai_recommendation": recommendation,
        "ai_recommendation_reason": recommendation_reason,
        "inference_trace": {
            "inferred_fields": prepared.inferred_fields,
            "defaulted_fields": prepared.defaulted_fields,
            "missing_fields": prepared.missing_fields,
            "assumptions_used": prepared.assumptions_used,
        },
    }


def _application_final_score(application: dict[str, Any]) -> float:
    ai = application.get("ai_scores") or {}
    match_score = float((ai.get("matching") or {}).get("score_0_100", 0.0) or 0.0)
    interview_score = float((ai.get("interview") or {}).get("overall_score_0_100", 0.0) or 0.0)
    retention_score = float((ai.get("risk") or {}).get("retention_probability", 0.0) or 0.0) * 100

    final_score = match_score * 0.45 + interview_score * 0.35 + retention_score * 0.20
    return round(final_score, 2)


def _recommendation_for_hiring(
    *,
    fit_score: float,
    final_score: float,
    interview_score: float,
    risk_band: str,
) -> tuple[str, str]:
    normalized_risk_band = str(risk_band or "").upper()

    if final_score >= 80 and normalized_risk_band != "HIGH":
        return (
            "Strong Hire",
            "High combined final score with acceptable attrition risk profile.",
        )

    if fit_score >= 75 and interview_score >= 60 and normalized_risk_band != "HIGH":
        return (
            "Proceed To Offer Review",
            "Good fit and interview quality; finalize with compensation and references.",
        )

    if normalized_risk_band == "HIGH":
        return (
            "Talent Pool / Re-evaluate",
            "Candidate fit may be good, but attrition risk is high. Consider backup shortlist.",
        )

    if final_score >= 60:
        return (
            "Final Panel Review",
            "Borderline profile. Collect additional interview signals before final decision.",
        )

    return (
        "Not Recommended",
        "Combined fit, interview, and retention indicators are currently below threshold.",
    )


def _resume_profile_from_text(cv_text: str, vacancy_skills: list[str]) -> dict[str, Any]:
    lines = [line.strip() for line in cv_text.splitlines() if line.strip()]
    top_line = lines[0] if lines else "Unknown Candidate"

    email_match = re.search(r"[\w.-]+@[\w.-]+\.[A-Za-z]{2,}", cv_text)
    phone_match = re.search(r"\+?[\d\s()-]{8,}", cv_text)
    skills = _extract_basic_skills(cv_text)

    extracted_features, inferred_fields, assumptions_used = extract_features_from_cv_text(cv_text)
    lowered = cv_text.lower()
    words = re.findall(r"[A-Za-z][A-Za-z0-9+#.-]{1,}", lowered)
    section_patterns = {
        "experience": r"\b(experience|employment|work history|projects)\b",
        "education": r"\b(education|degree|university|college|school)\b",
        "skills": r"\b(skills|technical skills|tools|technologies)\b",
        "certifications": r"\b(certifications?|licenses?|courses?)\b",
    }
    section_signals = {
        key: len(re.findall(pattern, lowered, flags=re.IGNORECASE))
        for key, pattern in section_patterns.items()
    }
    detected_section_count = sum(1 for value in section_signals.values() if value > 0)
    skill_evidence = []
    for skill in skills[:12]:
        match = re.search(re.escape(skill), cv_text, flags=re.IGNORECASE)
        if not match:
            continue
        start = max(0, match.start() - 55)
        end = min(len(cv_text), match.end() + 75)
        skill_evidence.append(
            {
                "skill": skill,
                "evidence": cv_text[start:end].replace("\n", " ").strip(),
            }
        )

    completeness_items = {
        "name": bool(top_line and top_line != "Unknown Candidate"),
        "email": bool(email_match),
        "phone": bool(phone_match),
        "skills": bool(skills),
        "experience_signal": section_signals["experience"] > 0 or "TotalWorkingYears" in extracted_features,
        "education_signal": section_signals["education"] > 0 or "Education" in extracted_features,
    }
    completeness_score = round(
        sum(1 for value in completeness_items.values() if value) / max(len(completeness_items), 1) * 100,
        2,
    )
    required_skill_matches = []
    for skill in skills:
        skill_lower = skill.lower()
        if any(skill_lower in str(required).lower() or str(required).lower() in skill_lower for required in vacancy_skills):
            required_skill_matches.append(skill)
    required_skill_coverage = round(
        len(required_skill_matches) / max(len(vacancy_skills), 1) * 100,
        2,
    ) if vacancy_skills else None
    trained_model_analysis = analyze_resume_with_trained_model(cv_text)

    return {
        "candidate_name": top_line,
        "email": email_match.group(0) if email_match else "Not detected",
        "phone": phone_match.group(0).strip() if phone_match else "Not detected",
        "skills_detected": skills,
        "explainable_ai": {
            "extraction_stats": {
                "text_char_count": len(cv_text),
                "word_count": len(words),
                "line_count": len(lines),
                "skill_count": len(skills),
                "inferred_field_count": len(inferred_fields),
                "detected_section_count": detected_section_count,
                "skill_density_per_100_words": round(len(skills) / max(len(words), 1) * 100, 2),
                "required_skill_coverage_0_100": required_skill_coverage,
                "contact_signal_count": int(bool(email_match)) + int(bool(phone_match)),
                "assumption_count": len(assumptions_used),
                "completeness_score_0_100": completeness_score,
            },
            "completeness": completeness_items,
            "section_signals": section_signals,
            "skill_evidence": skill_evidence,
            "matched_required_skills": required_skill_matches,
            "trained_model": trained_model_analysis,
            "explanation": (
                "Resume parser detected profile fields with regex, section signals, skill dictionary matches, "
                "HR feature inference rules, and a trained TF-IDF logistic explainer model."
            ),
        },
        "feature_inference": {
            "inferred_fields": inferred_fields,
            "assumptions_used": assumptions_used,
            "raw_features": extracted_features,
        },
    }


@router.post("/auth/register", response_model=UserSummary)
async def register_user(
    payload: RegisterRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict[str, Any]:
    requester = None
    token = _get_token_from_credentials(credentials)
    if token:
        requester = get_ats_store().get_user_by_token(token)

    if payload.role != ROLE_CANDIDATE:
        if not requester or requester.get("role") != ROLE_ADMIN:
            raise _friendly_error(403, "Only admin can create recruiter/admin accounts")
        actor_user_id = requester.get("user_id", "unknown")
    else:
        actor_user_id = requester.get("user_id", "self-register") if requester else "self-register"

    try:
        return get_ats_store().register_user(
            name=payload.name,
            email=payload.email,
            password=payload.password,
            role=payload.role,
            company_id=payload.company_id,
            created_by=actor_user_id,
        )
    except ValueError as exc:
        raise _friendly_error(400, str(exc)) from exc


@router.post("/auth/login", response_model=AuthResponse)
async def login(payload: LoginRequest) -> dict[str, Any]:
    try:
        return get_ats_store().authenticate(email=payload.email, password=payload.password)
    except ValueError as exc:
        raise _friendly_error(401, str(exc)) from exc


@router.get("/auth/me", response_model=UserSummary)
async def current_user_me(user: dict[str, Any] = Depends(_current_user)) -> dict[str, Any]:
    return user


@router.post("/admin/companies", response_model=CompanyResponse)
async def create_company(
    payload: CompanyCreateRequest,
    user: dict[str, Any] = Depends(_role_guard(ROLE_ADMIN)),
) -> dict[str, Any]:
    return get_ats_store().create_company(
        name=payload.name,
        industry=payload.industry,
        location=payload.location,
        actor_user_id=user["user_id"],
    )


@router.get("/admin/companies", response_model=list[CompanyResponse])
async def list_companies(
    _user: dict[str, Any] = Depends(_role_guard(ROLE_ADMIN)),
) -> list[dict[str, Any]]:
    return get_ats_store().list_companies()


@router.get("/admin/users", response_model=list[UserSummary])
async def list_users(
    _user: dict[str, Any] = Depends(_role_guard(ROLE_ADMIN)),
) -> list[dict[str, Any]]:
    return get_ats_store().list_users()


@router.get("/admin/reports", response_model=AdminReportResponse)
async def admin_reports(
    _user: dict[str, Any] = Depends(_role_guard(ROLE_ADMIN)),
) -> dict[str, Any]:
    return get_ats_store().admin_report()


@router.patch("/admin/users/{user_id}/access", response_model=UserSummary)
async def update_user_access(
    user_id: str,
    payload: UserAccessUpdateRequest,
    user: dict[str, Any] = Depends(_role_guard(ROLE_ADMIN)),
) -> dict[str, Any]:
    try:
        return get_ats_store().set_user_active(
            user_id=user_id,
            active=payload.active,
            actor_user_id=user["user_id"],
            reason=payload.reason,
        )
    except ValueError as exc:
        raise _friendly_error(400, str(exc)) from exc


@router.get("/admin/ai-modules", response_model=AdminAiModulesResponse)
async def admin_ai_modules(
    _user: dict[str, Any] = Depends(_role_guard(ROLE_ADMIN)),
) -> dict[str, Any]:
    usage_payload = get_ats_store().admin_ai_module_stats()
    usage_counts = usage_payload.get("usage_counts", {})

    attrition_bundle = get_model_bundle()
    interview_bundle = get_interview_model_bundle()

    modules: list[AiModuleStatusItem] = [
        AiModuleStatusItem(
            module_key="resume_parsing",
            module_name="AI Resume Parsing",
            status="healthy",
            model_name="heuristic_resume_feature_parser_v1",
            model_source="built_in_heuristics",
            usage_count=int(usage_counts.get("resume_parsing", 0) or 0),
            notes="Extracts candidate profile fields and skills from uploaded CVs.",
        ),
        AiModuleStatusItem(
            module_key="job_matching",
            module_name="Job Matching & Ranking",
            status="healthy",
            model_name="explainable_similarity_ranker_v1",
            model_source="semantic_keyword_hybrid",
            usage_count=int(usage_counts.get("job_matching", 0) or 0),
            notes="Generates match score and explainable keyword overlaps.",
        ),
        AiModuleStatusItem(
            module_key="risk_prediction",
            module_name="Attrition Risk Prediction",
            status="healthy",
            model_name=attrition_bundle.model_name,
            model_source="xgboost_bundle",
            usage_count=int(usage_counts.get("risk_prediction", 0) or 0),
            notes="Predicts retention probability and attrition risk band.",
        ),
        AiModuleStatusItem(
            module_key="interview_evaluation",
            module_name="AI Interview Evaluation",
            status="healthy",
            model_name=interview_bundle.model_name,
            model_source=interview_bundle.model_source,
            usage_count=int(usage_counts.get("interview_evaluation", 0) or 0),
            notes="Scores interview answers for communication and decision support.",
        ),
    ]

    return {
        "modules": [item.model_dump() for item in modules],
        "usage_counts": usage_counts,
        "last_updated": usage_payload.get("last_audit_event_at"),
    }


@router.post("/vacancies", response_model=VacancyResponse)
async def create_vacancy(
    payload: VacancyCreateRequest,
    user: dict[str, Any] = Depends(_role_guard(ROLE_RECRUITER, ROLE_ADMIN)),
) -> dict[str, Any]:
    vacancy = get_ats_store().create_vacancy(payload.model_dump(), actor_user_id=user["user_id"])
    return vacancy


@router.get("/vacancies", response_model=list[VacancyResponse])
async def list_vacancies(
    include_closed: bool = False,
    q: Optional[str] = None,
    skill: Optional[str] = None,
    work_type: Optional[str] = None,
    location: Optional[str] = None,
) -> list[dict[str, Any]]:
    vacancies = get_ats_store().list_vacancies(include_closed=include_closed)

    search_text = (q or "").strip().lower()
    skill_text = (skill or "").strip().lower()
    work_type_text = (work_type or "").strip().lower()
    location_text = (location or "").strip().lower()

    if not any([search_text, skill_text, work_type_text, location_text]):
        return vacancies

    filtered: list[dict[str, Any]] = []
    for vacancy in vacancies:
        title = str(vacancy.get("title", "")).lower()
        department = str(vacancy.get("department", "")).lower()
        skills = [str(item).lower() for item in (vacancy.get("required_skills") or [])]
        vacancy_work_type = str(vacancy.get("work_type", "")).lower()
        vacancy_location = str(vacancy.get("location", "")).lower()

        searchable = " ".join([title, department, vacancy_location, " ".join(skills)])
        if search_text and search_text not in searchable:
            continue
        if skill_text and all(skill_text not in skill_item for skill_item in skills):
            continue
        if work_type_text and work_type_text != vacancy_work_type:
            continue
        if location_text and location_text not in vacancy_location:
            continue
        filtered.append(vacancy)

    return filtered


@router.get("/public/jobs")
async def list_public_jobs(q: Optional[str] = None, skill: Optional[str] = None) -> dict[str, Any]:
    vacancies = await list_vacancies(include_closed=False, q=q, skill=skill)
    jobs = [
        {
            "job_id": item.get("vacancy_id"),
            "job_name": item.get("title"),
            "required_skills": item.get("required_skills") or [],
            "experience_level": item.get("experience_level") or "Not specified",
            "responsibilities": item.get("responsibilities") or "",
            "work_type": item.get("work_type") or "onsite",
            "location": item.get("location") or "",
            "salary_min": item.get("salary_min"),
            "salary_max": item.get("salary_max"),
            "image_url": item.get("image_url") or "",
            "posted_at": item.get("created_at"),
        }
        for item in vacancies
    ]
    return {"jobs": jobs}


@router.post("/public/jobs")
async def create_public_job(
    payload: PublicJobCreateRequest,
    user: dict[str, Any] = Depends(_role_guard(ROLE_RECRUITER, ROLE_ADMIN)),
) -> dict[str, Any]:
    job_name = payload.job_name.strip()
    if not job_name:
        raise _friendly_error(400, "job_name cannot be empty")

    required_skills = _normalize_skills_list(payload.required_skills)
    if not required_skills:
        raise _friendly_error(400, "required_skills cannot be empty")

    vacancy = get_ats_store().create_vacancy(
        {
            "title": job_name,
            "department": "General",
            "required_skills": required_skills,
            "experience_level": payload.experience_level.strip() or "Not specified",
            "responsibilities": payload.responsibilities.strip() or f"Candidates should have: {', '.join(required_skills)}",
            "work_type": payload.work_type,
            "location": payload.location.strip(),
            "salary_min": payload.salary_min,
            "salary_max": payload.salary_max,
            "image_url": payload.image_url.strip(),
        },
        actor_user_id=user["user_id"],
    )

    return {
        "message": "Job posted successfully",
        "job": {
            "job_id": vacancy.get("vacancy_id"),
            "job_name": vacancy.get("title"),
            "required_skills": vacancy.get("required_skills") or [],
            "experience_level": vacancy.get("experience_level") or "Not specified",
            "responsibilities": vacancy.get("responsibilities") or "",
            "work_type": vacancy.get("work_type") or "onsite",
            "location": vacancy.get("location") or "",
            "salary_min": vacancy.get("salary_min"),
            "salary_max": vacancy.get("salary_max"),
            "image_url": vacancy.get("image_url") or "",
            "posted_at": vacancy.get("created_at"),
        },
    }


@router.get("/vacancies/{vacancy_id}", response_model=VacancyResponse)
async def get_vacancy(vacancy_id: str) -> dict[str, Any]:
    vacancy = get_ats_store().get_vacancy(vacancy_id)
    if not vacancy:
        raise _friendly_error(404, "vacancy not found")
    return vacancy


@router.patch("/vacancies/{vacancy_id}", response_model=VacancyResponse)
async def update_vacancy(
    vacancy_id: str,
    payload: VacancyUpdateRequest,
    user: dict[str, Any] = Depends(_role_guard(ROLE_RECRUITER, ROLE_ADMIN)),
) -> dict[str, Any]:
    try:
        vacancy = get_ats_store().update_vacancy(
            vacancy_id,
            payload.model_dump(exclude_none=True),
            actor_user_id=user["user_id"],
        )
        return vacancy
    except ValueError as exc:
        raise _friendly_error(404, str(exc)) from exc


@router.get("/recruiter/vacancies", response_model=list[VacancyResponse])
async def recruiter_vacancies(
    user: dict[str, Any] = Depends(_role_guard(ROLE_RECRUITER, ROLE_ADMIN)),
) -> list[dict[str, Any]]:
    return get_ats_store().list_recruiter_vacancies(user["user_id"])


@router.post("/vacancies/{vacancy_id}/apply", response_model=ApplicationResponse)
async def apply_to_vacancy(
    vacancy_id: str,
    cv_file: Optional[UploadFile] = File(default=None),
    cv_cache_id: Optional[str] = Form(default=None),
    candidate_meta: Optional[str] = Form(default=None),
    user: dict[str, Any] = Depends(_role_guard(ROLE_CANDIDATE)),
) -> dict[str, Any]:
    vacancy = get_ats_store().get_vacancy(vacancy_id)
    if not vacancy:
        raise _friendly_error(404, "vacancy not found")

    if str(vacancy.get("status", "open")).lower() != "open":
        raise _friendly_error(400, "vacancy is not open")

    try:
        cv_text, file_name, source_label = await _extract_cv_text_from_input(cv_file, cv_cache_id)
    except ValueError as exc:
        raise _friendly_error(400, str(exc)) from exc

    try:
        parsed_meta = parse_candidate_meta(candidate_meta)
    except ValueError as exc:
        raise _friendly_error(400, str(exc)) from exc

    ai_scores = _compute_application_scores(cv_text=cv_text, vacancy=vacancy, candidate_meta=parsed_meta)
    resume_profile = _resume_profile_from_text(cv_text, vacancy.get("required_skills") or [])
    candidate_skills = resume_profile.get("skills_detected") or _extract_basic_skills(cv_text)

    auto_status = "Applied"
    risk_band = str((ai_scores.get("risk") or {}).get("risk_band", "")).upper()
    if float(ai_scores.get("fit_score_0_100", 0.0) or 0.0) >= 78 and risk_band != "HIGH":
        auto_status = "Shortlisted"

    payload = {
        "vacancy_id": vacancy_id,
        "candidate_name": user.get("name"),
        "candidate_email": user.get("email"),
        "resume": {
            "source": source_label,
            "file_name": file_name,
            "text_char_count": len(cv_text),
            "skills": candidate_skills,
            "skills_detected": resume_profile.get("skills_detected", candidate_skills),
            "explainable_ai": resume_profile.get("explainable_ai"),
            "feature_inference": resume_profile.get("feature_inference"),
            "preview": cv_text[:700],
        },
        "ai_scores": ai_scores,
        "status": auto_status,
    }

    try:
        return get_ats_store().create_application(payload, actor_user_id=user["user_id"])
    except ValueError as exc:
        raise _friendly_error(400, str(exc)) from exc


@router.post("/public/jobs/{vacancy_id}/evaluate-cv")
async def evaluate_cv_for_public_job(
    vacancy_id: str,
    cv_file: Optional[UploadFile] = File(default=None),
    cv_cache_id: Optional[str] = Form(default=None),
    candidate_meta: Optional[str] = Form(default=None),
    requested_models: Optional[str] = Form(default=None),
    interview_question: Optional[str] = Form(default=None),
    interview_answer: Optional[str] = Form(default=None),
    user: dict[str, Any] = Depends(_role_guard(ROLE_CANDIDATE)),
) -> dict[str, Any]:
    vacancy = get_ats_store().get_vacancy(vacancy_id)
    if not vacancy:
        raise _friendly_error(404, "job not found")

    if str(vacancy.get("status", "open")).lower() != "open":
        raise _friendly_error(400, "job is not open")

    try:
        cv_text, file_name, source_label = await _extract_cv_text_from_input(cv_file, cv_cache_id)
    except ValueError as exc:
        raise _friendly_error(400, str(exc)) from exc

    try:
        parsed_candidate_meta = parse_candidate_meta(candidate_meta)
    except ValueError as exc:
        raise _friendly_error(400, str(exc)) from exc

    try:
        selected_models = _parse_requested_models(requested_models)
    except ValueError as exc:
        raise _friendly_error(400, str(exc)) from exc

    resume_profile = _resume_profile_from_text(cv_text, vacancy.get("required_skills") or [])
    model_1 = resume_profile if "resume" in selected_models else None
    model_1b = (
        validate_credentials_from_cv(cv_text, vacancy.get("required_skills") or [])
        if "credentials" in selected_models
        else None
    )

    model_2_and_4: dict[str, Any] = {}
    if "matching" in selected_models or "risk" in selected_models:
        model_2_and_4 = _compute_application_scores(
            cv_text=cv_text,
            vacancy=vacancy,
            candidate_meta=parsed_candidate_meta,
        )

    match_score = float((model_2_and_4.get("matching") or {}).get("score_0_100", 0.0) or 0.0)
    risk_score = float((model_2_and_4.get("risk") or {}).get("attrition_risk_score_0_100", 0.0) or 0.0)
    risk_adjusted = 100.0 - risk_score

    availability_score: Optional[float] = None
    if "matching" in selected_models and "risk" in selected_models:
        availability_score = round(match_score * 0.7 + risk_adjusted * 0.3, 2)
    elif "matching" in selected_models:
        availability_score = round(match_score, 2)
    elif "risk" in selected_models:
        availability_score = round(risk_adjusted, 2)

    if availability_score is None:
        availability_band = "N/A"
    else:
        availability_band = (
            "HIGH"
            if availability_score >= 75
            else "MEDIUM"
            if availability_score >= 50
            else "LOW"
        )

    candidate_skills = resume_profile.get("skills_detected") or _extract_basic_skills(cv_text)
    risk_band = str((model_2_and_4.get("risk") or {}).get("risk_band", "")).upper()
    auto_status = "Applied"
    if availability_score is not None and availability_score >= 78 and risk_band != "HIGH":
        auto_status = "Shortlisted"

    ai_scores: dict[str, Any] = {}
    if "matching" in selected_models:
        ai_scores["matching"] = model_2_and_4.get("matching")
        ai_scores["matching_summary"] = model_2_and_4.get("matching_summary")
        ai_scores["fit_score_0_100"] = model_2_and_4.get("fit_score_0_100")
        ai_scores["fit_band"] = model_2_and_4.get("fit_band")
        ai_scores["ai_recommendation"] = model_2_and_4.get("ai_recommendation")
        ai_scores["ai_recommendation_reason"] = model_2_and_4.get("ai_recommendation_reason")
    if "credentials" in selected_models:
        ai_scores["credentials"] = model_1b
    if "risk" in selected_models:
        ai_scores["risk"] = model_2_and_4.get("risk")

    interview_evaluation: Optional[dict[str, Any]] = None
    cleaned_interview_answer = str(interview_answer or "").strip()
    cleaned_interview_question = str(interview_question or "").strip()
    if cleaned_interview_answer:
        interview_evaluation = evaluate_interview_answer(
            answer_text=cleaned_interview_answer,
            question_text=cleaned_interview_question or None,
        )
        ai_scores["interview"] = interview_evaluation

    application_record: Optional[dict[str, Any]] = None
    application_created = False
    try:
        application_record = get_ats_store().create_application(
            {
                "vacancy_id": vacancy_id,
                "candidate_name": user.get("name"),
                "candidate_email": user.get("email"),
                "resume": {
                    "source": source_label,
                    "file_name": file_name,
                    "text_char_count": len(cv_text),
                    "skills": candidate_skills,
                    "skills_detected": resume_profile.get("skills_detected", candidate_skills),
                    "explainable_ai": resume_profile.get("explainable_ai"),
                    "feature_inference": resume_profile.get("feature_inference"),
                    "preview": cv_text[:700],
                },
                "ai_scores": ai_scores,
                "status": "Interviewed" if interview_evaluation else auto_status,
            },
            actor_user_id=user["user_id"],
        )
        application_created = True
    except ValueError as exc:
        if "already applied to this vacancy" in str(exc):
            existing = get_ats_store().list_candidate_applications(user["user_id"])
            application_record = next((item for item in existing if item.get("vacancy_id") == vacancy_id), None)
            if application_record is None:
                raise _friendly_error(409, "candidate already applied to this vacancy") from exc
        else:
            raise _friendly_error(400, str(exc)) from exc

    return {
        "request_id": str(uuid4()),
        "job": {
            "job_id": vacancy.get("vacancy_id"),
            "job_name": vacancy.get("title"),
            "required_skills": vacancy.get("required_skills") or [],
        },
        "cv_summary": {
            "file_name": file_name,
            "char_count": len(cv_text),
        },
        "selected_models": sorted(selected_models),
        "model_1_resume_parsing": model_1,
        "model_1b_credential_validation": model_1b,
        "model_2_job_matching": (
            {
                "summary": model_2_and_4.get("matching_summary"),
                "details": model_2_and_4.get("matching"),
                "fit_score_0_100": model_2_and_4.get("fit_score_0_100"),
                "fit_band": model_2_and_4.get("fit_band"),
            }
            if "matching" in selected_models
            else None
        ),
        "model_4_attrition_risk": model_2_and_4.get("risk") if "risk" in selected_models else None,
        "model_3_interview_evaluation": interview_evaluation,
        "overall_assessment": {
            "availability_score_0_100": availability_score,
            "availability_band": availability_band,
            "recommendation": (
                "Strongly suitable for next-stage consideration."
                if availability_band == "HIGH"
                else "Potential fit. Continue with deeper evaluation."
                if availability_band == "MEDIUM"
                else "Not currently suitable for this role."
                if availability_band == "LOW"
                else "Run matching or risk model for suitability score."
            ),
        },
        "application": {
            "created": application_created,
            "application_id": application_record.get("application_id") if application_record else None,
            "status": application_record.get("status") if application_record else None,
            "message": "Application submitted." if application_created else "Already applied. Existing application returned.",
        },
    }


@router.get("/candidates/applications", response_model=list[ApplicationResponse])
async def candidate_applications(
    user: dict[str, Any] = Depends(_role_guard(ROLE_CANDIDATE)),
) -> list[dict[str, Any]]:
    return get_ats_store().list_candidate_applications(user["user_id"])


@router.get("/recruiter/applications", response_model=list[ApplicationResponse])
async def recruiter_applications(
    vacancy_id: Optional[str] = None,
    user: dict[str, Any] = Depends(_role_guard(ROLE_RECRUITER, ROLE_ADMIN)),
) -> list[dict[str, Any]]:
    return get_ats_store().list_recruiter_applications(user["user_id"], vacancy_id)


@router.get("/recruiter/candidates/compare", response_model=RecruiterCandidateCompareResponse)
async def compare_recruiter_candidates(
    application_ids: Optional[str] = None,
    vacancy_id: Optional[str] = None,
    limit: int = 20,
    user: dict[str, Any] = Depends(_role_guard(ROLE_RECRUITER, ROLE_ADMIN)),
) -> dict[str, Any]:
    normalized_limit = max(1, min(int(limit or 20), 100))
    applications = get_ats_store().list_recruiter_applications(user["user_id"], vacancy_id)

    id_filter: set[str] = set()
    if application_ids is not None:
        id_filter = {part.strip() for part in application_ids.split(",") if part.strip()}
        if not id_filter:
            raise _friendly_error(400, "application_ids must be a comma-separated list when provided")

    if id_filter:
        applications = [item for item in applications if item.get("application_id") in id_filter]

    rows: list[RecruiterCandidateCompareRow] = []
    for app in applications[:normalized_limit]:
        ai = app.get("ai_scores") or {}
        risk = ai.get("risk") or {}

        fit_score = float(ai.get("fit_score_0_100", 0.0) or 0.0)
        interview_score = float((ai.get("interview") or {}).get("overall_score_0_100", 0.0) or 0.0)
        risk_score = float(risk.get("attrition_risk_score_0_100", 0.0) or 0.0)
        retention_score = float(risk.get("retention_probability", 0.0) or 0.0) * 100
        final_score = _application_final_score(app)
        risk_band = str(risk.get("risk_band", "UNKNOWN")).upper()

        recommendation = str(ai.get("ai_recommendation", "")).strip()
        recommendation_reason = str(ai.get("ai_recommendation_reason", "")).strip()
        if not recommendation or not recommendation_reason:
            recommendation, recommendation_reason = _recommendation_for_hiring(
                fit_score=fit_score,
                final_score=final_score,
                interview_score=interview_score,
                risk_band=risk_band,
            )

        rows.append(
            RecruiterCandidateCompareRow(
                application_id=str(app.get("application_id", "")),
                candidate_name=str(app.get("candidate_name") or "Unknown Candidate"),
                candidate_email=str(app.get("candidate_email") or "unknown@example.com"),
                vacancy_id=str(app.get("vacancy_id") or ""),
                status=str(app.get("status") or "Applied"),
                fit_score_0_100=round(fit_score, 2),
                interview_score_0_100=round(interview_score, 2),
                risk_score_0_100=round(risk_score, 2),
                retention_score_0_100=round(retention_score, 2),
                final_score_0_100=round(final_score, 2),
                risk_band=risk_band or "UNKNOWN",
                recommendation=recommendation,
                recommendation_reason=recommendation_reason,
            )
        )

    rows.sort(key=lambda row: (row.final_score_0_100, row.fit_score_0_100), reverse=True)
    top_row = rows[0] if rows else None
    average_final_score = round(
        sum(item.final_score_0_100 for item in rows) / len(rows),
        2,
    ) if rows else 0.0

    return {
        "comparison_rows": [item.model_dump() for item in rows],
        "summary": {
            "total_compared": len(rows),
            "average_final_score_0_100": average_final_score,
            "top_application_id": top_row.application_id if top_row else None,
            "top_candidate_name": top_row.candidate_name if top_row else None,
            "vacancy_filter": vacancy_id,
        },
    }


@router.post(
    "/recruiter/applications/{application_id}/recheck",
    response_model=RecruiterManualRecheckResponse,
)
async def manual_recheck_candidate_application(
    application_id: str,
    payload: RecruiterManualRecheckRequest,
    user: dict[str, Any] = Depends(_role_guard(ROLE_RECRUITER, ROLE_ADMIN)),
) -> dict[str, Any]:
    store = get_ats_store()
    application = store.get_application(application_id)
    if not application:
        raise _friendly_error(404, "application not found")

    if user.get("role") == ROLE_RECRUITER:
        recruiter_apps = store.list_recruiter_applications(user["user_id"])
        recruiter_app_ids = {item.get("application_id") for item in recruiter_apps}
        if application_id not in recruiter_app_ids:
            raise _friendly_error(403, "Permission denied for this application")

    vacancy_id = str(application.get("vacancy_id") or "").strip()
    vacancy = store.get_vacancy(vacancy_id)
    if vacancy is None:
        raise _friendly_error(404, "vacancy not found for this application")

    cv_text = str((application.get("resume") or {}).get("preview") or "").strip()
    if not cv_text:
        raise _friendly_error(400, "Cannot recheck because resume text preview is missing")

    try:
        selected_models = _resolve_manual_recheck_models(payload.requested_models)
    except ValueError as exc:
        raise _friendly_error(400, str(exc)) from exc

    model_1: Optional[dict[str, Any]] = None
    model_1b: Optional[dict[str, Any]] = None
    model_2: Optional[dict[str, Any]] = None
    model_3: Optional[dict[str, Any]] = None
    model_4: Optional[dict[str, Any]] = None
    recommendation: Optional[str] = None
    recommendation_reason: Optional[str] = None

    ai_scores_patch: dict[str, Any] = {}
    shared_scores: Optional[dict[str, Any]] = None
    resume_profile = _resume_profile_from_text(cv_text, vacancy.get("required_skills") or [])
    resume_patch = {
        "skills": resume_profile.get("skills_detected", (application.get("resume") or {}).get("skills", [])),
        "skills_detected": resume_profile.get("skills_detected", []),
        "explainable_ai": resume_profile.get("explainable_ai"),
        "feature_inference": resume_profile.get("feature_inference"),
    }

    if "resume" in selected_models:
        model_1 = resume_profile

    if "credentials" in selected_models:
        model_1b = validate_credentials_from_cv(cv_text, vacancy.get("required_skills") or [])
        ai_scores_patch["credentials"] = model_1b

    if "matching" in selected_models or "risk" in selected_models:
        shared_scores = _compute_application_scores(
            cv_text=cv_text,
            vacancy=vacancy,
            candidate_meta={},
        )
        recommendation = shared_scores.get("ai_recommendation")
        recommendation_reason = shared_scores.get("ai_recommendation_reason")

        if "matching" in selected_models:
            model_2 = {
                "summary": shared_scores.get("matching_summary"),
                "details": shared_scores.get("matching"),
                "fit_score_0_100": shared_scores.get("fit_score_0_100"),
                "fit_band": shared_scores.get("fit_band"),
            }
            ai_scores_patch["matching"] = shared_scores.get("matching")
            ai_scores_patch["matching_summary"] = shared_scores.get("matching_summary")
            ai_scores_patch["fit_score_0_100"] = shared_scores.get("fit_score_0_100")
            ai_scores_patch["fit_band"] = shared_scores.get("fit_band")
            ai_scores_patch["ai_recommendation"] = recommendation
            ai_scores_patch["ai_recommendation_reason"] = recommendation_reason

        if "risk" in selected_models:
            model_4 = shared_scores.get("risk")
            ai_scores_patch["risk"] = shared_scores.get("risk")

    if "interview" in selected_models:
        answer_text = str(payload.interview_answer or "").strip()
        if not answer_text:
            interviews = store.list_application_interviews(application_id)
            answered = [item for item in interviews if str(item.get("answer_text") or "").strip()]
            if answered:
                answer_text = str(answered[-1].get("answer_text") or "").strip()

        if not answer_text:
            raise _friendly_error(
                400,
                "interview_answer is required when no prior interview answer exists for this candidate",
            )

        model_3 = evaluate_interview_answer(
            answer_text=answer_text,
            question_text=payload.interview_question,
        )
        ai_scores_patch["interview"] = model_3

    updated_application: Optional[dict[str, Any]] = None
    if payload.persist_results:
        merged_ai_scores = dict(application.get("ai_scores") or {})
        merged_ai_scores.update(ai_scores_patch)
        try:
            updated_application = store.update_application_ai_scores(
                application_id,
                ai_scores=merged_ai_scores,
                resume=resume_patch,
                actor_user_id=user["user_id"],
                note=f"Manual recheck models: {', '.join(selected_models)}",
            )
        except ValueError as exc:
            raise _friendly_error(400, str(exc)) from exc

    return {
        "application_id": application_id,
        "models_executed": selected_models,
        "model_1_resume_parsing": model_1,
        "model_1b_credential_validation": model_1b,
        "model_2_job_matching": model_2,
        "model_3_interview_evaluation": model_3,
        "model_4_attrition_risk": model_4,
        "ai_recommendation": recommendation,
        "ai_recommendation_reason": recommendation_reason,
        "updated_application": updated_application,
    }


@router.patch("/applications/{application_id}/status", response_model=ApplicationResponse)
async def update_application_status(
    application_id: str,
    payload: ApplicationStatusUpdateRequest,
    user: dict[str, Any] = Depends(_role_guard(ROLE_RECRUITER, ROLE_ADMIN)),
) -> dict[str, Any]:
    try:
        return get_ats_store().update_application_status(
            application_id,
            status=payload.status,
            note=payload.note,
            actor_user_id=user["user_id"],
        )
    except ValueError as exc:
        raise _friendly_error(400, str(exc)) from exc


@router.post("/applications/{application_id}/interviews", response_model=InterviewResponse)
async def schedule_interview(
    application_id: str,
    payload: InterviewScheduleRequest,
    user: dict[str, Any] = Depends(_role_guard(ROLE_RECRUITER, ROLE_ADMIN)),
) -> dict[str, Any]:
    try:
        return get_ats_store().create_interview(
            application_id=application_id,
            interview_type=payload.interview_type,
            scheduled_at=payload.scheduled_at,
            question_text=payload.question_text,
            actor_user_id=user["user_id"],
        )
    except ValueError as exc:
        raise _friendly_error(400, str(exc)) from exc


@router.get("/applications/{application_id}/interviews", response_model=list[InterviewResponse])
async def list_interviews(
    application_id: str,
    user: dict[str, Any] = Depends(_current_user),
) -> list[dict[str, Any]]:
    _ = user
    return get_ats_store().list_application_interviews(application_id)


@router.post("/interviews/{interview_id}/submit", response_model=InterviewResponse)
async def submit_interview_answer(
    interview_id: str,
    payload: InterviewSubmitRequest,
    user: dict[str, Any] = Depends(_role_guard(ROLE_CANDIDATE, ROLE_RECRUITER, ROLE_ADMIN)),
) -> dict[str, Any]:
    evaluation = evaluate_interview_answer(payload.answer_text)
    try:
        return get_ats_store().complete_interview(
            interview_id,
            answer_text=payload.answer_text,
            evaluation=evaluation,
            actor_user_id=user["user_id"],
        )
    except ValueError as exc:
        raise _friendly_error(400, str(exc)) from exc


@router.post("/applications/{application_id}/decision", response_model=ApplicationResponse)
async def finalize_application(
    application_id: str,
    payload: FinalDecisionRequest,
    user: dict[str, Any] = Depends(_role_guard(ROLE_RECRUITER, ROLE_ADMIN)),
) -> dict[str, Any]:
    application = get_ats_store().get_application(application_id)
    if not application:
        raise _friendly_error(404, "application not found")

    final_score = _application_final_score(application)

    try:
        return get_ats_store().set_application_decision(
            application_id,
            decision=payload.decision,
            note=payload.note,
            final_score=final_score,
            actor_user_id=user["user_id"],
        )
    except ValueError as exc:
        raise _friendly_error(400, str(exc)) from exc


@router.get("/recruiter/dashboard", response_model=RecruiterDashboardResponse)
async def recruiter_dashboard(
    vacancy_id: Optional[str] = None,
    user: dict[str, Any] = Depends(_role_guard(ROLE_RECRUITER, ROLE_ADMIN)),
) -> dict[str, Any]:
    return get_ats_store().recruiter_dashboard(user["user_id"], vacancy_id)


@router.get("/status-catalog", response_model=dict[str, list[str]])
async def status_catalog() -> dict[str, list[str]]:
    return {
        "application_statuses": [
            "Applied",
            "Under Review",
            "Shortlisted",
            "Interview Scheduled",
            "Interviewed",
            "Final Review",
            "Selected",
            "Rejected",
            "Talent Pool",
            "Withdrawn",
        ],
        "final_decisions": ["selected", "rejected", "talent_pool", "review"],
        "interview_types": ["text", "mcq", "video"],
    }


@router.post("/seed/info", response_model=GenericMessageResponse)
async def seed_info() -> dict[str, str]:
    return {
        "message": (
            "Demo accounts seeded on startup: admin@talentai.local / Admin123!, "
            "hr@talentai.local / Recruiter123!, candidate@talentai.local / Candidate123!"
        )
    }
