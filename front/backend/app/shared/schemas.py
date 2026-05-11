from __future__ import annotations

from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str


class SchemaResponse(BaseModel):
    expected_columns: list[str]
    example_payload: dict[str, Any]


class TopFactor(BaseModel):
    name: str
    effect: str
    note: str


class EmploymentHistoryMetric(BaseModel):
    key: str
    label: str
    value: float
    source: str


class EmploymentHistory(BaseModel):
    metrics: list[EmploymentHistoryMetric] = Field(default_factory=list)


class AttritionResponse(BaseModel):
    request_id: str
    model: str
    threshold: float
    attrition_probability: float
    retention_probability: float
    attrition_risk_score_0_100: float
    predicted_attrition: int
    risk_band: str
    risk_band_rule: str
    inferred_fields: list[str]
    defaulted_fields: list[str]
    missing_fields: list[str]
    assumptions_used: list[str]
    top_factors: list[TopFactor] = Field(default_factory=list)
    employment_history: EmploymentHistory = Field(default_factory=EmploymentHistory)


class ErrorResponse(BaseModel):
    error: str
    details: Optional[str] = None


class CvCacheUploadResponse(BaseModel):
    cv_cache_id: str
    filename: str
    content_type: Optional[str] = None
    created_at: str
    expires_at: str
    ttl_seconds: int


class CvCacheTextResponse(BaseModel):
    cv_cache_id: str
    filename: str
    text: str
    char_count: int


class MatchingTargetInput(BaseModel):
    id: Optional[str] = None
    title: Optional[str] = None
    text: str = Field(min_length=1)
    metadata: Optional[dict[str, Any]] = None


class MatchingRequest(BaseModel):
    mode: Literal["cv_to_jobs", "job_to_candidates"]
    source_text: str = Field(min_length=1)
    targets: list[MatchingTargetInput] = Field(min_length=1)
    top_k: int = Field(default=5, ge=1, le=50)


class MatchingBreakdown(BaseModel):
    semantic_similarity: float
    keyword_overlap: float
    skill_overlap: float
    experience_alignment: float


class MatchingRecommendation(BaseModel):
    rank: int
    target_id: str
    target_title: str
    score_0_100: float
    match_band: str
    explanation: str
    matched_keywords: list[str] = Field(default_factory=list)
    missing_keywords: list[str] = Field(default_factory=list)
    breakdown: MatchingBreakdown


class MatchingResponse(BaseModel):
    request_id: str
    mode: str
    source_text_char_count: int
    summary: str
    recommendations: list[MatchingRecommendation] = Field(default_factory=list)


class InterviewEvaluationRequest(BaseModel):
    answer_text: str = Field(min_length=1)
    question_text: Optional[str] = None


class SoftSkillBreakdown(BaseModel):
    communication_clarity: float
    confidence_professionalism: float
    collaboration_team_orientation: float
    problem_solving_structure: float
    relevance_to_question: float


class InterviewEvaluationResponse(BaseModel):
    request_id: str
    model: str
    model_source: str
    overall_score_0_100: float
    hire_recommendation_score_0_10: float
    band: str
    predicted_label: str
    confidence: float
    answer_word_count: int
    summary: str
    soft_skill_breakdown: SoftSkillBreakdown
    strengths: list[str] = Field(default_factory=list)
    concerns: list[str] = Field(default_factory=list)
    suggestions: list[str] = Field(default_factory=list)
