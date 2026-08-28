import axiosInstance from './axiosConfig';

export interface Job {
  _id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  experienceRequired: number;
  salaryMin: number;
  salaryMax: number;
  location: string;
  jobType: string;
  createdBy: { _id: string; name: string; email: string };
  status: string;
  applicantCount: number;
  createdAt: string;
}

const jobService = {
  getAllJobs: async (page = 1, limit = 10, search = '', location = '', jobType = '') => {
    const response = await axiosInstance.get('/jobs/all', {
      params: { page, limit, search, location, jobType },
    });
    return response.data;
  },

  getJobById: async (jobId: string): Promise<{ vacancy: Job }> => {
    const response = await axiosInstance.get(`/jobs/${jobId}`);
    return response.data;
  },

  createJob: async (jobData: Partial<Job>) => {
    const response = await axiosInstance.post('/jobs/create', jobData);
    return response.data;
  },

  updateJob: async (jobId: string, jobData: Partial<Job>) => {
    const response = await axiosInstance.put(`/jobs/${jobId}`, jobData);
    return response.data;
  },

  deleteJob: async (jobId: string) => {
    const response = await axiosInstance.delete(`/jobs/${jobId}`);
    return response.data;
  },
};

export default jobService;
