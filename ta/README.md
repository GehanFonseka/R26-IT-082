# AI Talent Acquisition Frontend (React + Vite)

Frontend workspace for the AI-powered hiring system.

## Four-Member Structure

- `src/members/member_1_attrition_risk/` - attrition risk pages and HR candidate risk review.
- `src/members/member_2_resume_parser/` - candidate workspace, CV upload, and resume parser pages.
- `src/members/member_3_job_matching/` - recruiter workspace, job matching, dashboards, and candidate lists.
- `src/members/member_4_interview_evaluation/` - interview soft-skill evaluation page.
- `src/shared/` - shared UI components, context providers, API helpers, data, and common pages.

The app is combined through `src/App.jsx`, which imports member pages and shared login/not-found pages.

## Run

```bash
cd ta
npm install
npm run dev
```

Optional API base override:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000 npm run dev
```

## Backend Dependency

The frontend expects the FastAPI backend to be running at `http://127.0.0.1:8000` unless overridden by `VITE_API_BASE_URL`.
