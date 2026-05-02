// TypeScript type definitions for Backend

/**
 * User Types
 */
interface IUser {
  _id: string;
  email: string;
  password: string;
  fullName: string;
  role: 'admin' | 'recruiter' | 'candidate';
  phone: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Candidate Profile Types
 */
interface ICandidate extends IUser {
  profile: {
    title: string;
    bio: string;
    skills: string[];
    experience: number;
    education: IEducation[];
    certifications: string[];
  };
  resume: {
    fileName: string;
    filePath: string;
    uploadedAt: Date;
  };
}

interface IEducation {
  institution: string;
  degree: string;
  field: string;
  startYear: number;
  endYear: number;
}

/**
 * Job Vacancy Types
 */
interface IVacancy {
  _id: string;
  title: string;
  description: string;
  requirements: string[];
  skills: string[];
  experience: number;
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  location: string;
  createdBy: string;
  status: 'open' | 'closed' | 'on_hold';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Application Types
 */
interface IApplication {
  _id: string;
  candidateId: string;
  vacancyId: string;
  status: string;
  matchScore: number;
  appliedAt: Date;
  updatedAt: Date;
}

/**
 * Interview Types
 */
interface IInterview {
  _id: string;
  applicationId: string;
  candidateId: string;
  vacancyId: string;
  status: string;
  scheduledDate: Date;
  result: {
    score: number;
    feedback: string;
    passed: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Risk Prediction Types
 */
interface IRiskPrediction {
  _id: string;
  employeeId: string;
  riskScore: number;
  factors: string[];
  prediction: 'high' | 'medium' | 'low';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * API Response Types
 */
interface IApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  statusCode: number;
}

interface IPaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface IPaginatedResponse<T> extends IApiResponse<T[]> {
  meta: IPaginationMeta;
}

/**
 * Request/Response Error Types
 */
interface IErrorResponse {
  success: false;
  message: string;
  statusCode: number;
  error: string;
  timestamp: string;
}

export {
  IUser,
  ICandidate,
  IEducation,
  IVacancy,
  IApplication,
  IInterview,
  IRiskPrediction,
  IApiResponse,
  IPaginationMeta,
  IPaginatedResponse,
  IErrorResponse,
};
