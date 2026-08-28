import axiosInstance from './axiosConfig';

export interface Interview {
  _id: string;
  candidateId: string;
  jobId: string;
  applicationId: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  scheduledAt: string;
  completedAt?: string;
  questions: Array<{
    id: string;
    text: string;
    type: string;
    options?: string[];
  }>;
  answers: Array<{
    questionId: string;
    answer: string;
    confidence?: number;
  }>;
  scores: {
    technical: number;
    communication: number;
    confidence: number;
    overall: number;
  };
  feedback: string;
}

const interviewService = {
  startInterview: async (applicationId: string, jobId: string, questions = []) => {
    const response = await axiosInstance.post('/interviews/start', {
      applicationId,
      jobId,
      questions,
    });
    return response.data;
  },

  scheduleInterview: async (
    candidateId: string,
    jobId: string,
    applicationId: string,
    scheduledAt: string,
    interviewerIds = []
  ) => {
    const response = await axiosInstance.post('/interviews/schedule', {
      candidateId,
      jobId,
      applicationId,
      scheduledAt,
      interviewerIds,
    });
    return response.data;
  },

  submitAnswers: async (interviewId: string, answers: any[]) => {
    const response = await axiosInstance.post(`/interviews/${interviewId}/submit`, { answers });
    return response.data;
  },

  getInterviewResults: async (interviewId: string): Promise<{ interview: Interview }> => {
    const response = await axiosInstance.get(`/interviews/${interviewId}/results`);
    return response.data;
  },

  getInterviews: async (page = 1, limit = 10, candidateId = '', jobId = '', status = '') => {
    const response = await axiosInstance.get('/interviews/all', {
      params: { page, limit, candidateId, jobId, status },
    });
    return response.data;
  },
};

export default interviewService;
