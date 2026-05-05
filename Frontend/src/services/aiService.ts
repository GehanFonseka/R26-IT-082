import axiosInstance from './axiosConfig';

// ============= Module 1: Resume Parsing & Skill Analysis =============
export interface SkillAnalysis {
  skill: string;
  proficiencyLevel: 'advanced' | 'intermediate' | 'beginner';
  yearsOfExperience?: number;
  endorsements?: number;
}

export interface CandidateSkillInsights {
  skillScore: number; // 0-100
  experienceLevel: 'entry' | 'junior' | 'mid' | 'senior' | 'lead';
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

// ============= Module 2: Job-Candidate Matching =============
export interface MatchScoreDimension {
  name: string;
  score: number; // 0-100
  weight: number;
  explanation: string;
}

export interface MatchScoreDetails {
  overall_score: number; // 0-100
  match_level: 'excellent' | 'strong' | 'moderate' | 'weak' | 'poor';
  confidence: number; // 0-100
  dimensions: {
    skills: MatchScoreDimension;
    experience: MatchScoreDimension;
    education: MatchScoreDimension;
    location: MatchScoreDimension;
    salary: MatchScoreDimension;
    cultural_fit: MatchScoreDimension;
  };
  top_matched_skills: string[];
  skill_gaps: string[];
  summary: string;
}

// ============= Module 3: Interview Evaluation =============
export interface InterviewEvaluation {
  questionIndex: number;
  question: string;
  candidateAnswer: string;
  type: 'text' | 'mcq' | 'video';
  communication_score: number; // 0-100
  confidence_score: number;
  clarity_score: number;
  relevance_score: number;
  completeness_score: number;
  overall_score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export interface InterviewResult {
  overallScore: number; // 0-100
  result: 'pass' | 'fail';
  evaluations: InterviewEvaluation[];
  feedback: {
    overall: string;
    strengths: string[];
    improvements: string[];
  };
  recommendation: string;
}

// ============= Module 4: Risk Prediction =============
export interface RiskFactor {
  factor: string;
  riskScore: number; // 0-100
  impact: 'low' | 'medium' | 'high';
  description: string;
}

export interface RiskPrediction {
  overallRiskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high';
  attritionProbability: number; // 0-1 (0-100%)
  predictedTenureMonths: number;
  topRiskFactors: RiskFactor[];
  mitigationStrategies: {
    factor: string;
    strategy: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  recommendation: string;
  confidenceScore: number; // 0-100
}

// ============= AI Service Definition =============
const aiService = {
  // ========== Module 1: Resume Parsing ==========
  parseResume: async (file: File): Promise<CandidateSkillInsights> => {
    const formData = new FormData();
    formData.append('resume', file);

    const response = await axiosInstance.post('/candidate/resume/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getSkillAnalysis: async (candidateId: string): Promise<CandidateSkillInsights> => {
    const response = await axiosInstance.get(`/candidate/${candidateId}/skills`);
    return response.data;
  },

  // ========== Module 2: Job Matching ==========
  getMatchScore: async (applicationId: string): Promise<MatchScoreDetails> => {
    const response = await axiosInstance.get(`/applications/${applicationId}/match`);
    return response.data;
  },

  getRankedCandidates: async (jobId: string): Promise<{
    jobId: string;
    candidates: Array<{
      candidateId: string;
      candidateName: string;
      matchScore: MatchScoreDetails;
      applicationId: string;
    }>;
  }> => {
    const response = await axiosInstance.get(`/applications/job/${jobId}/ranked`);
    return response.data;
  },

  // ========== Module 3: Interview Evaluation ==========
  evaluateInterview: async (interviewId: string): Promise<InterviewResult> => {
    const response = await axiosInstance.post(`/interviews/${interviewId}/evaluate`);
    return response.data;
  },

  submitInterviewAnswers: async (
    interviewId: string,
    answers: Array<{
      questionIndex: number;
      answer: string;
      type: 'text' | 'mcq' | 'video';
    }>
  ): Promise<InterviewResult> => {
    const response = await axiosInstance.post(`/interviews/${interviewId}/submit`, {
      answers,
    });
    return response.data;
  },

  // ========== Module 4: Risk Prediction ==========
  predictRisk: async (candidateId: string, jobId: string): Promise<RiskPrediction> => {
    const response = await axiosInstance.post('/risk/predict', {
      candidateId,
      jobId,
    });
    return response.data;
  },

  getRiskPrediction: async (riskId: string): Promise<RiskPrediction> => {
    const response = await axiosInstance.get(`/risk/${riskId}`);
    return response.data;
  },

  // ========== Utility Methods ==========
  getRiskColor: (riskLevel: string): string => {
    switch (riskLevel) {
      case 'low':
        return '#10b981'; // Green
      case 'medium':
        return '#f59e0b'; // Amber
      case 'high':
        return '#ef4444'; // Red
      default:
        return '#6b7280'; // Gray
    }
  },

  getMatchLevelColor: (level: string): string => {
    switch (level) {
      case 'excellent':
        return '#10b981'; // Green
      case 'strong':
        return '#3b82f6'; // Blue
      case 'moderate':
        return '#f59e0b'; // Amber
      case 'weak':
        return '#ef4444'; // Red
      case 'poor':
        return '#7f1d1d'; // Dark Red
      default:
        return '#6b7280'; // Gray
    }
  },

  formatPercentage: (value: number): string => {
    return `${Math.round(value)}%`;
  },

  formatScore: (score: number, maxScore: number = 100): string => {
    return `${score.toFixed(1)}/${maxScore}`;
  },
};

export default aiService;
