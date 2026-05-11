from __future__ import annotations

from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


UserRole = Literal["candidate", "recruiter", "admin"]
ApplicationDecision = Literal["selected", "rejected", "talent_pool", "review"]


class UserSummary(BaseModel):
    user_id: str
    name: str
    email: str
    role: UserRole
    company_id: Optional[str] = None
    active: bool = True
    created_at: str


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1)
    email: str = Field(min_length=3)
    password: str = Field(min_length=6)
    role: UserRole = "candidate"
    company_id: Optional[str] = None


class LoginRequest(BaseModel):
    email: str = Field(min_length=3)
    password: str = Field(min_length=1)


class AuthResponse(BaseModel):
    token: str
    expires_at: str
    user: UserSummary


class CompanyCreateRequest(BaseModel):
    name: str = Field(min_length=1)
    industry: str = Field(default="Unknown")
    location: str = Field(default="Unknown")


class CompanyResponse(BaseModel):
    company_id: str
    name: str
    industry: str
    location: str
    created_at: str
    created_by: str


class VacancyCreateRequest(BaseModel):
    title: str = Field(min_length=1)
    department: str = Field(default="General")
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    required_skills: list[str] = Field(default_factory=list)
    experience_level: str = Field(default="Not specified")
    responsibilities: str = Field(default="")
    deadline: Optional[str] = None
    work_type: Literal["remote", "onsite", "hybrid"] = "onsite"
    location: str = Field(default="")
    image_url: str = Field(default="")
    company_id: Optional[str] = None


class VacancyUpdateRequest(BaseModel):
    title: Optional[str] = None
    department: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    required_skills: Optional[list[str]] = None
    experience_level: Optional[str] = None
    responsibilities: Optional[str] = None
    deadline: Optional[str] = None
    work_type: Optional[Literal["remote", "onsite", "hybrid"]] = None
    location: Optional[str] = None
    image_url: Optional[str] = None
    status: Optional[Literal["open", "closed"]] = None


class VacancyResponse(BaseModel):
    vacancy_id: str
    title: str
    department: str
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    required_skills: list[str] = Field(default_factory=list)
    experience_level: str
    responsibilities: str
    deadline: Optional[str] = None
    work_type: str
    location: str
    image_url: str = ""
    status: str
    company_id: Optional[str] = None
    recruiter_id: str
    created_at: str
    updated_at: str


class ApplicationStatusEvent(BaseModel):
    status: str
    timestamp: str
    note: str
    actor_user_id: str


class ApplicationFinalDecision(BaseModel):
    decision: str
    status: str
    note: str
    final_score: float
    decided_by: str
    decided_at: str


class ApplicationResponse(BaseModel):
    application_id: str
    vacancy_id: str
    candidate_id: str
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    resume: dict[str, Any] = Field(default_factory=dict)
    ai_scores: dict[str, Any] = Field(default_factory=dict)
    status: str
    status_history: list[ApplicationStatusEvent] = Field(default_factory=list)
    final_decision: Optional[ApplicationFinalDecision] = None
    created_at: str
    updated_at: str


class ApplicationStatusUpdateRequest(BaseModel):
    status: str = Field(min_length=1)
    note: str = Field(default="Status updated")


class InterviewScheduleRequest(BaseModel):
    interview_type: Literal["text", "mcq", "video"] = "text"
    scheduled_at: str = Field(min_length=6)
    question_text: Optional[str] = None


class InterviewResponse(BaseModel):
    interview_id: str
    application_id: str
    interview_type: str
    scheduled_at: str
    question_text: Optional[str] = None
    status: str
    evaluation: Optional[dict[str, Any]] = None
    answer_text: Optional[str] = None
    created_at: str
    updated_at: str


class InterviewSubmitRequest(BaseModel):
    answer_text: str = Field(min_length=1)


class FinalDecisionRequest(BaseModel):
    decision: ApplicationDecision
    note: str = Field(default="Final decision updated")


class RecruiterDashboardResponse(BaseModel):
    total_vacancies: int
    total_applications: int
    funnel: dict[str, int]
    risk_distribution: dict[str, int]
    top_skills: list[dict[str, Any]] = Field(default_factory=list)
    candidates: list[dict[str, Any]] = Field(default_factory=list)
    conversion: dict[str, float]


class AdminReportResponse(BaseModel):
    counts: dict[str, int]
    users_by_role: dict[str, int]
    open_vacancies: int
    recent_audit_logs: list[dict[str, Any]] = Field(default_factory=list)


class UserAccessUpdateRequest(BaseModel):
    active: bool
    reason: str = Field(default="Access state updated by admin")


class AiModuleStatusItem(BaseModel):
    module_key: str
    module_name: str
    status: Literal["healthy", "degraded"]
    model_name: str
    model_source: str
    usage_count: int
    notes: str


class AdminAiModulesResponse(BaseModel):
    modules: list[AiModuleStatusItem] = Field(default_factory=list)
    usage_counts: dict[str, int] = Field(default_factory=dict)
    last_updated: Optional[str] = None


class RecruiterCandidateCompareRow(BaseModel):
    application_id: str
    candidate_name: str
    candidate_email: str
    vacancy_id: str
    status: str
    fit_score_0_100: float
    interview_score_0_100: float
    risk_score_0_100: float
    retention_score_0_100: float
    final_score_0_100: float
    risk_band: str
    recommendation: str
    recommendation_reason: str


class RecruiterCandidateCompareResponse(BaseModel):
    comparison_rows: list[RecruiterCandidateCompareRow] = Field(default_factory=list)
    summary: dict[str, Any] = Field(default_factory=dict)


class RecruiterManualRecheckRequest(BaseModel):
    requested_models: list[Literal["resume", "credentials", "matching", "interview", "risk"]] = Field(default_factory=list)
    interview_answer: Optional[str] = None
    interview_question: Optional[str] = None
    persist_results: bool = True


class RecruiterManualRecheckResponse(BaseModel):
    application_id: str
    models_executed: list[str] = Field(default_factory=list)
    model_1_resume_parsing: Optional[dict[str, Any]] = None
    model_1b_credential_validation: Optional[dict[str, Any]] = None
    model_2_job_matching: Optional[dict[str, Any]] = None
    model_3_interview_evaluation: Optional[dict[str, Any]] = None
    model_4_attrition_risk: Optional[dict[str, Any]] = None
    ai_recommendation: Optional[str] = None
    ai_recommendation_reason: Optional[str] = None
    updated_application: Optional[ApplicationResponse] = None


class GenericMessageResponse(BaseModel):
    message: str
