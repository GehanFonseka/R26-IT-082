export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: { min: number; max: number };
  description: string;
  requiredSkills: string[];
  postedDate: string;
  applicants: number;
  jobType: 'Full-time' | 'Part-time' | 'Contract' | 'Remote';
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  skills: string[];
  experience: number;
  education: string;
  resume?: string;
  matchScore?: number;
  riskLevel?: 'low' | 'medium' | 'high';
}

export interface Application {
  id: string;
  candidateId: string;
  jobId: string;
  status: 'applied' | 'shortlisted' | 'interview' | 'rejected' | 'offered';
  appliedDate: string;
  aiScore?: number;
}

export interface Interview {
  id: string;
  candidateId: string;
  jobId: string;
  scheduledDate: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  scores?: {
    technical: number;
    communication: number;
    confidence: number;
  };
}

export const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Senior React Developer',
    company: 'Tech Corp',
    location: 'San Francisco, CA',
    salary: { min: 120000, max: 160000 },
    description: 'Looking for an experienced React developer with 5+ years of experience.',
    requiredSkills: ['React', 'TypeScript', 'Node.js', 'CSS'],
    postedDate: '2024-04-20',
    applicants: 45,
    jobType: 'Full-time',
  },
  {
    id: '2',
    title: 'Product Manager',
    company: 'StartUp Inc',
    location: 'New York, NY',
    salary: { min: 100000, max: 140000 },
    description: 'Seeking a PM to lead our product vision and strategy.',
    requiredSkills: ['Product Strategy', 'Analytics', 'Leadership', 'Communication'],
    postedDate: '2024-04-18',
    applicants: 32,
    jobType: 'Full-time',
  },
  {
    id: '3',
    title: 'Data Scientist',
    company: 'AI Solutions',
    location: 'Remote',
    salary: { min: 110000, max: 150000 },
    description: 'Help us build ML models for recruitment optimization.',
    requiredSkills: ['Python', 'Machine Learning', 'SQL', 'Statistics'],
    postedDate: '2024-04-15',
    applicants: 67,
    jobType: 'Remote',
  },
];

export const mockCandidates: Candidate[] = [
  {
    id: 'c1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1-555-0101',
    location: 'San Francisco, CA',
    skills: ['React', 'TypeScript', 'Node.js', 'Python'],
    experience: 5,
    education: 'BS Computer Science',
    matchScore: 92,
    riskLevel: 'low',
  },
  {
    id: 'c2',
    name: 'Sarah Smith',
    email: 'sarah@example.com',
    phone: '+1-555-0102',
    location: 'New York, NY',
    skills: ['Product Management', 'Analytics', 'Leadership'],
    experience: 4,
    education: 'MBA',
    matchScore: 85,
    riskLevel: 'low',
  },
  {
    id: 'c3',
    name: 'Mike Chen',
    email: 'mike@example.com',
    phone: '+1-555-0103',
    location: 'Remote',
    skills: ['Python', 'ML', 'SQL', 'TensorFlow'],
    experience: 3,
    education: 'MS Data Science',
    matchScore: 78,
    riskLevel: 'medium',
  },
];

export const mockApplications: Application[] = [
  {
    id: 'app1',
    candidateId: 'c1',
    jobId: '1',
    status: 'interview',
    appliedDate: '2024-04-25',
    aiScore: 92,
  },
  {
    id: 'app2',
    candidateId: 'c2',
    jobId: '2',
    status: 'shortlisted',
    appliedDate: '2024-04-23',
    aiScore: 85,
  },
  {
    id: 'app3',
    candidateId: 'c3',
    jobId: '3',
    status: 'applied',
    appliedDate: '2024-04-20',
    aiScore: 78,
  },
];

export const mockInterviews: Interview[] = [
  {
    id: 'int1',
    candidateId: 'c1',
    jobId: '1',
    scheduledDate: '2024-05-05 10:00 AM',
    status: 'scheduled',
  },
  {
    id: 'int2',
    candidateId: 'c2',
    jobId: '2',
    scheduledDate: '2024-05-08 02:00 PM',
    status: 'scheduled',
  },
];
