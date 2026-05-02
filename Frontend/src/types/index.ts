// Frontend TypeScript Type Definitions

// User Types
export interface IUser {
  _id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'recruiter' | 'candidate';
  phone: string;
  avatar?: string;
  createdAt: string;
}

// Auth Types
export interface IAuthState {
  user: IUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export interface ILoginPayload {
  email: string;
  password: string;
}

export interface IRegisterPayload extends ILoginPayload {
  fullName: string;
  phone: string;
  role: 'candidate' | 'recruiter';
}

// Candidate Types
export interface ICandidate extends IUser {
  profile: {
    title: string;
    bio: string;
    skills: string[];
    experience: number;
    education: IEducation[];
  };
  resume?: {
    fileName: string;
    uploadedAt: string;
  };
}

export interface IEducation {
  institution: string;
  degree: string;
  field: string;
  startYear: number;
  endYear: number;
}

// Job Types
export interface IVacancy {
  _id: string;
  title: string;
  description: string;
  skills: string[];
  experience: number;
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  location: string;
  status: 'open' | 'closed' | 'on_hold';
  createdAt: string;
}

// Application Types
export interface IApplication {
  _id: string;
  candidateId: string;
  vacancyId: string;
  vacancyTitle?: string;
  status: 'submitted' | 'shortlisted' | 'interview_scheduled' | 'interviewed' | 'selected' | 'rejected';
  matchScore: number;
  appliedAt: string;
  updatedAt: string;
}

// Interview Types
export interface IInterview {
  _id: string;
  applicationId: string;
  candidateId: string;
  candidateName?: string;
  vacancyTitle?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduledDate: string;
  result?: {
    score: number;
    feedback: string;
    passed: boolean;
  };
}

// API Response Types
export interface IApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  statusCode: number;
}

export interface IPaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Dashboard Types
export interface IDashboardStats {
  totalApplications: number;
  shortlistedCount: number;
  interviewedCount: number;
  selectedCount: number;
  averageMatchScore: number;
}

export interface IRiskMetrics {
  employeeId: string;
  riskScore: number;
  prediction: 'high' | 'medium' | 'low';
  factors: string[];
}
