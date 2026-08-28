import axiosInstance from './axiosConfig';

export interface Application {
  _id: string;
  candidateId: string;
  jobId: string;
  status: 'applied' | 'shortlisted' | 'interview' | 'rejected' | 'offered' | 'hired';
  matchScore: number;
  interviewScore?: number;
  riskScore: number;
  riskLevel: string;
  notes: string;
  createdAt: string;
}

const applicationService = {
  applyForJob: async (jobId: string) => {
    const response = await axiosInstance.post('/applications/apply', { jobId });
    return response.data;
  },

  getApplications: async (page = 1, limit = 10, candidateId = '', jobId = '', status = '') => {
    const response = await axiosInstance.get('/applications/all', {
      params: { page, limit, candidateId, jobId, status },
    });
    return response.data;
  },

  getCandidateApplications: async () => {
    const response = await axiosInstance.get('/applications/candidate/all');
    return response.data;
  },

  updateApplicationStatus: async (applicationId: string, status: string, notes = '') => {
    const response = await axiosInstance.put(`/applications/${applicationId}/status`, {
      status,
      notes,
    });
    return response.data;
  },

  rejectApplication: async (applicationId: string, rejectionReason = '') => {
    const response = await axiosInstance.put(`/applications/${applicationId}/reject`, {
      rejectionReason,
    });
    return response.data;
  },
};

export default applicationService;
