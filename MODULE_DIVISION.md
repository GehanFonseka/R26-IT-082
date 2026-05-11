# Four Model Module Division

This project is divided into four model-based components, matching the four training notebooks in `models/`. Each component has backend logic, frontend screens, and a notebook reference so the work can be presented as four member contributions.

## Member 1: Attrition Risk Prediction

- Notebook reference: `models/01_attrition_risk_model_training.ipynb`
- Backend owner paths:
  - `backend/app/member_1_attrition_risk/`
  - API/router: `backend/app/member_1_attrition_risk/routes.py`
  - Model Python: `backend/app/member_1_attrition_risk/predictor.py`
  - Model artifacts: `backend/app/member_1_attrition_risk/model_artifacts/`
  - Shared loader: `backend/app/shared/model_loader.py`
- Frontend owner paths:
  - `ta/src/members/member_1_attrition_risk/`
  - `ta/src/members/member_1_attrition_risk/RecruitmentAnalyticsPage.jsx`
  - `ta/src/members/member_1_attrition_risk/HrCandidateReviewPage.jsx`
  - attrition risk panels inside `ta/src/members/member_3_job_matching/HrWorkspacePage.jsx`
- Main responsibility: prepare candidate features, load the XGBoost attrition model, calculate attrition probability, risk band, and explainable top risk factors.

## Member 2: Resume Parsing and CV Intelligence

- Notebook reference: `models/02_resume_parser_model_training.ipynb`
- Backend owner paths:
  - `backend/app/member_2_resume_parser/`
  - API/router: `backend/app/member_2_resume_parser/routes.py`
  - Model Python: `backend/app/member_2_resume_parser/cv_parser.py`
  - Model Python: `backend/app/member_2_resume_parser/resume_explainer_model.py`
  - Model Python: `backend/app/member_2_resume_parser/credential_validator.py`
  - Model artifacts: `backend/app/member_2_resume_parser/model_artifacts/`
  - Shared CV cache: `backend/app/shared/cv_cache.py`
- Frontend owner paths:
  - `ta/src/members/member_2_resume_parser/`
  - resume parser panels inside candidate and HR workspaces
- Main responsibility: extract text from PDF/DOCX/TXT CVs, infer candidate profile fields, validate credentials, detect skills, and prepare CV-derived model inputs.

## Member 3: Job-Candidate Matching

- Notebook reference: `models/03_job_matching_model_training.ipynb`
- Backend owner paths:
  - `backend/app/member_3_job_matching/`
  - API/router: `backend/app/member_3_job_matching/routes.py`
  - Model Python: `backend/app/member_3_job_matching/matching_engine.py`
  - matching-related hiring cycle integration in `backend/app/shared/hiring_cycle.py`
- Frontend owner paths:
  - `ta/src/members/member_3_job_matching/`
  - `ta/src/members/member_3_job_matching/CandidateMatchingPage.jsx`
- Main responsibility: compare CVs with vacancies, rank jobs/candidates, return fit scores, matched/missing signals, and recruiter recommendation summaries.

## Member 4: Interview Evaluation

- Notebook reference: `models/04_interview_evaluation_model_training.ipynb`
- Backend owner paths:
  - `backend/app/member_4_interview_evaluation/`
  - API/router: `backend/app/member_4_interview_evaluation/routes.py`
  - Model Python: `backend/app/member_4_interview_evaluation/interview_scorer.py`
  - Model artifacts: `backend/app/member_4_interview_evaluation/model_artifacts/`
  - interview endpoints in `backend/app/shared/hiring_cycle.py`
- Frontend owner paths:
  - `ta/src/members/member_4_interview_evaluation/`
  - interview panels inside `ta/src/members/member_3_job_matching/HrWorkspacePage.jsx`
  - interview panels inside `ta/src/members/member_1_attrition_risk/HrCandidateReviewPage.jsx`
- Main responsibility: score interview answers, calculate soft-skill breakdowns, confidence, decision band, and interview evaluation summaries.

## Shared Integration Layer

The following files connect the four modules into one application and should be treated as shared team work:

- Backend shared layer: `backend/app/shared/`
- Backend app entrypoint: `backend/app/main.py`
  - Registers four member routers through `FOUR_MEMBER_MODEL_ROUTERS`.
  - Handles startup model loading, ATS initialization, CORS, and `/health` only.
- Frontend shared shell/components: `ta/src/shared/`
- Frontend routing entrypoint: `ta/src/App.jsx`
