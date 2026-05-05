# Frontend AI Modules Integration Guide

## Overview
This guide covers the integration of 4 AI modules into the frontend application. Each module provides intelligent insights for the talent acquisition platform.

---

## Table of Contents
1. [Module 1: Resume Parsing & Skill Analysis](#module-1-resume-parsing--skill-analysis)
2. [Module 2: Job-Candidate Matching](#module-2-job-candidate-matching)
3. [Module 3: Interview Evaluation](#module-3-interview-evaluation)
4. [Module 4: Risk Prediction](#module-4-risk-prediction)
5. [Service Integration](#service-integration)
6. [Component Usage](#component-usage)
7. [Example Implementation](#example-implementation)

---

## Module 1: Resume Parsing & Skill Analysis

### Service: `aiService.parseResume()`

**Purpose**: Parse resume files and extract skill analysis with proficiency levels.

**Function Signature**:
```typescript
parseResume(file: File): Promise<CandidateSkillInsights>
```

**Parameters**:
- `file: File` - Resume file (PDF/DOCX)

**Return Value**:
```typescript
CandidateSkillInsights {
  skillScore: number;              // 0-100
  experienceLevel: string;         // 'entry' | 'junior' | 'mid' | 'senior' | 'lead'
  skills: SkillAnalysis[];
  skillRecommendations: string[];
  skillAnalysis: {
    programming_languages: SkillAnalysis[];
    frontend_frameworks: SkillAnalysis[];
    backend_frameworks: SkillAnalysis[];
    databases: SkillAnalysis[];
    cloud_platforms: SkillAnalysis[];
    devops: SkillAnalysis[];
    tools_and_technologies: SkillAnalysis[];
    testing: SkillAnalysis[];
  };
}
```

### Component: `SkillAnalysisCard`

**Location**: `src/components/ai/SkillAnalysisCard.tsx`

**Props**:
- `data: CandidateSkillInsights` - Skill analysis data
- `isLoading?: boolean` - Loading state

**Features**:
- Displays skill score (0-100)
- Experience level badge
- Top 8 skills with proficiency levels
- Skill recommendations
- Skills organized by category

**Example Usage**:
```tsx
import { SkillAnalysisCard } from '@/components/ai';
import aiService from '@/services/aiService';
import { useState, useEffect } from 'react';

export function SkillDashboard() {
  const [skills, setSkills] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSkills = async () => {
      const resume = new File(['...'], 'resume.pdf');
      const data = await aiService.parseResume(resume);
      setSkills(data);
      setLoading(false);
    };
    loadSkills();
  }, []);

  return <SkillAnalysisCard data={skills} isLoading={loading} />;
}
```

---

## Module 2: Job-Candidate Matching

### Service: `aiService.getRankedCandidates()`

**Purpose**: Rank candidates for a specific job using 6-dimensional matching algorithm.

**Function Signature**:
```typescript
getRankedCandidates(jobId: string): Promise<RankedCandidatesResult>
```

**Return Value**:
```typescript
{
  jobId: string;
  candidates: Array<{
    candidateId: string;
    candidateName: string;
    matchScore: MatchScoreDetails;
    applicationId: string;
  }>;
}
```

### Service: `aiService.getMatchScore()`

**Purpose**: Get detailed match score for a single application.

**Function Signature**:
```typescript
getMatchScore(applicationId: string): Promise<MatchScoreDetails>
```

**Return Value**:
```typescript
MatchScoreDetails {
  overall_score: number;              // 0-100
  match_level: string;                // 'excellent' | 'strong' | 'moderate' | 'weak' | 'poor'
  confidence: number;                 // 0-100
  dimensions: {
    skills: MatchScoreDimension;      // 35% weight
    experience: MatchScoreDimension;  // 25% weight
    education: MatchScoreDimension;   // 15% weight
    location: MatchScoreDimension;    // 10% weight
    salary: MatchScoreDimension;      // 10% weight
    cultural_fit: MatchScoreDimension;// 5% weight
  };
  top_matched_skills: string[];
  skill_gaps: string[];
  summary: string;
}
```

### Component: `MatchScoreCard`

**Location**: `src/components/ai/MatchScoreCard.tsx`

**Props**:
- `data: MatchScoreDetails` - Match score data
- `candidateName?: string` - Candidate name
- `jobTitle?: string` - Job title
- `isLoading?: boolean` - Loading state

**Features**:
- Overall match score (0-100)
- Match level badge (excellent/strong/moderate/weak/poor)
- Breakdown by 6 dimensions
- Matched skills
- Skill gaps with recommendations
- Confidence score

**Example Usage**:
```tsx
import { MatchScoreCard } from '@/components/ai';
import aiService from '@/services/aiService';

export function ApplicationDetails({ applicationId, candidateName, jobTitle }) {
  const [match, setMatch] = useState(null);

  useEffect(() => {
    aiService.getMatchScore(applicationId).then(setMatch);
  }, [applicationId]);

  return (
    <MatchScoreCard 
      data={match} 
      candidateName={candidateName}
      jobTitle={jobTitle}
    />
  );
}
```

---

## Module 3: Interview Evaluation

### Service: `aiService.submitInterviewAnswers()`

**Purpose**: Evaluate all interview responses and generate comprehensive feedback.

**Function Signature**:
```typescript
submitInterviewAnswers(
  interviewId: string,
  answers: Array<{
    questionIndex: number;
    answer: string;
    type: 'text' | 'mcq' | 'video';
  }>
): Promise<InterviewResult>
```

**Return Value**:
```typescript
InterviewResult {
  overallScore: number;              // 0-100
  result: 'pass' | 'fail';           // Pass if >= 60
  evaluations: InterviewEvaluation[]; // Array of per-question evaluations
  feedback: {
    overall: string;
    strengths: string[];
    improvements: string[];
  };
  recommendation: string;
}
```

### Component: `InterviewEvaluationCard`

**Location**: `src/components/ai/InterviewEvaluationCard.tsx`

**Props**:
- `data: InterviewResult` - Interview evaluation data
- `candidateName?: string` - Candidate name
- `isLoading?: boolean` - Loading state

**Features**:
- Pass/fail result badge
- Overall score and recommendation
- Score gauges for communication, confidence, clarity, relevance
- Overall feedback with strengths and improvements
- Expandable question-by-question review
- Per-question scoring breakdown

**Example Usage**:
```tsx
import { InterviewEvaluationCard } from '@/components/ai';
import aiService from '@/services/aiService';

export function InterviewResults({ interviewId, candidateName }) {
  const [result, setResult] = useState(null);

  const handleSubmit = async (answers) => {
    const data = await aiService.submitInterviewAnswers(interviewId, answers);
    setResult(data);
  };

  return (
    <>
      {/* Interview UI */}
      {result && (
        <InterviewEvaluationCard 
          data={result}
          candidateName={candidateName}
        />
      )}
    </>
  );
}
```

---

## Module 4: Risk Prediction

### Service: `aiService.predictRisk()`

**Purpose**: Predict hiring risk and attrition probability for a candidate-job match.

**Function Signature**:
```typescript
predictRisk(
  candidateId: string,
  jobId: string
): Promise<RiskPrediction>
```

**Return Value**:
```typescript
RiskPrediction {
  overallRiskScore: number;            // 0-100
  riskLevel: 'low' | 'medium' | 'high';
  attritionProbability: number;        // 0-1 (0-100%)
  predictedTenureMonths: number;
  topRiskFactors: RiskFactor[];        // Top 9 factors
  mitigationStrategies: Array<{
    factor: string;
    strategy: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  recommendation: string;
  confidenceScore: number;             // 0-100
}
```

### Component: `RiskPredictionCard`

**Location**: `src/components/ai/RiskPredictionCard.tsx`

**Props**:
- `data: RiskPrediction` - Risk prediction data
- `candidateName?: string` - Candidate name
- `jobTitle?: string` - Job title
- `isLoading?: boolean` - Loading state

**Features**:
- Overall risk score and level (low/medium/high)
- Circular progress visualization
- Key metrics (attrition probability, predicted tenure, confidence)
- Top risk factors with impact levels
- Mitigation strategies with priorities
- Hiring recommendation

**Example Usage**:
```tsx
import { RiskPredictionCard } from '@/components/ai';
import aiService from '@/services/aiService';

export function RiskAssessment({ candidateId, jobId, candidateName, jobTitle }) {
  const [risk, setRisk] = useState(null);

  useEffect(() => {
    aiService.predictRisk(candidateId, jobId).then(setRisk);
  }, [candidateId, jobId]);

  return (
    <RiskPredictionCard 
      data={risk}
      candidateName={candidateName}
      jobTitle={jobTitle}
    />
  );
}
```

---

## Service Integration

### Import the Service

```typescript
import aiService from '@/services/aiService';
```

### Available Methods

```typescript
// Module 1: Resume Parsing
aiService.parseResume(file: File)
aiService.getSkillAnalysis(candidateId: string)

// Module 2: Job Matching
aiService.getMatchScore(applicationId: string)
aiService.getRankedCandidates(jobId: string)

// Module 3: Interview Evaluation
aiService.evaluateInterview(interviewId: string)
aiService.submitInterviewAnswers(interviewId: string, answers: AnswerArray)

// Module 4: Risk Prediction
aiService.predictRisk(candidateId: string, jobId: string)
aiService.getRiskPrediction(riskId: string)

// Utility Methods
aiService.getRiskColor(riskLevel: string): string
aiService.getMatchLevelColor(level: string): string
aiService.formatPercentage(value: number): string
aiService.formatScore(score: number, maxScore?: number): string
```

---

## Component Usage

All AI components are located in `src/components/ai/` and follow this pattern:

```tsx
import { SkillAnalysisCard, MatchScoreCard, InterviewEvaluationCard, RiskPredictionCard } from '@/components/ai';
```

### Component Features

✨ **Consistent Design**: All components use Tailwind CSS with gradients and animations
✨ **Loading States**: Built-in skeleton loading with pulse animation
✨ **Responsive**: Mobile-first design that adapts to all screen sizes
✨ **Interactive**: Hover effects, expandable sections, and smooth transitions
✨ **Accessible**: Semantic HTML and ARIA labels

---

## Example Implementation

### Complete Recruiter Dashboard with All Modules

```tsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import aiService from '@/services/aiService';
import { 
  SkillAnalysisCard, 
  MatchScoreCard, 
  InterviewEvaluationCard, 
  RiskPredictionCard 
} from '@/components/ai';

export function CandidateHiringDecision() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const [candidateId, setCandidateId] = useState('');
  const [jobId, setJobId] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [jobTitle, setJobTitle] = useState('');

  const [skillData, setSkillData] = useState(null);
  const [matchData, setMatchData] = useState(null);
  const [interviewData, setInterviewData] = useState(null);
  const [riskData, setRiskData] = useState(null);

  const [loading, setLoading] = useState({
    skills: false,
    match: false,
    interview: false,
    risk: false,
  });

  useEffect(() => {
    // Load application details (from your existing API)
    const loadData = async () => {
      // Fetch application data with candidate and job info
      // This is pseudo-code - adapt to your API structure

      // Load skill analysis
      setLoading((prev) => ({ ...prev, skills: true }));
      const skills = await aiService.getSkillAnalysis(candidateId);
      setSkillData(skills);
      setLoading((prev) => ({ ...prev, skills: false }));

      // Load match score
      setLoading((prev) => ({ ...prev, match: true }));
      const match = await aiService.getMatchScore(applicationId);
      setMatchData(match);
      setLoading((prev) => ({ ...prev, match: false }));

      // Load risk prediction
      setLoading((prev) => ({ ...prev, risk: true }));
      const risk = await aiService.predictRisk(candidateId, jobId);
      setRiskData(risk);
      setLoading((prev) => ({ ...prev, risk: false }));
    };

    loadData();
  }, [applicationId, candidateId, jobId]);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold text-gray-800">Hiring Decision Dashboard</h1>
      <p className="text-gray-600">AI-powered analysis for {candidateName} applying to {jobTitle}</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module 1: Skill Analysis */}
        {skillData && (
          <SkillAnalysisCard data={skillData} isLoading={loading.skills} />
        )}

        {/* Module 2: Match Score */}
        {matchData && (
          <MatchScoreCard
            data={matchData}
            candidateName={candidateName}
            jobTitle={jobTitle}
            isLoading={loading.match}
          />
        )}

        {/* Module 3: Interview Evaluation */}
        {interviewData && (
          <InterviewEvaluationCard
            data={interviewData}
            candidateName={candidateName}
            isLoading={loading.interview}
          />
        )}

        {/* Module 4: Risk Prediction */}
        {riskData && (
          <RiskPredictionCard
            data={riskData}
            candidateName={candidateName}
            jobTitle={jobTitle}
            isLoading={loading.risk}
          />
        )}
      </div>

      {/* Final Hiring Decision */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-8 border-2 border-purple-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Final Recommendation</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-xs font-semibold text-gray-600">SKILL MATCH</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {skillData?.skillScore || 0}%
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-xs font-semibold text-gray-600">JOB MATCH</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {matchData?.overall_score || 0}%
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-xs font-semibold text-gray-600">INTERVIEW SCORE</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {interviewData?.overallScore || '-'}%
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-xs font-semibold text-gray-600">HIRING RISK</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {riskData?.overallRiskScore || 0}%
            </p>
          </div>
        </div>

        {riskData && (
          <p className="text-lg text-gray-700 leading-relaxed mb-4">
            {riskData.recommendation}
          </p>
        )}

        <div className="flex gap-4">
          <button className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition">
            ✓ Proceed with Hire
          </button>
          <button className="px-6 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition">
            Review Again
          </button>
          <button className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition">
            ✗ Reject
          </button>
        </div>
      </div>
    </div>
  );
}

export default CandidateHiringDecision;
```

---

## Frontend Integration Checklist

- [x] Create AI service with all 4 modules
- [x] Create SkillAnalysisCard component
- [x] Create MatchScoreCard component
- [x] Create InterviewEvaluationCard component
- [x] Create RiskPredictionCard component
- [x] Add component exports
- [ ] Integrate in recruiter dashboard
- [ ] Integrate in candidate dashboard
- [ ] Integrate in application details page
- [ ] Integrate in interview results page
- [ ] Create unified hiring decision dashboard
- [ ] Add data persistence for AI insights
- [ ] Implement caching for performance

---

## Best Practices

1. **Error Handling**: Always wrap service calls in try-catch blocks
2. **Loading States**: Use the `isLoading` prop to show skeleton loaders
3. **Performance**: Cache AI results to reduce API calls
4. **User Feedback**: Display toast notifications for success/error states
5. **Accessibility**: Ensure all components have proper ARIA labels
6. **Responsive Design**: Test components on mobile, tablet, and desktop

---

## Troubleshooting

### Components Not Loading
- Check that `aiService` is imported correctly
- Verify backend API endpoints are running
- Check browser console for errors

### Missing Type Definitions
- Ensure TypeScript types are imported from `aiService.ts`
- Rebuild TypeScript with `tsc`

### API Calls Failing
- Verify backend server is running on port 3001
- Check authentication token is being sent
- Review backend logs for detailed errors

---

## Support

For issues or questions about the AI integration, refer to:
- Backend Integration Guide: `/Backend/AI_MODULES_INTEGRATION_GUIDE.md`
- Service Documentation: `src/services/aiService.ts`
- Component Implementation: `src/components/ai/`
