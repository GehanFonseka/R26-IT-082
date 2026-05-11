# AI Talent Acquisition System - Final Project Structure

This project is organized as four member-owned model components that are combined through shared backend and frontend integration layers.

## Run The Project

Backend:

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload
```

Frontend:

```bash
cd ta
npm install
npm run dev
```

URLs:

- Backend: `http://127.0.0.1:8000`
- Frontend: `http://localhost:5173`
- Swagger API docs: `http://127.0.0.1:8000/docs`

Demo logins:

- Admin: `admin@talentai.local` / `Admin123!`
- HR: `hr@talentai.local` / `Recruiter123!`
- Candidate: `candidate@talentai.local` / `Candidate123!`

## Top-Level Folders

- `backend/` - FastAPI backend, model APIs, shared ATS integration, data store, and model artifacts.
- `ta/` - React + Vite frontend.
- `models/` - four model training notebooks used as the reference for member ownership.
- `RUN_GUIDE.md` - short run instructions.
- `MODULE_DIVISION.md` - compact four-member ownership map.

## Four Model Notebooks

- `models/01_attrition_risk_model_training.ipynb` - Member 1, Attrition Risk.
- `models/02_resume_parser_model_training.ipynb` - Member 2, Resume Parser.
- `models/03_job_matching_model_training.ipynb` - Member 3, Job Matching.
- `models/04_interview_evaluation_model_training.ipynb` - Member 4, Interview Evaluation.

## Backend Structure

Backend entrypoint:

- `backend/app/main.py`
  - Creates the FastAPI app.
  - Registers CORS.
  - Loads startup model bundles.
  - Registers the four member routers.
  - Registers the shared hiring-cycle router.
  - Provides `/health`.

Shared backend layer:

- `backend/app/shared/ats_store.py` - JSON ATS datastore, seeded users, companies, vacancies, applications, interviews, and audit trail.
- `backend/app/shared/cv_cache.py` - temporary CV cache used by resume and attrition flows.
- `backend/app/shared/errors.py` - shared friendly API error helper.
- `backend/app/shared/hiring_cycle.py` - combined ATS workflow: auth, jobs, applications, recruiter review, interviews, decisions, dashboards.
- `backend/app/shared/hiring_cycle_schemas.py` - request/response schemas for ATS workflow.
- `backend/app/shared/model_loader.py` - attrition model artifact loader.
- `backend/app/shared/schemas.py` - schemas for standalone model APIs.
- `backend/app/shared/utils.py` - shared parsing, file, upload, and feature helpers.

Backend data and scripts:

- `backend/data/ats_store.json` - persistent demo ATS datastore.
- `backend/uploads/.gitkeep` - upload folder placeholder.
- `backend/scripts/train_resume_explainer_model.py` - trains Member 2 resume explainer artifact.
- `backend/scripts/train_interview_model.py` - trains Member 4 interview scorer artifact.
- `backend/requirements.txt` - Python dependencies.

## Member 1 - Attrition Risk

Purpose:

- Predict early attrition risk.
- Return attrition probability, retention probability, risk band, and top factors.

Backend:

- `backend/app/member_1_attrition_risk/routes.py` - attrition API endpoints.
- `backend/app/member_1_attrition_risk/predictor.py` - feature preparation and XGBoost prediction.
- `backend/app/member_1_attrition_risk/model_artifacts/attrition_xgb.json` - XGBoost model.
- `backend/app/member_1_attrition_risk/model_artifacts/preprocess.joblib` - preprocessing pipeline.
- `backend/app/member_1_attrition_risk/model_artifacts/schema.json` - expected feature schema.
- `backend/app/member_1_attrition_risk/model_artifacts/config.json` - model config and threshold.

Frontend:

- `ta/src/members/member_1_attrition_risk/RecruitmentAnalyticsPage.jsx` - standalone risk scoring UI.
- `ta/src/members/member_1_attrition_risk/HrCandidateReviewPage.jsx` - HR candidate review and risk panel.
- `ta/src/members/member_1_attrition_risk/README.md` - member frontend notes.

APIs:

- `GET /api/v1/attrition/schema`
- `POST /api/v1/attrition/score`
- `POST /api/v1/attrition/score-from-cv`

## Member 2 - Resume Parser

Purpose:

- Extract CV text from PDF/DOCX/TXT.
- Parse candidate profile details.
- Validate credentials.
- Produce resume explainability signals.

Backend:

- `backend/app/member_2_resume_parser/routes.py` - CV cache and text extraction API endpoints.
- `backend/app/member_2_resume_parser/cv_parser.py` - CV text extraction and feature inference.
- `backend/app/member_2_resume_parser/resume_explainer_model.py` - trained resume label/explainability model wrapper.
- `backend/app/member_2_resume_parser/credential_validator.py` - credential validation logic.
- `backend/app/member_2_resume_parser/model_artifacts/resume_explainer.joblib` - resume explainer artifact.
- `backend/app/member_2_resume_parser/model_artifacts/resume_explainer_config.json` - resume explainer config.

Frontend:

- `ta/src/members/member_2_resume_parser/CandidateWorkspacePage.jsx` - candidate portal, jobs, CV upload, applications.
- `ta/src/members/member_2_resume_parser/ResumeParserPage.jsx` - standalone resume parsing UI.
- `ta/src/members/member_2_resume_parser/README.md` - member frontend notes.

APIs:

- `POST /api/v1/cv-cache/upload`
- `GET /api/v1/cv-cache/{cv_cache_id}/text`

## Member 3 - Job Matching

Purpose:

- Rank jobs for a CV.
- Rank candidates for a job.
- Show fit scores, matched terms, missing terms, and recommendations.

Backend:

- `backend/app/member_3_job_matching/routes.py` - standalone matching API endpoint.
- `backend/app/member_3_job_matching/matching_engine.py` - explainable matching/ranking engine.

Frontend:

- `ta/src/members/member_3_job_matching/HrWorkspacePage.jsx` - main recruiter workspace.
- `ta/src/members/member_3_job_matching/CandidateMatchingPage.jsx` - standalone matching UI.
- `ta/src/members/member_3_job_matching/HrDashboardPage.jsx` - HR dashboard.
- `ta/src/members/member_3_job_matching/HrCandidatesPage.jsx` - HR candidate list.
- `ta/src/members/member_3_job_matching/HrPostJobsPage.jsx` - job posting page.
- `ta/src/members/member_3_job_matching/FullHiringCyclePage.jsx` - full workflow demo page.
- `ta/src/members/member_3_job_matching/README.md` - member frontend notes.

APIs:

- `POST /api/v1/matching/recommend`

## Member 4 - Interview Evaluation

Purpose:

- Score interview answers.
- Return communication/clarity/confidence style breakdowns.
- Produce a final band and recommendation summary.

Backend:

- `backend/app/member_4_interview_evaluation/routes.py` - interview evaluation API endpoint.
- `backend/app/member_4_interview_evaluation/interview_scorer.py` - model/rubric interview scoring logic.
- `backend/app/member_4_interview_evaluation/model_artifacts/interview_scorer.joblib` - interview scoring artifact.
- `backend/app/member_4_interview_evaluation/model_artifacts/config.json` - interview model config.

Frontend:

- `ta/src/members/member_4_interview_evaluation/InterviewSoftSkillPage.jsx` - standalone interview evaluation UI.
- `ta/src/members/member_4_interview_evaluation/README.md` - member frontend notes.

APIs:

- `POST /api/v1/interview/evaluate`

## Shared Backend APIs

All routes below are registered under `/api/v1` from `backend/app/shared/hiring_cycle.py`.

Auth:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

Admin:

- `POST /api/v1/admin/companies`
- `GET /api/v1/admin/companies`
- `GET /api/v1/admin/users`
- `GET /api/v1/admin/reports`
- `PATCH /api/v1/admin/users/{user_id}/access`
- `GET /api/v1/admin/ai-modules`

Vacancies and public jobs:

- `POST /api/v1/vacancies`
- `GET /api/v1/vacancies`
- `GET /api/v1/vacancies/{vacancy_id}`
- `PATCH /api/v1/vacancies/{vacancy_id}`
- `GET /api/v1/public/jobs`
- `POST /api/v1/public/jobs`
- `POST /api/v1/public/jobs/{vacancy_id}/evaluate-cv`
- `GET /api/v1/recruiter/vacancies`

Candidate applications:

- `POST /api/v1/vacancies/{vacancy_id}/apply`
- `GET /api/v1/candidates/applications`

Recruiter workflow:

- `GET /api/v1/recruiter/applications`
- `GET /api/v1/recruiter/candidates/compare`
- `POST /api/v1/recruiter/applications/{application_id}/recheck`
- `PATCH /api/v1/applications/{application_id}/status`
- `POST /api/v1/applications/{application_id}/decision`
- `GET /api/v1/recruiter/dashboard`

Interview workflow:

- `POST /api/v1/applications/{application_id}/interviews`
- `GET /api/v1/applications/{application_id}/interviews`
- `POST /api/v1/interviews/{interview_id}/submit`

Other:

- `GET /api/v1/status-catalog`
- `POST /api/v1/seed/info`
- `GET /health`

## Frontend Structure

Frontend entrypoints:

- `ta/src/main.jsx` - React root, providers, and router setup.
- `ta/src/App.jsx` - route definitions and protected candidate/HR routing.
- `ta/src/index.css` - global styles.
- `ta/src/App.css` - app-level styles.

Shared frontend layer:

- `ta/src/shared/components/` - shared UI components.
- `ta/src/shared/components/portal/WorkspaceShell.jsx` - shared candidate/HR workspace shell.
- `ta/src/shared/context/AuthSessionContext.jsx` - login/session context.
- `ta/src/shared/context/SharedCvContext.jsx` - shared CV upload/cache state.
- `ta/src/shared/context/ThemeContext.jsx` - light/dark theme context.
- `ta/src/shared/context/UserModeContext.jsx` - candidate/HR mode context.
- `ta/src/shared/data/landingContent.js` - landing content data.
- `ta/src/shared/pages/PortalLoginPage.jsx` - candidate/HR login page.
- `ta/src/shared/pages/NotFoundPage.jsx` - fallback route.
- `ta/src/shared/pages/LandingPage.jsx` - legacy/shared landing page.
- `ta/src/shared/pages/ModulePlaceholderPage.jsx` - placeholder page.
- `ta/src/shared/utils/portalApi.js` - auth/API helper.
- `ta/src/shared/utils/hrWorkspaceApi.js` - HR API helper.
- `ta/src/shared/utils/modelUtils.js` - JSON/export helpers.
- `ta/src/shared/utils/motion.js` - animation variants.

Frontend routes:

- `/` - redirects to `/candidate`
- `/candidate` - candidate login
- `/candidate/dashboard` - candidate dashboard section
- `/candidate/jobs` - candidate jobs section
- `/candidate/jobs/:jobId` - candidate job detail/apply flow
- `/candidate/applications` - candidate applications section
- `/hr` - HR login
- `/hr/dashboard` - HR dashboard section
- `/hr/jobs` - HR job posting/listing section
- `/hr/candidates` - HR candidate list section
- `/hr/candidates/:applicationId` - HR candidate review page
- `/hr/interviews` - HR interview evaluation section
- `/hr/analytics` - HR analytics section
- `*` - not found page

## Shared Components

Key shared UI files:

- `AboutProject.jsx`
- `ContactSection.jsx`
- `FeatureCard.jsx`
- `FeatureCards.jsx`
- `Footer.jsx`
- `Header.jsx`
- `Hero.jsx`
- `HowItWorks.jsx`
- `MinimalInputCard.jsx`
- `MinimalOutputCard.jsx`
- `ModulePageLayout.jsx`
- `ModulesGrid.jsx`
- `Overview.jsx`
- `SectionTitle.jsx`
- `TechStack.jsx`
- `ThemeToggleButton.jsx`
- `portal/WorkspaceShell.jsx`

## Build And Verification

Backend syntax/import check:

```bash
cd backend
source .venv/bin/activate
python -m compileall app
python -c "from app.main import app; print(app.title); print(len(app.routes))"
```

Frontend build:

```bash
cd ta
npm run build
```

## Ownership Summary

- Member 1 owns attrition risk backend and frontend.
- Member 2 owns resume parsing backend and frontend.
- Member 3 owns job matching backend and recruiter workflow frontend.
- Member 4 owns interview evaluation backend and frontend.
- Shared backend/frontend folders contain integration code needed to combine all four member components into one working application.

