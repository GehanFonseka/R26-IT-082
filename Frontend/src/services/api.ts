import axios, { AxiosError, AxiosResponse } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Add token to request headers
 */
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Handle response errors
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * API service for making HTTP requests
 */
export const api = {
  auth: {
    /**
     * Login user
     */
    login: async (email: string, password: string) => {
      const response = await apiClient.post('/auth/login', { email, password });
      return response.data;
    },
    /**
     * Register new user
     */
    register: async (name: string, email: string, password: string, role: string) => {
      const response = await apiClient.post('/auth/register', { name, email, password, role });
      return response.data;
    },
    /**
     * Get user profile
     */
    getProfile: async () => {
      const response = await apiClient.get('/auth/profile');
      return response.data;
    },
  },
  jobs: {
    /**
     * Get all jobs
     */
    getAll: async () => {
      const response = await apiClient.get('/jobs');
      return response.data;
    },
    /**
     * Get job by ID
     */
    getById: async (id: string) => {
      const response = await apiClient.get(`/jobs/${id}`);
      return response.data;
    },
  },
  candidates: {
    /**
     * Get all candidates
     */
    getAll: async () => {
      const response = await apiClient.get('/candidate');
      return response.data;
    },
    /**
     * Get candidate by ID
     */
    getById: async (id: string) => {
      const response = await apiClient.get(`/candidate/${id}`);
      return response.data;
    },
  },
  applications: {
    /**
     * Get all applications
     */
    getAll: async () => {
      const response = await apiClient.get('/applications');
      return response.data;
    },
    /**
     * Create application
     */
    create: async (candidateId: string, jobId: string) => {
      const response = await apiClient.post('/applications', { candidateId, jobId });
      return response.data;
    },
  },
  interviews: {
    /**
     * Get all interviews
     */
    getAll: async () => {
      const response = await apiClient.get('/interviews');
      return response.data;
    },
    /**
     * Schedule interview
     */
    schedule: async (candidateId: string, jobId: string, date: string) => {
      const response = await apiClient.post('/interviews', { candidateId, jobId, scheduledDate: date });
      return response.data;
    },
  },
};

export default apiClient;
