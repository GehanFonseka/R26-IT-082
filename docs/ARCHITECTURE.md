# 🏗️ System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   CLIENT LAYER                          │
│            React + TypeScript Frontend                  │
│         (Components, Pages, Services, Context)          │
└──────────────────────────┬──────────────────────────────┘
                          │
                    HTTPS/REST API
                          │
┌──────────────────────────▼──────────────────────────────┐
│               API LAYER (Express.js)                    │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Routes → Controllers → Services → Models          │ │
│  │ Middlewares: Auth, Validation, Error Handling     │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
   DATABASE         FILE STORAGE       AI/ML SERVICES
   (MongoDB)        (Local/Cloud)      (Resume Parser,
                                       Matching Algo,
                                       Risk Prediction)
```

## Technology Stack

### Frontend
- **Framework**: React 19.x
- **Language**: TypeScript
- **Build Tool**: Vite
- **UI Framework**: Tailwind CSS
- **State Management**: Context API
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Charts**: Recharts

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: JavaScript (ES Modules)
- **Database**: MongoDB 7.0+
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Validation**: Express Validator
- **Security**: bcryptjs, CORS, Helmet

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Database**: MongoDB (local or Atlas)
- **File Storage**: Local filesystem (upgradeable to S3/Azure)

## Directory Structure

```
Backend/
├── config/           # Database, environment configuration
├── controllers/      # Request handlers (10-15 lines each)
├── models/          # MongoDB schemas (User, Candidate, Job, etc.)
├── routes/          # API endpoint definitions
├── services/        # Business logic (matching, parsing, etc.)
├── middlewares/     # Auth, validation, error handling
├── ai-modules/      # AI integrations
├── constants/       # App-wide constants
├── types/           # TypeScript type definitions
├── tests/           # Unit and integration tests
├── scripts/         # Database seed, migrations
├── utils/           # Helper functions
└── uploads/         # File storage directory

Frontend/
├── src/
│   ├── components/  # Reusable UI components
│   ├── pages/       # Full page components
│   ├── services/    # API communication
│   ├── context/     # React context (Auth, Global State)
│   ├── hooks/       # Custom React hooks
│   ├── types/       # TypeScript interfaces
│   ├── constants/   # App constants
│   ├── utils/       # Helper functions
│   ├── assets/      # Images, fonts, icons
│   └── App.tsx      # Root component
├── public/          # Static files
└── vite.config.ts   # Build configuration
```

## Data Flow

### 1. Authentication Flow
```
User Input
    ↓
[Login Page Component]
    ↓
[authService.login()] → API Call
    ↓
Backend: authController.login()
    ↓
[JWT Token Generated]
    ↓
Token stored in Context + localStorage
    ↓
Redirect to Dashboard
```

### 2. Job Application Flow
```
Candidate selects job
    ↓
[Job Details Page]
    ↓
Submit Application
    ↓
[applicationService.apply()]
    ↓
Backend: applicationController.create()
    ↓
[Matching Algorithm runs]
    ↓
Score calculated & stored
    ↓
Application saved to DB
    ↓
Success notification
```

### 3. Resume Processing Flow
```
Candidate uploads resume
    ↓
[Resume Upload Component]
    ↓
File validation (type, size)
    ↓
Multipart form upload
    ↓
Backend: resumeParserService.parse()
    ↓
[Extract skills, experience, education]
    ↓
Profile updated
    ↓
Confirmation response
```

## API Layer Design

### Request/Response Pattern

```typescript
// Request
POST /api/candidates/:id/update-profile
Content-Type: application/json
Authorization: Bearer {token}

{
  "skills": ["Node.js", "React"],
  "experience": 5,
  "education": [...]
}

// Response (Success)
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { ... },
  "statusCode": 200
}

// Response (Error)
{
  "success": false,
  "message": "Invalid request",
  "error": "Skills array is required",
  "statusCode": 400
}
```

### Error Handling Strategy

```
API Error
    ↓
[Error Middleware]
    ↓
Normalize error format
    ↓
Log error with context
    ↓
Send response to client
    ↓
[Client catches error]
    ↓
Display user-friendly message
```

## Security Architecture

```
┌─────────────────────┐
│   Request comes in  │
└──────────┬──────────┘
           │
    ┌──────▼──────┐
    │ CORS Check  │ ← Only allowed origins
    └──────┬──────┘
           │
    ┌──────▼──────────────┐
    │ Auth Middleware     │ ← Verify JWT token
    └──────┬──────────────┘
           │
    ┌──────▼──────────────┐
    │ Validation          │ ← Sanitize & validate input
    └──────┬──────────────┘
           │
    ┌──────▼──────────────┐
    │ Role Check          │ ← Verify user role
    └──────┬──────────────┘
           │
    ┌──────▼──────────────┐
    │ Business Logic      │ ← Process request
    └──────┬──────────────┘
           │
    ┌──────▼──────────────┐
    │ Response            │
    └─────────────────────┘
```

## Database Schema Relationships

```
Users (1) ──────────── (N) Applications
   │
   ├── (1) ──── (N) CandidateProfile
   ├── (1) ──── (N) Interview
   └── (1) ──── (N) Vacancy (if recruiter)

Vacancies (1) ──────────── (N) Applications
      │
      └── (1) ──── (N) Interview

Applications (1) ──────────── (N) Interview

Candidates (1) ──────────── (N) RiskPrediction
```

## Scalability Considerations

### Horizontal Scaling
- Stateless API servers (load balanced)
- Session storage in cache (Redis)
- Database replicas for read operations

### Vertical Scaling
- Database indexing on common queries
- Connection pooling
- Caching strategies

### Monitoring
- Application logs (Winston/Morgan)
- Performance metrics (APM)
- Database monitoring
- Error tracking (Sentry)

---

**Version**: 1.0 | **Last Updated**: May 2024
