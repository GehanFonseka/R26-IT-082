# Lanka Talent Insights — AGENTS.md

## 1. Project Overview

Lanka Talent Insights is a microservices-based AI recruitment decision-support platform.

The system contains four main AI modules:

1. Resume Parsing & Skill Analysis
2. Job–Candidate Matching
3. Interview Evaluation
4. Hiring Attrition & Retention Decision Support

The platform also includes authentication, authorization, API Gateway routing, centralized logging, monitoring, and shared recruitment data management.

## 2. Core Architecture

```text
React Frontend
      |
      v
API Gateway
      |
      +--> Authentication Service
      |
      +--> Resume Parsing Service
      |        |
      |        +--> Resume AI Model Service
      |
      +--> Job Matching Service
      |        |
      |        +--> Matching AI Model Service
      |
      +--> Interview Service
      |        |
      |        +--> Interview AI Model Service
      |
      +--> Attrition Service
      |        |
      |        +--> Attrition AI Model Service
      |
      +--> Candidate Service
      +--> Job Service
      +--> Logging Service
```

Frontend services must never directly communicate with internal backend microservices.

All backend requests must go through the API Gateway.

## 3. Technology Rules

Frontend:

* React
* Vite
* JavaScript
* Plain CSS only
* React Router
* Axios or Fetch API
* Lucide React may be used for icons

Do NOT use:

* Tailwind CSS
* Bootstrap
* Material UI
* Styled Components
* CSS-in-JS

Backend services may use Node.js/Express unless an existing service already uses another approved technology.

AI model services may use Python/FastAPI when Python inference is required.

## 4. Critical File Size Rule

No source-code file should exceed 150 lines.

Target:

* Prefer 50–120 lines per file.
* Absolute maximum: 150 lines.

If a file approaches 150 lines:

* Extract components.
* Extract hooks.
* Extract utilities.
* Extract services.
* Extract constants.
* Extract validation logic.

Do not keep large components in one file.

## 5. Frontend Structure

```text
frontend/
├── src/
│   ├── components/
│   │   ├── common/
│   │   ├── layout/
│   │   ├── auth/
│   │   ├── resume/
│   │   ├── matching/
│   │   ├── interview/
│   │   └── attrition/
│   ├── pages/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── resume/
│   │   ├── matching/
│   │   ├── interview/
│   │   └── attrition/
│   ├── services/
│   │   ├── apiClient.js
│   │   ├── authService.js
│   │   ├── resumeService.js
│   │   ├── matchingService.js
│   │   ├── interviewService.js
│   │   └── attritionService.js
│   ├── hooks/
│   ├── context/
│   ├── utils/
│   ├── constants/
│   ├── routes/
│   ├── data/
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── public/
├── package.json
└── vite.config.js
```

## 6. React Component CSS Rule

Every visual React component must have its own CSS file.

Example:

```text
AttritionRiskCard.jsx
AttritionRiskCard.css

CandidateHeader.jsx
CandidateHeader.css

Sidebar.jsx
Sidebar.css
```

Each component imports its own CSS:

```javascript
import "./AttritionRiskCard.css";
```

Use `index.css` only for:

* resets
* global typography
* CSS variables
* body/root styles

Use `App.css` only for application-shell styles.

## 7. Backend Structure

```text
backend/
├── api-gateway/
├── services/
│   ├── auth-service/
│   ├── candidate-service/
│   ├── job-service/
│   ├── resume-service/
│   ├── matching-service/
│   ├── interview-service/
│   ├── attrition-service/
│   └── logging-service/
├── ai-services/
│   ├── resume-model-service/
│   ├── matching-model-service/
│   ├── interview-model-service/
│   └── attrition-model-service/
├── shared/
│   ├── middleware/
│   ├── constants/
│   ├── validation/
│   └── utils/
└── docker/
```

Each microservice must remain independently deployable.

## 8. API Gateway

The API Gateway is the single external backend entry point.

Example routes:

```text
/api/auth/*
/api/candidates/*
/api/jobs/*
/api/resume/*
/api/matching/*
/api/interview/*
/api/attrition/*
```

Responsibilities:

* request routing
* authentication verification
* authorization
* request IDs
* CORS
* rate limiting
* centralized error handling
* logging metadata

Do not place business logic or ML logic inside the Gateway.

## 9. Authentication Service

Authentication must be isolated in `auth-service`.

Support:

* recruiter registration
* login
* logout
* JWT access token
* refresh token if required
* password hashing
* role-based authorization

Never store plain-text passwords.

Frontend authentication state must be handled separately from recruitment/module state.

## 10. AI Service Separation

Each AI component must have its own model/inference boundary.

Never combine all AI models into one large service.

Expected separation:

* Resume model → resume-model-service
* Matching model → matching-model-service
* Interview model → interview-model-service
* Attrition model → attrition-model-service

Business orchestration stays in the corresponding application service.

## 11. Module Data Flow

```text
Resume Parsing
      ↓
Candidate Skills / Experience / Education
      ↓
Job Matching
      ↓
Match Score / Similarity / Skill Gaps
      ↓
Interview Evaluation
      ↓
Technical / Communication / Behaviour Scores
      ↓
Hiring Attrition
      ↓
Risk / Probability / Recommendations
      ↓
Recruiter Decision
```

Persist module outputs using candidate/application IDs so later services can retrieve previous results.

## 12. Attrition Model Integration

Current hosted model:

```text
https://gehan77-lanka-talent-insights.static.hf.space/api-client.js
```

It is a browser-side ESM/ONNX integration, not a REST `/predict` API.

Current classification threshold:

```text
0.393
```

Exact model features:

* SalaryGapRisk
* CompanySwitchRate
* LowMatchRisk
* LowSimilarityRisk
* LowInterviewRisk
* NoticeRisk
* LocationWorkRisk
* TrainingRisk
* MentorshipRisk
* CareerDevelopmentRisk
* CertificationRisk

Never change feature order, formulas, or threshold without retraining and validating the model.

## 13. Logging

Every service must produce structured logs.

Log:

* timestamp
* service name
* request ID
* endpoint
* HTTP method
* status
* execution duration
* safe error details

Never log:

* passwords
* access tokens
* refresh tokens
* private credentials

Use the same request ID across Gateway and downstream services for traceability.

## 14. Service Internal Pattern

Prefer:

```text
service/
├── src/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── repositories/
│   ├── middleware/
│   ├── models/
│   ├── validation/
│   ├── utils/
│   └── app.*
├── tests/
├── .env.example
└── package.json / requirements.txt
```

Do not mix routes, database access, model inference, and business logic in one file.

## 15. Frontend API Rule

React components must not contain raw backend request logic.

Use:

```text
Component
   ↓
Service file
   ↓
apiClient
   ↓
API Gateway
```

Example:

```javascript
attritionService.predict(candidateData)
```

not a large `fetch()` block inside JSX.

## 16. Environment Variables

Never hardcode environment-specific URLs or secrets.

Frontend example:

```text
VITE_API_GATEWAY_URL=
VITE_ATTRITION_MODEL_CLIENT_URL=
```

Backend examples:

```text
PORT=
JWT_SECRET=
DATABASE_URL=
LOG_LEVEL=
```

Commit `.env.example`, never real `.env` secrets.

## 17. Error Handling

Every service must use consistent error responses.

Example:

```json
{
  "success": false,
  "message": "Unable to process attrition prediction",
  "requestId": "..."
}
```

Frontend must display friendly messages and keep technical errors in developer logs.

## 18. UI Rules

Build a professional recruitment SaaS interface.

Use:

* clean white cards
* neutral background
* subtle borders
* consistent spacing
* accessible forms
* responsive Grid/Flexbox
* readable typography

Avoid:

* oversized gradients
* excessive animations
* excessive emojis
* neon styling

Risk information must include text, not color alone.

## 19. Code Quality

Follow these rules:

* one responsibility per component/function
* reusable components
* reusable API services
* no duplicate logic
* no giant App.jsx
* no giant CSS files
* no inline CSS except truly dynamic values
* meaningful naming
* small functions
* comments only where logic is not obvious

## 20. Testing

Test:

* authentication
* route protection
* API services
* feature calculations
* model integration
* validation
* critical recruiter workflows

Run before completion:

```text
npm run lint
npm run test
npm run build
```

Also test individual backend services.

## 21. Definition of Done

A feature is complete only when:

* implementation works
* file size remains under 150 lines
* component has its own CSS
* API calls use service layer
* Gateway architecture is respected
* authentication is respected
* errors are handled
* logging is included
* tests pass
* production build succeeds

Never bypass architecture rules merely to complete a feature faster.
