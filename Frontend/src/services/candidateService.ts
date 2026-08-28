import axiosInstance from './axiosConfig';

export interface CandidateProfile {
  _id?: string;
  userId: string;
  skills: string[];
  education: string;
  experience: number;
  location: string;
  bio: string;
  phone: string;
  github: string;
  portfolio: string;
  resumeUrl?: string;
  resumeFileName?: string;
}

const candidateService = {
  getProfile: async (): Promise<{ profile: CandidateProfile }> => {
    const response = await axiosInstance.get('/candidate/profile');
    return response.data;
  },

  getProfileById: async (userId: string): Promise<{ profile: CandidateProfile }> => {
    const response = await axiosInstance.get(`/candidate/profile/${userId}`);
    return response.data;
  },

  updateProfile: async (profileData: Partial<CandidateProfile>) => {
    const response = await axiosInstance.post('/candidate/profile', profileData);
    return response.data;
  },

  uploadResume: async (file: File) => {
    const formData = new FormData();
    formData.append('resume', file);

    const response = await axiosInstance.post('/candidate/resume/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  addSkill: async (skill: string) => {
    const profile = await candidateService.getProfile();
    const skills = [...profile.profile.skills, skill];
    return candidateService.updateProfile({ skills });
  },

  removeSkill: async (skill: string) => {
    const profile = await candidateService.getProfile();
    const skills = profile.profile.skills.filter((s) => s !== skill);
    return candidateService.updateProfile({ skills });
  },
};

export default candidateService;
