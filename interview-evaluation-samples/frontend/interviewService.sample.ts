/**
 * Sample API client for interview evaluation flows.
 * Mirrors: Frontend/src/services/interviewService.ts
 */

export interface InterviewScores {
  technical: number;
  communication: number;
  confidence: number;
  overall: number;
}

export interface Interview {
  _id: string;
  candidateId: string;
  jobId: string;
  applicationId: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  scheduledAt: string;
  completedAt?: string;
  questions: Array<{ id: string; text: string; type: string; options?: string[] }>;
  answers: Array<{ questionId: string; answer: string; confidence?: number }>;
  scores: InterviewScores;
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

export const interviewServiceSample = {
  startInterview: (applicationId: string, jobId: string, questions: unknown[] = []) =>
    post<{ interview: Interview }>(`${base}/start`, { applicationId, jobId, questions }),

  scheduleInterview: (
    candidateId: string,
    jobId: string,
    applicationId: string,
    scheduledAt: string,
    interviewerIds: string[] = []
  ) =>
    post<{ interview: Interview }>(`${base}/schedule`, {
      candidateId,
      jobId,
      applicationId,
      scheduledAt,
      interviewerIds,
    }),

  submitAnswers: (interviewId: string, answers: Interview['answers']) =>
    post<{ interview: Interview }>(`${base}/${interviewId}/submit`, { answers }),

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

export default interviewServiceSample;
