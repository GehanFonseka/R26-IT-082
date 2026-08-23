# Lanka Talent Insights

Lanka Talent Insights is a React recruitment workspace for reviewing CVs,
comparing candidates with job descriptions, and exploring employee-retention
scenarios. The UI remains the existing React/Vite application; document parsing,
model inference, and attrition calculations now run behind an API Gateway.

## Structure

```text
frontend/                         React + Vite UI
backend/api-gateway/              public Express gateway on :8080
backend/services/cv-extraction-service/  PDF/DOCX/TXT extraction on :4001
backend/services/cv-matching-service/    Transformers.js model on :4002
backend/services/cv-profile-analysis-service/  explainable CV competency analysis on :4007
backend/services/resume-strength-model-service/ local DeBERTa strength model on :4009
backend/services/attrition-service/       attrition API/orchestrator on :4003
backend/services/attrition-model-service/ local CatBoost V7 model on :4008
backend/services/speech-to-text-service/  local Whisper transcription on :4005
backend/services/job-service/              jobs and applications on :4004
backend/services/interview-analysis-service/ local NLI answer analysis on :4006
backend/services/interview-answer-model-service/ supplied V2 answer scorer on :4010
backend/services/auth-service/            existing auth support service
backend/services/candidate-service/        existing profile support service
docker-compose.yml                local container topology
ARCHITECTURE.md                   request and deployment flow
```

The auth and candidate services remain to preserve the existing account and
profile routes. They persist their service-owned data in MongoDB collections.
The retired resume/matching remote adapters and unused AI service scaffolds
were removed.

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- Python 3.11 or newer
- Docker Desktop for the container workflow
- Internet access the first time the matching, speech-to-text, and interview
  NLI models download

## Local setup

```powershell
npm install
npm run install:all
npm run dev
```

`npm run dev` starts the frontend, gateway, extraction, matching, local resume-strength
model, the supplied interview-answer model, CatBoost model, attrition API, local
speech-to-text, interview analysis, and existing auth/profile support services. Auth and profile persistence use
the `MONGODB_URI` and `MONGODB_DB_NAME` values in the root `.env` file.

`npm run install:all` also installs the Python packages from the speech-to-text
and local attrition-model requirements files. If dependencies were installed
separately, run `npm run install:speech-to-text` and
`npm run install:attrition-model` once.

`npm run install:resume-strength-model` installs the Python dependencies for the
supplied local model. The extracted model files live in
`backend/services/resume-strength-model-service/model/` and are loaded once at
service startup. Keep that directory when running locally or building Docker;
it is ignored by Git because the weights are large.

`npm run install:interview-answer-model` installs the Python dependencies for the
supplied `Final_Interview_Answer_Scoring_Model_V2` checkpoint. Its runtime files
live in `backend/services/interview-answer-model-service/model/` and are ignored
by Git because the checkpoint is large. The ZIP must be extracted there before
starting the service; the supplied ZIP has already been copied into that folder
in this local workspace.

The frontend reads `frontend/.env` when present. Start from
`frontend/.env.example`; the default is `VITE_API_BASE_URL=http://localhost:8080`.
The root `.env` provides MongoDB Atlas and server settings for local services
and Docker Compose. Each backend service also has its own `.env.example`.
Never commit a real `.env` file or credentials.

The local attrition model uses two runtime files that are intentionally ignored
by Git: `backend/services/attrition-model-service/attrition_risk_catboost_v7_optuna.joblib`
and `Sri_Lankan_Hiring_Attrition_Dataset.csv`. Copy those two files from the
provided Downloads folder into that service directory before starting the
model. No Hugging Face hosting or token is required for this attrition model.

The gateway protects normal API traffic with `RATE_LIMIT_MAX`. The local
same-device interview demo uses a separate `ROOM_RATE_LIMIT_MAX` allowance
because its video-frame and media-handoff polling is intentionally more
frequent. The default room allowance is 1200 requests per minute.

## Docker

```powershell
docker compose up --build
```

Open http://localhost:5173. The matching container downloads
`Gehan77/cv-match-browser` on first startup and loads it once for the process.
The speech-to-text container downloads the local `faster-whisper` model once
and keeps it in the `whisper-model-cache` volume.

## Ports

| Component | Port |
| --- | ---: |
| Frontend | 5173 |
| API Gateway | 8080 |
| CV extraction service | 4001 |
| CV matching service | 4002 |
| CV profile analysis service | 4007 |
| Resume strength model service | 4009 |
| Attrition API service | 4003 |
| Local CatBoost attrition model | 4008 |
| Speech-to-text service | 4005 |
| Job and application service | 4004 |
| Interview analysis service | 4006 |
| Interview answer model service | 4010 |
| Auth support service | 3001 |
| Candidate/profile support service | 3002 |
| MongoDB Atlas | external connection from `MONGODB_URI` |

## API

Additional CV intelligence endpoints are `POST /api/cv/analyze` and
`GET /api/cv/analysis/me`. Admins can request one application analysis with
`POST /api/admin/applications/:applicationId/cv-analysis`.

The internal resume-strength service exposes `GET /health`, `POST /predict`,
and `POST /predict/batch` on port 4009. It is called by CV Profile Analysis;
React does not call this model service directly.

All public application calls go through the gateway:

- `POST /api/interviews/:interviewId/transcribe` — admin-only local audio segment transcription
- `GET /api/health`
- `POST /api/cv/extract` — authenticated multipart field `file`; PDF, DOCX, and TXT; max 15 MB
- `POST /api/match/score` — `{ job, candidate }`
- `POST /api/attrition/predict` — `{ candidate, simulation }`
- `GET /api/candidates/profiles/me` — authenticated user profile and saved CV
- `PUT /api/candidates/profiles/me` — authenticated profile/CV update
- `GET /api/admin/jobs` — authenticated admin job list
- `POST /api/admin/jobs` — authenticated admin job post creation
- `PATCH /api/admin/jobs/:jobId` — authenticated admin job update
- `GET /api/admin/applications` — authenticated admin application list
- `PATCH /api/admin/applications/:applicationId` — authenticated admin pipeline status update
- `GET /api/admin/interviews` — authenticated admin interview schedule
- `POST /api/admin/interviews` — authenticated admin interview creation; a first-party room is created from the interview id
- `PATCH /api/admin/interviews/:interviewId` — authenticated admin schedule or cancellation update
- `GET /api/jobs` — authenticated open jobs for candidates
- `POST /api/jobs/:jobId/applications` — authenticated candidate application submission
- `GET /api/applications/me` — authenticated candidate's own applications
- `GET /api/interviews/me` — authenticated candidate's upcoming and past interview schedule
- `GET /api/interviews/:interviewId/room` — authenticated participant room state
- `POST /api/interviews/:interviewId/room/offer` — authenticated WebRTC room offer
- `POST /api/interviews/:interviewId/room/answer` — authenticated WebRTC room answer
- `GET /api/interviews/:interviewId/transcript` — authenticated participant transcript
- `POST /api/interviews/:interviewId/transcript` — append an authenticated participant transcript line

- `POST /api/interviews/:interviewId/analysis` - admin-only Complete Answer Analyzer with optional reference answers
- `GET /api/interviews/:interviewId/analysis` - admin-only saved question-by-question analysis

Scheduled interviews use one first-party WebRTC room for the admin and the
applicant. No external meeting provider, account, or meeting URL is required.
The candidate sees the schedule under `My interviews`, can export an `.ics`
calendar event, and can open the same private room from the schedule. Two
people cannot use two independent microphones on one physical device; use
separate devices or headphones, or keep one participant's microphone muted.

The current room is a first-party WebRTC room coordinated through the Job
Service and the Gateway. It uses REST signaling so two separate browser
sessions can join the same interview on localhost. The interviewer microphone
is split into two local paths: WebRTC sends live audio to the candidate, while
short audio segments are uploaded to the local speech-to-text service. That
service runs `faster-whisper` once at startup; the returned text is saved in
MongoDB through the Job Service, so both Admin and Candidate see the same
transcript. The default local model is `tiny`; set `WHISPER_MODEL_SIZE=base`
for better accuracy on a faster machine.

## Complete Answer Analyzer

The admin interview room includes an additive analysis panel. After transcript
lines exist, choose `Analyze interview`. The service pairs interviewer
questions with the following candidate turns and returns question relevance,
reference-answer match, key-concept coverage, NLI entailment/contradiction
signals, incorrect-concept warnings, response time, answer duration, filler
word counts, and analysis confidence. Admins can add an optional reference
answer for each detected question and refresh the analysis.

For every answered question, the analysis service also sends the exact question,
reference answer, and candidate answer to the local Python
`interview-answer-model-service` on port 4010. That service loads the supplied
V2 DeBERTa checkpoint once at startup and applies its saved calibration and
optimized thresholds. The saved result contains the real `0-100` score,
`Wrong/Poor/Average/Good/Excellent` rating, confidence, and class probabilities.
The UI uses this model score as the answer score and keeps the existing NLI
metrics alongside it. If the model service is unavailable, no fake score is
created: the saved result marks the model as unavailable and shows the existing
NLI fallback explicitly.

Without a supplied reference answer, the service labels the result as
`job-context` and derives expected concepts from the job skills. It does not
claim technical correctness when evidence is insufficient; those answers are
marked for review. The existing CV matching model is not reused for interview
evaluation.

Each backend service also exposes `GET /health`. Matching, speech-to-text, and
interview analysis health include `modelLoaded`. Errors use `{ success: false, message, requestId }` and may
include a development-only technical `error` field.

## Matching model

The CV matching service uses `@huggingface/transformers` server-side with
`Gehan77/cv-match-browser`. It formats the existing job and candidate fields,
tokenizes the job text and candidate text as a BERT sequence pair, runs the
sequence-classification model once loaded at startup, applies sigmoid to the
single output logit, and compares the probability with
`0.4399277865886688`. No score is generated when the model is unavailable.

## CV profile intelligence

The CV profile analysis service is separate from the Hugging Face match score.
The parser extracts name, education, experience entries, projects, skills,
certifications, explicit skill durations, project usage, complexity, candidate
role, relevance to the selected vacancy, and recommended job categories. Each
detected skill is then sent with its project and professional-experience
context to the supplied local DeBERTa model. The analysis stores the real
project-strength, skill-evidence, and experience/project-alignment scores and
derives the skill proficiency level from the model evidence score. If the model
is unavailable, the service keeps the transparent parser result and marks the
model status as unavailable; it never invents a model score. The result is
saved with the candidate profile and copied into an application snapshot, so a
later CV upload does not rewrite an older application.

## Local attrition model

The local `attrition-model-service` loads the supplied
`attrition_risk_catboost_v7_optuna.joblib` artifact once at startup. It
reproduces the notebook's seven engineered features, uses the saved 0.33
threshold, and returns the real CatBoost probability. The Node
`attrition-service` on port 4003 forwards each `/predict` request to it when
`ATTRITION_MODEL_SERVICE_URL` is configured. If that variable is empty, the
existing transparent rule-based calculation remains available as a fallback.

The UI's salary and scenario controls send `{ candidate, simulation }` again
after each change. When the candidate does not contain all 45 training inputs,
the local adapter maps the available CV/scenario values and imputes the
remaining fields from the supplied training dataset; the response includes
`inputCoverage` and `imputedFeatures` so the result is not presented as a
complete CV-derived prediction.

## Admin workspace

Accounts registered with the valid `ADMIN_INVITE_CODE` are routed to a separate
admin workspace instead of the candidate CV profile. Admins can publish jobs,
see real applications saved in MongoDB, and move applications through New,
Reviewing, Shortlisted, Rejected, and Hired stages. The job service owns the
`jobs` and `applications` collections; it does not create placeholder
applications or fake candidate data.

When a candidate applies, the Gateway sends the job and the candidate's saved
CV fields to the server-side Hugging Face matching service. The real
probability, percentage, threshold, and classification are saved with the
application and shown in the admin application pipeline. Older applications
without a score are scored and backfilled when an admin opens the pipeline.
