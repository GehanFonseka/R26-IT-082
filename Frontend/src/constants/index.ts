// Frontend Constants

// API Configuration
export const API_TIMEOUT = parseInt(process.env.VITE_API_TIMEOUT || '30000', 10);
export const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5000/api';

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  RECRUITER: 'recruiter',
  CANDIDATE: 'candidate',
} as const;

// Application Status
export const APPLICATION_STATUS = {
  SUBMITTED: 'submitted',
  SHORTLISTED: 'shortlisted',
  INTERVIEW_SCHEDULED: 'interview_scheduled',
  INTERVIEWED: 'interviewed',
  SELECTED: 'selected',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
} as const;

// Interview Status
export const INTERVIEW_STATUS = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

// Status Colors (for UI)
export const STATUS_COLORS: Record<string, string> = {
  submitted: 'bg-blue-100 text-blue-800',
  shortlisted: 'bg-green-100 text-green-800',
  interview_scheduled: 'bg-yellow-100 text-yellow-800',
  interviewed: 'bg-purple-100 text-purple-800',
  selected: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  withdrawn: 'bg-gray-100 text-gray-800',
  scheduled: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  PAGE_SIZES: [5, 10, 20, 50],
} as const;

// Validation Rules
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  PHONE_REGEX: /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
  NAME_MIN_LENGTH: 2,
} as const;

// UI Messages
export const MESSAGES = {
  LOGIN_SUCCESS: 'Logged in successfully',
  LOGIN_FAILED: 'Login failed. Please check your credentials',
  LOGOUT_SUCCESS: 'Logged out successfully',
  REGISTRATION_SUCCESS: 'Registration successful. Please login',
  APPLICATION_SUBMITTED: 'Application submitted successfully',
  ERROR_OCCURRED: 'An error occurred. Please try again',
  LOADING: 'Loading...',
  NO_DATA: 'No data available',
} as const;

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  JOBS: '/jobs',
  JOBS_DETAIL: '/jobs/:id',
  APPLICATIONS: '/applications',
  INTERVIEWS: '/interviews',
  CANDIDATES: '/candidates',
  ANALYTICS: '/analytics',
  SETTINGS: '/settings',
  ADMIN_USERS: '/admin/users',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_LOGS: '/admin/logs',
} as const;
