# AI Talent Acquisition Backend

FastAPI backend for an end-to-end intelligent hiring lifecycle.

## What This Backend Now Supports

- Auth + role-based access (`candidate`, `recruiter`, `admin`)
- Company management (admin)
- Vacancy management (recruiter/admin)
- Candidate applications with CV upload or cached CV reuse
- AI scoring on apply:
  - Resume feature inference
  - Job-candidate matching with explainability
  - Attrition risk prediction
- Candidate job search filters (`q`, `skill`, `work_type`, `location`)
- Interview scheduling + answer evaluation
- Recruiter candidate comparison with AI recommendation summary
- Final hiring decisions (`selected`, `rejected`, `talent_pool`, `review`)
- Recruiter dashboard analytics + admin reports + audit logs
- Admin AI module monitoring + user access control (activate/deactivate user)

Legacy module APIs remain available as well (resume cache, matching, interview scoring, attrition scoring).

## Structure

- `app/main.py` - FastAPI bootstrap only: startup, CORS, `/health`, and four member router registration
- `app/member_1_attrition_risk/` - Member 1 / Notebook 01: attrition API, predictor Python, and attrition model artifacts
- `app/member_2_resume_parser/` - Member 2 / Notebook 02: CV cache API, resume parsing Python, credential validation, and resume model artifacts
- `app/member_3_job_matching/` - Member 3 / Notebook 03: matching API and explainable matching Python
- `app/member_4_interview_evaluation/` - Member 4 / Notebook 04: interview API, interview scoring Python, and interview model artifacts
- `app/shared/` - shared schemas, ATS store, model loader, hiring cycle integration, and common utilities
- `data/ats_store.json` - ATS persistent store (auto-generated)

See `../MODULE_DIVISION.md` for the four member/model ownership breakdown across backend, frontend, and notebooks.

## Model Artifacts

Attrition artifacts now belong to Member 1:

- `app/member_1_attrition_risk/model_artifacts/attrition_xgb.json`
- `app/member_1_attrition_risk/model_artifacts/preprocess.joblib`
- `app/member_1_attrition_risk/model_artifacts/schema.json`
- `app/member_1_attrition_risk/model_artifacts/config.json`

Resume artifacts belong to Member 2:

- `app/member_2_resume_parser/model_artifacts/resume_explainer.joblib`
- `app/member_2_resume_parser/model_artifacts/resume_explainer_config.json`

Interview artifacts belong to Member 4:

- `app/member_4_interview_evaluation/model_artifacts/interview_scorer.joblib`
- `app/member_4_interview_evaluation/model_artifacts/config.json`

## Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

Optional (only if using local HuggingFace interview model files):

```bash
pip install transformers torch
```

## Run

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload
```

## Seeded Demo Credentials

Auto-seeded on startup:

- `admin@talentai.local` / `Admin123!`
- `hr@talentai.local` / `Recruiter123!`
- `candidate@talentai.local` / `Candidate123!`

## Full Hiring Cycle APIs (`/api/v1/...`)

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

### Admin

- `POST /admin/companies`
- `GET /admin/companies`
- `GET /admin/users`
- `PATCH /admin/users/{user_id}/access`
- `GET /admin/reports`
- `GET /admin/ai-modules`

### Vacancy

- `POST /vacancies`
- `GET /vacancies` (supports `q`, `skill`, `work_type`, `location`, `include_closed`)
- `GET /vacancies/{vacancy_id}`
- `PATCH /vacancies/{vacancy_id}`
- `GET /recruiter/vacancies`

### Candidate Application

- `POST /vacancies/{vacancy_id}/apply` (`multipart/form-data` with `cv_file` or `cv_cache_id`, optional `candidate_meta`)
- `GET /candidates/applications`

### Recruiter Pipeline

- `GET /recruiter/applications`
- `GET /recruiter/candidates/compare`
- `POST /recruiter/applications/{application_id}/recheck`
- `PATCH /applications/{application_id}/status`
- `POST /applications/{application_id}/interviews`
- `GET /applications/{application_id}/interviews`
- `POST /interviews/{interview_id}/submit`
- `POST /applications/{application_id}/decision`
- `GET /recruiter/dashboard`
- `GET /status-catalog`

## Legacy Module APIs

- `GET /health`
- `POST /api/v1/interview/evaluate`
- `POST /api/v1/cv-cache/upload`
- `GET /api/v1/cv-cache/{cv_cache_id}/text`
- `POST /api/v1/matching/recommend`
- `GET /api/v1/attrition/schema`
- `POST /api/v1/attrition/score`
- `POST /api/v1/attrition/score-from-cv`

## Example: Candidate Apply

```bash
curl -X POST "http://127.0.0.1:8000/api/v1/vacancies/VAC-00001/apply" \
  -H "Authorization: Bearer <candidate_token>" \
  -F "cv_file=@/path/to/cv.pdf" \
  -F 'candidate_meta={"role_title":"Software Engineer","department":"Engineering"}'
```

## Example: Recruiter Create Vacancy

```bash
curl -X POST "http://127.0.0.1:8000/api/v1/vacancies" \
  -H "Authorization: Bearer <recruiter_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Software Engineer",
    "department": "Engineering",
    "required_skills": ["Java", "Spring Boot", "MySQL"],
    "experience_level": "2+ years",
    "salary_min": 120000,
    "salary_max": 200000,
    "work_type": "hybrid",
    "responsibilities": "Build APIs"
  }'
```
