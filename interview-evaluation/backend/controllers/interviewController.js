/**
 * Interview HTTP handlers: start, submit (runs evaluation + AI analysis + cert validation), results, schedule, list.
 * In-memory store for standalone use; align with Backend/controllers/interviewController.js.
 */
import {
  evaluateInterviewFull,
  validateCertifications,
} from '../services/interviewService.js';

const interviews = new Map();

export const startInterview = async (req, res) => {
  const { applicationId, jobId, questions, candidateId, jobTitle, requiredSkills, certifications } =
    req.body;
  if (!applicationId || !jobId || !candidateId) {
    return res.status(400).json({ message: 'applicationId, jobId, candidateId required' });
  }
  const id = `iv_${Date.now()}`;
  const interview = {
    _id: id,
    candidateId,
    jobId,
    applicationId,
    jobTitle: jobTitle || '',
    requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
    certifications: Array.isArray(certifications) ? certifications : [],
    questions: questions || [],
    scheduledAt: new Date().toISOString(),
    status: 'in-progress',
    answers: [],
    scores: null,
    aiAnalysis: null,
    certificationValidation: null,
    feedback: '',
  };
  interviews.set(id, interview);
  res.status(201).json({ message: 'Interview started', interview });
};

export const submitAnswers = async (req, res) => {
  const { answers, certifications, jobTitle, requiredSkills } = req.body;
  const { interviewId } = req.params;
  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({ message: 'answers array required' });
  }
  const interview = interviews.get(interviewId);
  if (!interview) return res.status(404).json({ message: 'Interview not found' });

  interview.answers = answers;
  interview.completedAt = new Date().toISOString();
  interview.status = 'completed';

  const mergedCerts = [
    ...(interview.certifications || []),
    ...(Array.isArray(certifications) ? certifications : []),
  ];

  if (jobTitle != null) interview.jobTitle = jobTitle;
  if (Array.isArray(requiredSkills)) interview.requiredSkills = requiredSkills;

  const jobContext = {
    jobTitle: interview.jobTitle || '',
    requiredSkills: interview.requiredSkills || [],
  };

  const { scores, aiAnalysis, certificationValidation, feedback } = await evaluateInterviewFull(
    answers,
    interview.questions,
    { certifications: mergedCerts, jobContext }
  );

  interview.scores = scores;
  interview.aiAnalysis = aiAnalysis;
  interview.certificationValidation = certificationValidation;
  interview.feedback = feedback;

  interviews.set(interviewId, interview);
  res.status(200).json({ message: 'Answers submitted', interview });
};

export const postValidateCertifications = async (req, res) => {
  const { certifications, jobTitle, requiredSkills } = req.body;
  if (!Array.isArray(certifications)) {
    return res.status(400).json({ message: 'certifications array required' });
  }
  const result = validateCertifications(certifications, {
    jobTitle: jobTitle || '',
    requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
  });
  res.status(200).json({ certificationValidation: result });
};

export const getInterviewResults = async (req, res) => {
  const interview = interviews.get(req.params.interviewId);
  if (!interview) return res.status(404).json({ message: 'Interview not found' });
  res.status(200).json({ interview });
};

export const scheduleInterview = async (req, res) => {
  const {
    candidateId,
    jobId,
    applicationId,
    scheduledAt,
    interviewerIds,
    jobTitle,
    requiredSkills,
    certifications,
  } = req.body;
  if (!candidateId || !jobId || !scheduledAt) {
    return res.status(400).json({ message: 'candidateId, jobId, scheduledAt required' });
  }
  const id = `iv_${Date.now()}`;
  const interview = {
    _id: id,
    candidateId,
    jobId,
    applicationId,
    jobTitle: jobTitle || '',
    requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
    certifications: Array.isArray(certifications) ? certifications : [],
    scheduledAt: new Date(scheduledAt).toISOString(),
    interviewerIds: interviewerIds || [],
    status: 'scheduled',
  };
  interviews.set(id, interview);
  res.status(201).json({ message: 'Interview scheduled', interview });
};

export const getInterviews = async (_req, res) => {
  res.status(200).json({
    interviews: Array.from(interviews.values()),
    pagination: { total: interviews.size, page: 1, limit: 10 },
  });
};
