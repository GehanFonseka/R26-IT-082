// Application-wide constants

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_NOT_FOUND: 'User not found',
  CANDIDATE_NOT_FOUND: 'Candidate not found',
  JOB_NOT_FOUND: 'Job vacancy not found',
  APPLICATION_NOT_FOUND: 'Application not found',
  INVALID_FILE_FORMAT: 'Invalid file format',
  FILE_TOO_LARGE: 'File size exceeds maximum limit',
  INTERNAL_ERROR: 'Internal server error',
};

export const USER_ROLES = {
  ADMIN: 'admin',
  RECRUITER: 'recruiter',
  CANDIDATE: 'candidate',
};

export const APPLICATION_STATUS = {
  SUBMITTED: 'submitted',
  SHORTLISTED: 'shortlisted',
  INTERVIEW_SCHEDULED: 'interview_scheduled',
  INTERVIEWED: 'interviewed',
  SELECTED: 'selected',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
};

export const INTERVIEW_STATUS = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const FILE_CONFIG = {
  ALLOWED_TYPES: ['pdf', 'docx', 'doc'],
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  UPLOAD_DIR: './uploads',
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

export const JWT_CONFIG = {
  EXPIRE: process.env.JWT_EXPIRE || '7d',
  REFRESH_EXPIRE: process.env.REFRESH_TOKEN_EXPIRE || '30d',
};

export const MATCHING_CONFIG = {
  SKILL_WEIGHT: 0.4,
  EXPERIENCE_WEIGHT: 0.3,
  EDUCATION_WEIGHT: 0.2,
  OTHER_WEIGHT: 0.1,
};
