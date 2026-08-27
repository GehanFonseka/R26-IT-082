import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Mock API responses (in production, replace with real API calls)
export const api = {
  auth: {
    login: async (email: string, password: string) => {
      // Mock implementation
      return { token: 'mock_token', user: { id: '1', email, name: 'User' } };
    },
    register: async (email: string, password: string, name: string) => {
      return { token: 'mock_token', user: { id: '1', email, name } };
    },
  },
  jobs: {
    getAll: async () => {
      const { mockJobs } = await import('../data/mockData');
      return mockJobs;
    },
    getById: async (id: string) => {
      const { mockJobs } = await import('../data/mockData');
      return mockJobs.find(job => job.id === id);
    },
  },
  candidates: {
    getAll: async () => {
      const { mockCandidates } = await import('../data/mockData');
      return mockCandidates;
    },
    getById: async (id: string) => {
      const { mockCandidates } = await import('../data/mockData');
      return mockCandidates.find(c => c.id === id);
    },
  },
  applications: {
    getAll: async () => {
      const { mockApplications } = await import('../data/mockData');
      return mockApplications;
    },
    create: async (candidateId: string, jobId: string) => {
      return { id: `app_${Date.now()}`, candidateId, jobId, status: 'applied' };
    },
  },
  interviews: {
    getAll: async () => {
      const { mockInterviews } = await import('../data/mockData');
      return mockInterviews;
    },
    schedule: async (candidateId: string, jobId: string, date: string) => {
      return { id: `int_${Date.now()}`, candidateId, jobId, scheduledDate: date, status: 'scheduled' };
    },
  },
};

export default apiClient;
