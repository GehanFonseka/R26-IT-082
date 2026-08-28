import axiosInstance from './axiosConfig';

export interface RiskPrediction {
  _id: string;
  candidateId: string;
  jobId: string;
  applicationId: string;
  riskLevel: 'low' | 'medium' | 'high';
  probability: number;
  factors: Array<{
    factor: string;
    weight: number;
    description: string;
  }>;
  prediction: {
    jobHopping: number;
    skillMismatch: number;
    cultural_fit: number;
    overqualified: number;
    underqualified: number;
  };
  explanation: string;
}

const riskService = {
  predictRisk: async (
    candidateId: string,
    jobId: string,
    applicationId?: string
  ): Promise<{ risk: RiskPrediction }> => {
    const response = await axiosInstance.post('/risk/predict', {
      candidateId,
      jobId,
      applicationId,
    });
    return response.data;
  },

  getRiskPrediction: async (riskId: string): Promise<{ riskPrediction: RiskPrediction }> => {
    const response = await axiosInstance.get(`/risk/${riskId}`);
    return response.data;
  },

  getRiskPredictions: async (
    page = 1,
    limit = 10,
    candidateId = '',
    jobId = '',
    riskLevel = ''
  ) => {
    const response = await axiosInstance.get('/risk/all', {
      params: { page, limit, candidateId, jobId, riskLevel },
    });
    return response.data;
  },

  getRiskColor: (level: string): string => {
    switch (level?.toLowerCase()) {
      case 'low':
        return '#10b981'; // green
      case 'medium':
        return '#f59e0b'; // yellow
      case 'high':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  },

  getRiskLabel: (level: string): string => {
    switch (level?.toLowerCase()) {
      case 'low':
        return 'Low Risk';
      case 'medium':
        return 'Medium Risk';
      case 'high':
        return 'High Risk';
      default:
        return 'Unknown';
    }
  },
};

export default riskService;
