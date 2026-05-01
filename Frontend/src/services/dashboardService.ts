import axiosInstance from './axiosConfig';

export interface DashboardStats {
  totalApplications?: number;
  totalJobs?: number;
  totalUsers?: number;
  applied?: number;
  shortlisted?: number;
  interviews?: number;
  offers?: number;
  hired?: number;
  recentJobs?: any[];
  recentApplications?: any[];
  roleCount?: Array<{ _id: string; count: number }>;
  applicationStatus?: Array<{ _id: string; count: number }>;
}

const dashboardService = {
  getRecruiterDashboard: async (): Promise<{ [key: string]: any }> => {
    const response = await axiosInstance.get('/dashboard/recruiter');
    return response.data;
  },

  getAdminDashboard: async (): Promise<{ [key: string]: any }> => {
    const response = await axiosInstance.get('/dashboard/admin');
    return response.data;
  },

  getCandidateDashboard: async (): Promise<{ [key: string]: any }> => {
    const response = await axiosInstance.get('/dashboard/candidate');
    return response.data;
  },
};

export default dashboardService;
