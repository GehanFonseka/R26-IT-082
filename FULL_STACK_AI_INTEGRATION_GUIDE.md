# Full-Stack AI-Powered Intelligent Talent Acquisition System

## System Overview

This document describes the complete integration of 4 AI modules into a full-stack talent acquisition platform. The system processes candidates through multiple AI stages: resume parsing → skill matching → interview evaluation → risk prediction → dashboard analytics.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React 19 + TypeScript)                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │  Candidate Flow  │  │  Recruiter Flow  │  │   Dashboard UI   │ │
│  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤ │
│  │ • Dashboard      │  │ • Dashboard      │  │ • Statistics     │ │
│  │ • ProfileUpload  │  │ • Candidates     │  │ • Charts         │ │
│  │ • Interview      │  │ • Applications   │  │ • Analytics      │ │
│  │ • Results        │  │ • Vacancies      │  │ • Insights       │ │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘ │
│         ↓                     ↓                      ↓             │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │         aiService.ts (Centralized API Layer)                │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │ • parseResume()              [Module 1]                     │ │
│  │ • getMatchScore()            [Module 2]                     │ │
│  │ • evaluateInterview()        [Module 3]                     │ │
│  │ • predictRisk()              [Module 4]                     │ │
│  └──────────────────────────────────────────────────────────────┘ │
│         ↓                     ↓                      ↓             │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │      AI Component Library (Visualizations)                  │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │ • SkillAnalysisCard         [Module 1 Output]              │ │
│  │ • MatchScoreCard            [Module 2 Output]              │ │
│  │ • InterviewEvaluationCard   [Module 3 Output]              │ │
│  │ • RiskPredictionCard        [Module 4 Output]              │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                           ↓                                        │
├─────────────────────────────────────────────────────────────────────┤
│                  AXIOS (HTTP REST API Client)                       │
├─────────────────────────────────────────────────────────────────────┤
│                           ↓                                        │
│  /api/resume/parse | /api/matching/calculate | /api/interview/eval  │
│  /api/risk/predict | /api/dashboard/recruiter | /api/applications   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   BACKEND (Node.js + Express)                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              Route Layer (API Endpoints)                    │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │ applicationsRoutes.js  | interviewRoutes.js                │ │
│  │ candidateRoutes.js     | riskRoutes.js                     │ │
│  │ authRoutes.js          | dashboardRoutes.js                │ │
│  └──────────────────────────────────────────────────────────────┘ │
│         ↓                                                          │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │            Controller Layer (Business Logic)                │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │ candidateController.js     (Resume Upload → Module 1)       │ │
│  │ applicationController.js   (Apply for Job → Modules 2, 4)   │ │
│  │ interviewController.js     (Interview Eval → Module 3)      │ │
│  │ riskController.js          (Risk Prediction → Module 4)     │ │
│  │ dashboardController.js     (Analytics Aggregation)          │ │
│  └──────────────────────────────────────────────────────────────┘ │
│         ↓                                                          │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │           AI Modules Layer (Pure AI Logic)                  │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │ resumeParsingAI.js (Module 1)                               │ │
│  │ • parseResumeFile(filePath)                                │ │
│  │ • extractStructuredData(text)                              │ │
│  │ • calculateSkillScore(skills)                              │ │
│  │ • getSkillRecommendations(currentSkills)                   │ │
│  │                                                              │ │
│  │ matchingAI.js (Module 2)                                    │ │
│  │ • calculateMatchScoreWithExplanation(candidate, job)       │ │
│  │ • rankCandidatesForJob(candidates, job)                    │ │
│  │ • getTopCandidates(candidates, job, topN)                  │ │
│  │                                                              │ │
│  │ interviewEvaluationAI.js (Module 3)                         │ │
│  │ • evaluateInterviewResponse(interview)                     │ │
│  │ • generateInterviewQuestions(jobTitle)                     │ │
│  │ • calculateDimensionalScores(responses)                    │ │
│  │                                                              │ │
│  │ riskPredictionAI.js (Module 4)                              │ │
│  │ • predictHiringRisk(candidate, job, historicalData)        │ │
│  │ • calculateRiskFactors(candidate, job)                     │ │
│  │ • predictAttrition(candidate, job)                         │ │
│  └──────────────────────────────────────────────────────────────┘ │
│         ↓                                                          │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │            Service Layer (Data Processing)                  │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │ resumeParserService.js | matchingService.js                │ │
│  │ interviewService.js    | riskService.js                    │ │
│  └──────────────────────────────────────────────────────────────┘ │
│         ↓                                                          │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              Model Layer (Data Schema)                      │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │ User.js          | CandidateProfile.js                      │ │
│  │ Application.js   | Interview.js                             │ │
│  │ Vacancy.js       | RiskPrediction.js                        │ │
│  └──────────────────────────────────────────────────────────────┘ │
│         ↓                                                          │
└─────────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────────┐
│                  DATABASE (MongoDB Atlas)                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐   │
│  │  users           │ │  candidates      │ │  vacancies       │   │
│  ├──────────────────┤ ├──────────────────┤ ├──────────────────┤   │
│  │ • _id            │ │ • _id            │ │ • _id            │   │
│  │ • email          │ │ • userId         │ │ • title          │   │
│  │ • password       │ │ • resume (file)  │ │ • description    │   │
│  │ • role           │ │ • skillAnalysis  │ │ • requirements   │   │
│  │ • createdAt      │ │ • experience     │ │ • experience     │   │
│  │                  │ │ • education      │ │ • salary         │   │
│  │                  │ │ • skillScore (1) │ │ • skills         │   │
│  │                  │ │ • createdAt      │ │ • createdAt      │   │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘   │
│                                                                     │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐   │
│  │  applications    │ │  interviews      │ │  riskpredictions │   │
│  ├──────────────────┤ ├──────────────────┤ ├──────────────────┤   │
│  │ • _id            │ │ • _id            │ │ • _id            │   │
│  │ • candidateId    │ │ • applicationId  │ │ • candidateId    │   │
│  │ • jobId          │ │ • questions []   │ │ • jobId          │   │
│  │ • matchScore (2) │ │ • answers []     │ │ • riskScore (4)  │   │
│  │ • matchDetails   │ │ • evaluations[]  │ │ • riskLevel      │   │
│  │ • interviewScore │ │ • overallScore   │ │ • factors []     │   │
│  │ • interviewResult│ │ • result: pass   │ │ • strategies[]   │   │
│  │ • riskLevel (4)  │ │ • feedback       │ │ • attrition %    │   │
│  │ • riskScore      │ │ • createdAt      │ │ • tenure (months)│   │
│  │ • status         │ │                  │ │ • confidence     │   │
│  │ • createdAt      │ │                  │ │ • createdAt      │   │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow by Module

### Module 1: Resume Parsing & Skill Analysis

**Trigger**: Candidate uploads resume

**Flow**:
```
1. Frontend: Candidate clicks "Upload Resume"
   ↓
2. Frontend: candidateService.uploadResume(file) → aiService.parseResume(file)
   ↓
3. Backend: POST /api/resume/upload
   ↓
4. Controller: candidateController.createOrUpdateProfile()
   ↓
5. AI Module: resumeParsingAI.parseResumeFile(filePath)
   • Extract text from PDF/DOCX using pdf-parse & mammoth
   • Extract: name, email, skills, experience, education
   ↓
6. AI Module: resumeParsingAI.extractStructuredData(text)
   • Identify 60+ skills across 8 categories
   • Map proficiency levels (advanced/intermediate/beginner)
   • Extract years of experience & level
   • Extract education & certifications
   ↓
7. AI Module: resumeParsingAI.calculateSkillScore(skills)
   • Score 0-100 based on:
     - Number of skills (20%)
     - Proficiency levels (30%)
     - Skill relevance (30%)
     - Experience years (20%)
   ↓
8. AI Module: resumeParsingAI.getSkillRecommendations(currentSkills)
   • Identify skill gaps
   • Suggest growth paths
   • Recommend relevant skills to learn
   ↓
9. Database: Store in CandidateProfile
   {
     skillAnalysis: {
       skillScore: 75,
       experienceLevel: "senior",
       skills: [
         { name: "React", proficiency: "advanced" },
         { name: "Node.js", proficiency: "advanced" },
         ...
       ],
       skillRecommendations: [...],
       categoryBreakdown: {
         programming_languages: [...],
         frontend_frameworks: [...]
       }
     }
   }
   ↓
10. Frontend: SkillAnalysisCard renders results with:
    • Skill score gauge (0-100)
    • Experience level badge
    • Top 8 skills with proficiency colors
    • Skill recommendations with growth paths
    • Skills organized by category
```

**Key Functions**:
- `parseResumeFile(filePath)` → text extraction
- `extractStructuredData(text)` → skill identification
- `calculateSkillScore(skills)` → 0-100 score
- `getSkillRecommendations(currentSkills)` → growth paths

**API**: `POST /api/resume/upload` → `POST /api/candidates/profile`

---

### Module 2: Job-Candidate Matching

**Trigger**: Candidate applies for job

**Flow**:
```
1. Frontend: Candidate clicks "Apply"
   ↓
2. Frontend: applicationService.applyForJob(jobId, candidateId)
   ↓
3. Backend: POST /api/applications
   ↓
4. Controller: applicationController.applyForJob()
   ↓
5. AI Module: matchingAI.calculateMatchScoreWithExplanation(candidate, job)
   • Compare 6 dimensions:
     - Skills Match (35% weight)
     - Experience (25% weight)
     - Education (15% weight)
     - Location (10% weight)
     - Salary (10% weight)
     - Cultural Fit (5% weight)
   ↓
   Score Calculation for each dimension:
   • Skills: intersection(candidateSkills, jobSkills) / jobSkills.length
   • Experience: yearsExperience match vs jobRequirement
   • Education: degree level match vs jobRequirement
   • Location: candidate location vs job location
   • Salary: candidate expectation vs job range
   • Cultural Fit: role suitability + career goals alignment
   ↓
6. AI Module: Return comprehensive match result:
   {
     overall_score: 82,
     match_level: "strong",  // excellent(≥85), strong(≥70), moderate(≥55), weak(≥40), poor(<40)
     confidence: 0.92,
     dimensions: {
       skills: { score: 90, explanation: "9/10 required skills matched" },
       experience: { score: 75, explanation: "5 years vs 5 required" },
       education: { score: 85, explanation: "Bachelor's vs Bachelor's required" },
       location: { score: 60, explanation: "Remote possible, 40km commute" },
       salary: { score: 80, explanation: "180k vs 160-200k range" },
       cultural_fit: { score: 70, explanation: "Startup experience matches" }
     },
     top_matched_skills: ["React", "Node.js", "MongoDB"],
     skill_gaps: ["Docker", "AWS"],
     summary: "Strong technical fit with minor gaps in DevOps skills"
   }
   ↓
7. Database: Store in Application
   {
     matchScore: 82,
     matchLevel: "strong",
     matchScoreDetails: {
       overall_score: 82,
       dimensions: {...},
       confidence: 0.92
     }
   }
   ↓
8. Frontend: MatchScoreCard renders:
   • Animated score gauge (0-100)
   • Match level badge with color
   • 6 dimension breakdown with progress bars
   • Matched skills vs skill gaps
   • Confidence percentage
```

**Key Functions**:
- `calculateMatchScoreWithExplanation(candidate, job)` → score + explanation
- `rankCandidatesForJob(candidates, job)` → sorted list
- `getTopCandidates(candidates, job, topN)` → top N candidates

**API**: `POST /api/applications` → `GET /api/applications/job/:jobId/ranked`

---

### Module 3: Interview Evaluation

**Trigger**: After shortlisting, recruiter schedules interview

**Flow**:
```
1. Frontend: Interview page loads with questions
   ↓
2. Frontend: Displays interview UI with:
   • Question display (text, MCQ, or video)
   • Timer for each question
   • Progress sidebar
   • Navigation buttons
   ↓
3. Candidate: Answers all questions
   • Text: Open-ended responses
   • MCQ: Single choice selection
   • Video: Record response (10-120 seconds)
   ↓
4. Frontend: submitInterviewAnswers(interviewId, answers)
   ↓
5. Backend: POST /api/interview/submit
   ↓
6. Controller: interviewController.submitAnswers()
   • Map each answer to evaluation request
   • Call Module 3 for each response
   ↓
7. AI Module: interviewEvaluationAI.evaluateInterviewResponse(interview)
   ↓
   For each answer, evaluate 5-7 dimensions:
   • Communication (clarity, articulation, flow)
   • Confidence (certainty, hesitation detection, eye contact)
   • Clarity (conciseness, structure, logical flow)
   • Relevance (addresses question, on-topic)
   • Completeness (thorough, covers all aspects)
   • [For Video Only] Eye Contact (looking at camera)
   • [For Video Only] Gestures (professional, engaged)
   ↓
   Scoring per dimension (0-100):
   • Communication: analyze speech patterns, vocabulary, articulation
   • Confidence: detect hesitation markers, speaking pace
   • Clarity: measure response length, structure, coherence
   • Relevance: semantic similarity to expected answers
   • Completeness: check coverage of key points
   ↓
8. AI Module: Calculate Overall Score & Result
   {
     overallScore: 72,
     result: "pass",  // pass (≥60), fail (<60)
     evaluations: [
       {
         questionIndex: 0,
         question: "What is React?",
         answer: "A JavaScript library...",
         scores: {
           communication: 75,
           confidence: 70,
           clarity: 78,
           relevance: 85,
           completeness: 72
         },
         feedback: {
           strengths: ["Good technical understanding"],
           improvements: ["Could elaborate more on benefits"]
         }
       },
       ...
     ],
     feedback: {
       strengths: ["Good communication skills", "Technical knowledge"],
       improvements: ["Work on speaking confidence", "More examples"],
       summary: "Good technical fit with communication room for improvement"
     },
     recommendation: "Move to next round"
   }
   ↓
9. Database: Store in Interview & Application
   {
     Interview: {
       evaluations: [...],
       overallScore: 72,
       result: "pass",
       feedback: {...}
     },
     Application: {
       interviewScore: 72,
       interviewResult: "pass",
       status: "interview_passed"
     }
   }
   ↓
10. Frontend: InterviewEvaluationCard renders:
    • Large pass/fail result with color coding
    • Overall score percentage
    • 5 dimension circular gauges
    • Strengths & improvements feedback
    • Question-by-question review (expandable)
```

**Key Functions**:
- `evaluateInterviewResponse(interview)` → detailed evaluation
- `generateInterviewQuestions(jobTitle)` → question generation
- `calculateDimensionalScores(responses)` → per-dimension scoring

**API**: `POST /api/interview/submit` → `GET /api/interview/result/:id`

---

### Module 4: Risk Prediction & Attrition

**Trigger**: After interview completion

**Flow**:
```
1. Recruiter: Reviews interview results
   ↓
2. Frontend: Click "Predict Risk" or automatic trigger
   ↓
3. Frontend: aiService.predictRisk(candidateId, jobId)
   ↓
4. Backend: POST /api/risk/predict
   ↓
5. Controller: riskController.predictCandidateRisk()
   ↓
6. AI Module: riskPredictionAI.predictHiringRisk(candidate, job, historicalData)
   ↓
   Analyze 9 Risk Factors (weighted):
   
   1. Overqualification (15% weight)
      • If salary_expectation > job_salary * 1.2
      • If experience > job_requirement + 3 years
      • If education > job_requirement level
      → Risk: Will likely leave for better opportunity
   
   2. Underqualification (18% weight)
      • Missing core skills
      • Below required experience
      • Education gap vs requirements
      → Risk: May struggle in role
   
   3. Skill Mismatch (20% weight)
      • Critical skills missing
      • Proficiency gaps vs requirements
      • Technical stack mismatch
      → Risk: Unable to perform core tasks
   
   4. Job Hopping (15% weight)
      • Frequency of job changes
      • Average tenure per job
      • Pattern analysis
      → Risk: May leave quickly
   
   5. Cultural Fit (10% weight)
      • Interview cultural fit score
      • Value alignment
      • Team compatibility
      → Risk: May not mesh with team
   
   6. Salary Expectations (10% weight)
      • Expectation vs offer gap
      • Historical salary progression
      • Market alignment
      → Risk: May reject offer or be unmotivated
   
   7. Commute/Location (5% weight)
      • Distance from home to office
      • Relocation requirement
      • Work-from-home availability
      → Risk: Work-life balance issues
   
   8. Career Gaps (5% weight)
      • Unexplained employment gaps
      • Reason for gaps
      • Career continuity
      → Risk: Stability concerns
   
   9. Retention History (2% weight)
      • Average tenure in previous roles
      • Reasons for leaving
      • Career progression
      → Risk: May leave within first year
   ↓
7. AI Module: Score each factor 0-100, apply weights
   overall_risk_score = Σ(factor_score × weight)
   ↓
8. AI Module: Predict Attrition Probability (0-1)
   - Analyze all risk factors
   - Predict probability of leaving within 12 months
   - Range: 0.0 (will stay) to 1.0 (will leave)
   ↓
9. AI Module: Predict Tenure in Months
   - Based on risk factors and historical data
   - Average expected tenure if hired
   ↓
10. AI Module: Generate Mitigation Strategies
    For each risk factor:
    {
      factor: "Job Hopping",
      impact_level: "high",  // high, medium, low
      description: "Candidate changed jobs every 1.5 years",
      mitigation_strategies: [
        {
          strategy: "Clear career growth path",
          priority: "high",
          implementation: "Define promotions and skill development plan"
        },
        ...
      ]
    }
    ↓
11. AI Module: Return comprehensive risk assessment:
    {
      overallRiskScore: 58,
      riskLevel: "medium",  // low (<40), medium (40-70), high (>70)
      attritionProbability: 0.45,  // 45% chance of leaving
      predictedTenureMonths: 18,
      topRiskFactors: [
        { name: "Skill Mismatch", score: 75, weight: 0.20 },
        { name: "Overqualification", score: 68, weight: 0.15 },
        { name: "Job Hopping", score: 65, weight: 0.15 }
      ],
      mitigationStrategies: [
        {
          factor: "Skill Mismatch",
          strategies: [
            { strategy: "Pair with senior mentor", priority: "high" },
            { strategy: "Training program", priority: "high" }
          ]
        },
        ...
      ],
      recommendation: "Hire with enhanced onboarding and mentorship",
      confidenceScore: 0.88
    }
    ↓
12. Database: Store in RiskPrediction & Application
    {
      RiskPrediction: {
        riskScore: 58,
        riskLevel: "medium",
        attritionProbability: 0.45,
        predictedTenureMonths: 18,
        factors: {...},
        strategies: {...},
        confidence: 0.88
      },
      Application: {
        riskLevel: "medium",
        riskScore: 58,
        attritionProbability: 0.45,
        predictedTenureMonths: 18
      }
    }
    ↓
13. Frontend: RiskPredictionCard renders:
    • Overall risk score (circular progress)
    • Risk level badge (low/medium/high) with color
    • 3 key metrics (attrition %, tenure months, confidence)
    • Top 3 risk factors with bar charts
    • Mitigation strategies organized by priority
    • Hiring recommendation
```

**Key Functions**:
- `predictHiringRisk(candidate, job, historicalData)` → comprehensive assessment
- `calculateRiskFactors(candidate, job)` → individual scores
- `predictAttrition(candidate, job)` → probability 0-1

**API**: `POST /api/risk/predict` → `GET /api/risk/:id`

---

## Dashboard Integration

### Candidate Dashboard

**URL**: `/candidate/dashboard`

**Components**:
- Stats cards: Applied Jobs, Interviews, Offers
- SkillAnalysisCard: Module 1 visualization
- Recent applications list
- CTA section to upload resume

**Data Sources**:
- `dashboardService.getCandidateDashboard()`
- `candidateService.getProfile(userId)` → skillAnalysis
- `candidateService.getApplications()` → applications list

---

### Recruiter Dashboard

**URL**: `/recruiter/dashboard`

**Components**:
- Stats cards: Open Positions, Applications, Shortlisted, Hired
- Action cards: View Candidates, Manage Vacancies
- Recent applications with match scores

**Data Sources**:
- `dashboardService.getRecruiterDashboard()`
- Returns: openPositions, totalApplications, shortlisted, hired, recentApplications

---

### Ranked Candidates Page

**URL**: `/recruiter/candidates/:jobId`

**Components**:
- Filter buttons: All, Excellent, Strong, Moderate
- Candidate cards: Rank, Match Score, Interview Score, Risk Level
- MatchScoreCard: Detailed match breakdown (on selection)

**Data Sources**:
- `aiService.getRankedCandidates(jobId)` → Module 2 ranking
- Returns: candidates sorted by match score

---

### Application Details

**URL**: `/recruiter/applications/:applicationId`

**Components**:
- MatchScoreCard: Module 2 visualization
- RiskPredictionCard: Module 4 visualization
- Action buttons: Schedule Interview, Move to Next, Reject

**Data Sources**:
- `aiService.getMatchScore(applicationId)` → Module 2 data
- `aiService.predictRisk(candidateId, jobId)` → Module 4 data

---

## Database Schemas

### CandidateProfile

```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  resume: {
    fileName: String,
    uploadDate: Date,
    filePath: String
  },
  
  // Module 1 Output
  skillAnalysis: {
    skillScore: Number,         // 0-100
    experienceLevel: String,    // junior, mid, senior, expert
    skills: [
      {
        name: String,
        proficiency: String,    // beginner, intermediate, advanced
        yearsOfExperience: Number
      }
    ],
    skillRecommendations: [
      {
        skill: String,
        reason: String,
        category: String
      }
    ],
    categoryBreakdown: {
      programming_languages: [String],
      frontend_frameworks: [String],
      backend_frameworks: [String],
      databases: [String],
      cloud_platforms: [String],
      devops: [String],
      tools_and_technologies: [String],
      testing: [String]
    }
  },
  
  education: [
    {
      degree: String,
      field: String,
      school: String,
      graduationYear: Number
    }
  ],
  
  experience: [
    {
      company: String,
      position: String,
      duration: Number,
      responsibilities: [String]
    }
  ],
  
  createdAt: Date,
  updatedAt: Date
}
```

### Application

```javascript
{
  _id: ObjectId,
  candidateId: ObjectId,
  jobId: ObjectId,
  
  status: String,  // applied, shortlisted, interview_scheduled, interview_passed, 
                   // interview_failed, offer_extended, hired, rejected
  
  // Module 2 Output
  matchScore: Number,           // 0-100
  matchLevel: String,           // excellent, strong, moderate, weak, poor
  matchScoreDetails: {
    overall_score: Number,
    match_level: String,
    confidence: Number,         // 0-1
    dimensions: {
      skills: {
        score: Number,
        explanation: String
      },
      experience: {
        score: Number,
        explanation: String
      },
      education: {
        score: Number,
        explanation: String
      },
      location: {
        score: Number,
        explanation: String
      },
      salary: {
        score: Number,
        explanation: String
      },
      cultural_fit: {
        score: Number,
        explanation: String
      }
    },
    top_matched_skills: [String],
    skill_gaps: [String],
    summary: String
  },
  
  // Module 3 Output
  interviewScore: Number,       // 0-100
  interviewResult: String,      // pass, fail
  
  // Module 4 Output
  riskScore: Number,            // 0-100
  riskLevel: String,            // low, medium, high
  attritionProbability: Number, // 0-1
  predictedTenureMonths: Number,
  
  appliedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Interview

```javascript
{
  _id: ObjectId,
  applicationId: ObjectId,
  candidateId: ObjectId,
  jobId: ObjectId,
  
  questions: [
    {
      id: String,
      text: String,
      type: String,      // text, mcq, video
      timeLimit: Number, // seconds
      options: [String]  // for MCQ
    }
  ],
  
  // Module 3 Output
  evaluations: [
    {
      questionIndex: Number,
      question: String,
      answer: String,
      type: String,
      scores: {
        communication: Number,
        confidence: Number,
        clarity: Number,
        relevance: Number,
        completeness: Number,
        eye_contact: Number,     // video only
        gestures: Number         // video only
      },
      feedback: {
        strengths: [String],
        improvements: [String]
      }
    }
  ],
  
  overallScore: Number,         // 0-100
  result: String,               // pass, fail
  
  feedback: {
    strengths: [String],
    improvements: [String],
    summary: String
  },
  
  recommendation: String,
  
  scheduledAt: Date,
  completedAt: Date,
  createdAt: Date
}
```

### RiskPrediction

```javascript
{
  _id: ObjectId,
  candidateId: ObjectId,
  jobId: ObjectId,
  applicationId: ObjectId,
  
  // Module 4 Output
  riskScore: Number,            // 0-100
  riskLevel: String,            // low, medium, high
  
  attritionProbability: Number, // 0-1 (0% to 100%)
  predictedTenureMonths: Number,
  
  riskFactors: [
    {
      name: String,
      score: Number,             // 0-100
      weight: Number,            // 0-1
      description: String,
      impactLevel: String        // high, medium, low
    }
  ],
  
  mitigationStrategies: [
    {
      factor: String,
      strategies: [
        {
          strategy: String,
          priority: String,      // high, medium, low
          implementation: String
        }
      ]
    }
  ],
  
  recommendation: String,
  confidenceScore: Number,       // 0-1
  
  analyzedAt: Date,
  createdAt: Date
}
```

---

## API Endpoints Reference

### Module 1: Resume Parsing

```
POST /api/resume/upload
  Input: FormData { file }
  Output: CandidateSkillInsights
  
GET /api/candidates/:id/skills
  Output: CandidateSkillInsights
```

### Module 2: Job Matching

```
POST /api/applications
  Input: { candidateId, jobId }
  Output: { matchScore, matchLevel, matchScoreDetails }
  
GET /api/applications/job/:jobId/ranked
  Output: [ { candidateId, candidateName, matchScore, ... } ]
  
GET /api/applications/:applicationId/match
  Output: MatchScoreDetails
```

### Module 3: Interview Evaluation

```
POST /api/interview/submit
  Input: { interviewId, answers[] }
  Output: InterviewResult
  
GET /api/interview/result/:interviewId
  Output: InterviewResult
```

### Module 4: Risk Prediction

```
POST /api/risk/predict
  Input: { candidateId, jobId }
  Output: RiskPrediction
  
GET /api/risk/:id
  Output: RiskPrediction
```

### Dashboard

```
GET /api/dashboard/candidate
  Output: { applied, shortlisted, interviews, offers, recentApplications }
  
GET /api/dashboard/recruiter
  Output: { openPositions, totalApplications, shortlisted, hired, recentApplications }
```

---

## Error Handling Strategy

### API Level

```javascript
// Try-catch in controllers
try {
  const result = await aiModule.process(data);
  res.json({ success: true, data: result });
} catch (err) {
  res.status(500).json({ 
    success: false, 
    error: err.message,
    code: err.code 
  });
}
```

### Frontend Level

```javascript
// In aiService.ts
try {
  const response = await api.post('/api/endpoint', data);
  return response.data;
} catch (error) {
  throw {
    message: error.response?.data?.error || 'API Error',
    status: error.response?.status,
    code: error.code
  };
}

// In components
{error && (
  <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
    <AlertCircle className="w-5 h-5 text-red-600" />
    <p className="text-red-700">{error}</p>
  </div>
)}
```

---

## Loading States Implementation

### UI Patterns

```javascript
// Skeleton loader
{loading && (
  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
    <Loader className="w-8 h-8 text-blue-600" />
  </motion.div>
)}

// Component with isLoading prop
<SkillAnalysisCard data={skillData} isLoading={loading} />

// Conditional rendering
{loading ? (
  <LoadingState />
) : error ? (
  <ErrorState message={error} />
) : (
  <DataDisplay data={data} />
)}
```

---

## Authentication Flow

### Role-Based Access

```javascript
// Auth Context
const { user, login, logout } = useAuth();

// Protected Routes
useEffect(() => {
  if (user?.role !== 'recruiter') {
    navigate('/login');
  }
}, [user, navigate]);

// API Headers
const config = {
  headers: {
    Authorization: `Bearer ${authToken}`
  }
};
```

---

## Testing Scenarios

### End-to-End Pipeline Test

1. **Setup**
   - Create test candidate account
   - Create test job vacancy
   - Grant recruiter permissions

2. **Module 1: Resume Upload**
   - Upload sample resume (PDF/DOCX)
   - Verify skill extraction
   - Check skill score calculation
   - Validate recommendations

3. **Module 2: Apply & Match**
   - Candidate applies for job
   - Verify match score generation
   - Check dimension breakdown
   - Validate skill gap identification

4. **Module 3: Interview**
   - Recruiter schedules interview
   - Candidate completes interview
   - Verify evaluation scoring
   - Check pass/fail determination

5. **Module 4: Risk Prediction**
   - Automatic risk analysis after interview
   - Verify risk factor calculation
   - Check attrition prediction
   - Validate mitigation strategies

6. **Dashboard**
   - View all aggregated data
   - Check stats calculations
   - Verify ranking accuracy

---

## Performance Optimization

### Caching Strategy

```javascript
// Cache skill scores for 24 hours
const skillCache = new Map();
const SKILL_CACHE_TTL = 24 * 60 * 60 * 1000;

// Lazy load components
const SkillAnalysisCard = lazy(() => import('./SkillAnalysisCard'));
<Suspense fallback={<Loader />}>
  <SkillAnalysisCard data={data} />
</Suspense>
```

### Database Indexing

```javascript
// Application.js indexes
application.index({ candidateId: 1 });
application.index({ jobId: 1 });
application.index({ matchScore: -1 });
application.index({ status: 1 });
```

### Pagination

```javascript
// Get paginated applications
GET /api/applications?page=1&limit=20

// Ranked candidates
GET /api/applications/job/:jobId/ranked?limit=10
```

---

## Deployment Checklist

- [ ] All 4 AI modules deployed and tested
- [ ] API endpoints protected with auth middleware
- [ ] Database indexes created
- [ ] Environment variables configured
- [ ] Error logging implemented
- [ ] Monitoring/alerts set up
- [ ] SSL certificates installed
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Security headers added

---

## Support & Troubleshooting

### Common Issues

**Resume parsing fails**
- Ensure file is valid PDF/DOCX
- Check file size < 5MB
- Verify pdf-parse and mammoth are installed

**Match score is 0**
- Check job vacancy has requirements defined
- Verify candidate has parsed skills
- Check skill matching algorithm

**Interview evaluation not saving**
- Verify all questions have answers
- Check application exists
- Ensure interview type matches

**Risk score unexpected**
- Review all 9 risk factors
- Check weights sum to 1.0
- Verify historical data exists

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Status**: Production Ready
