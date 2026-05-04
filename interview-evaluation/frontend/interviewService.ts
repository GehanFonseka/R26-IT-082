/**
 * API client for interview evaluation flows (scores, AI analysis, certification validation).
 * Mirrors: Frontend/src/services/interviewService.ts
 */

export interface InterviewScores {
  technical: number;
  communication: number;
  confidence: number;
  overall: number;
}

export interface CertificationInput {
  name: string;
  issuer: string;
  issueYear?: number;
  expiresAt?: string;
  credentialId?: string;
  skills?: string[];
}

export interface CertDimension {
  level: string;
  score: number;
  reasons: string[];
}

export interface ValidatedCertification {
  name: string;
  issuer: string;
  issueYear: number | null;
  expiresAt: string | null;
  credentialId?: string;
  authenticity: CertDimension;
  relevance: CertDimension;
  validity: CertDimension;
  trustScore: number;
}

export interface CertificationValidation {
  items: ValidatedCertification[];
  overallTrustScore: number;
  validatedAt: string;
  policy: string;
}

export interface BehavioralEvidence {
  dimension: string;
  detail: string;
}

export interface AiAnalysis {
  summary: string;
  communicationCues: {
    score: number;
    clarity: number;
    structure: number;
    vocabularyDepth: number;
    signals: string[];
  };
  behavioralCues: {
    score: number;
    dimensions: {
      teamwork: number;
      ownership: number;
      adaptability: number;
      stressHandling: number;
    };
    evidence: BehavioralEvidence[];
    note?: string;
  };
  softSkills: {
    collaboration: number;
    problemSolving: number;
    professionalism: number;
  };
  analysisMethod: string;
  analyzedAt: string;
}

export interface Interview {
  _id: string;
  candidateId: string;
  jobId: string;
  applicationId: string;
  jobTitle?: string;
  requiredSkills?: string[];
  certifications?: CertificationInput[];
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  scheduledAt: string;
  completedAt?: string;
  questions: Array<{ id: string; text: string; type: string; options?: string[] }>;
  answers: Array<{ questionId: string; answer: string; confidence?: number }>;
  scores: InterviewScores | null;
  aiAnalysis: AiAnalysis | null;
  certificationValidation: CertificationValidation | null;
  feedback: string;
}

const base = '/api/interviews';

async function post<T>(url: string, body: unknown): Promise<T> {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<T>;
}

async function get<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<T>;
}

export type StartInterviewPayload = {
  applicationId: string;
  jobId: string;
  candidateId: string;
  questions?: unknown[];
  jobTitle?: string;
  requiredSkills?: string[];
  certifications?: CertificationInput[];
};

export const interviewClient = {
  startInterview: (payload: StartInterviewPayload) =>
    post<{ message: string; interview: Interview }>(`${base}/start`, payload),

  scheduleInterview: (
    candidateId: string,
    jobId: string,
    applicationId: string,
    scheduledAt: string,
    interviewerIds: string[] = [],
    extras?: { jobTitle?: string; requiredSkills?: string[]; certifications?: CertificationInput[] }
  ) =>
    post<{ interview: Interview }>(`${base}/schedule`, {
      candidateId,
      jobId,
      applicationId,
      scheduledAt,
      interviewerIds,
      ...extras,
    }),

  submitAnswers: (
    interviewId: string,
    answers: Interview['answers'],
    extras?: {
      certifications?: CertificationInput[];
      jobTitle?: string;
      requiredSkills?: string[];
    }
  ) => post<{ interview: Interview }>(`${base}/${interviewId}/submit`, { answers, ...extras }),

  validateCertifications: (
    certifications: CertificationInput[],
    jobTitle = '',
    requiredSkills: string[] = []
  ) =>
    post<{ certificationValidation: CertificationValidation }>(`${base}/certifications/validate`, {
      certifications,
      jobTitle,
      requiredSkills,
    }),

  getInterviewResults: (interviewId: string) =>
    get<{ interview: Interview }>(`${base}/${interviewId}/results`),

  getInterviews: (page = 1, limit = 10, candidateId = '', jobId = '', status = '') => {
    const q = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      candidateId,
      jobId,
      status,
    });
    return get<{ interviews: Interview[]; pagination: { total: number; page: number; limit: number } }>(
      `${base}/all?${q}`
    );
  },
};

export default interviewClient;
