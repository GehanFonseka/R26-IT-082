import { jobRepository } from "../repositories/jobRepository.js";
import { createInterviewLiveKitToken } from "../services/livekitService.js";
import { getInterviewAnalysisContext as loadInterviewAnalysisContext } from "../repositories/interviewAnalysisContextRepository.js";
import { validateApplication, validateApplicationStatus, validateInterview, validateInterviewUpdate, validateJob, validateMatchScore, validateRoomDescription, validateTranscriptEntry, validateTranscriptUpdate, validateVideoFrame } from "../validation/jobValidation.js";

const requireAdmin = (req, res) => {
  if (req.header("x-user-role") === "admin") return true;
  res.status(403).json({ success: false, message: "Admin role required", requestId: req.requestId });
  return false;
};

const identity = (req) => String(req.header("x-user-id") ?? "");
const role = (req) => String(req.header("x-user-role") ?? "user");
const displayName = (req) => String(req.header("x-user-name") || req.header("x-user-email") || "Participant");

export const listJobs = async (req, res) => res.json({ success: true, data: await jobRepository.listJobs({ status: req.query.status }), requestId: req.requestId });

export const getJob = async (req, res) => {
  const data = await jobRepository.getJob(req.params.jobId);
  if (!data) return res.status(404).json({ success: false, message: "Job post not found", requestId: req.requestId });
  return res.json({ success: true, data, requestId: req.requestId });
};

export const createJob = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const data = await jobRepository.createJob(identity(req), validateJob(req.body));
  return res.status(201).json({ success: true, data, requestId: req.requestId });
};

export const updateJob = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const data = await jobRepository.updateJob(req.params.jobId, validateJob(req.body));
  return res.json({ success: true, data, requestId: req.requestId });
};

export const createApplication = async (req, res) => {
  const applicant = { userId: identity(req), email: String(req.header("x-user-email") ?? ""), displayName: String(req.header("x-user-name") ?? "") };
  const data = await jobRepository.createApplication(req.params.jobId, identity(req), applicant, validateApplication(req.body));
  return res.status(201).json({ success: true, data, requestId: req.requestId });
};

export const listApplications = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  return res.json({ success: true, data: await jobRepository.listApplications(), requestId: req.requestId });
};

export const listMyApplications = async (req, res) => res.json({ success: true, data: await jobRepository.listMyApplications(identity(req)), requestId: req.requestId });

export const updateApplication = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  return res.json({ success: true, data: await jobRepository.updateApplication(req.params.applicationId, validateApplicationStatus(req.body)), requestId: req.requestId });
};

export const updateApplicationScore = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  return res.json({ success: true, data: await jobRepository.updateApplicationScore(req.params.applicationId, validateMatchScore(req.body?.matchScore || req.body)), requestId: req.requestId });
};

export const listInterviews = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  return res.json({ success: true, data: await jobRepository.listInterviews(), requestId: req.requestId });
};

export const listMyInterviews = async (req, res) => res.json({ success: true, data: await jobRepository.listMyInterviews(identity(req)), requestId: req.requestId });

export const createInterview = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  return res.status(201).json({ success: true, data: await jobRepository.createInterview(identity(req), validateInterview(req.body)), requestId: req.requestId });
};

export const updateInterview = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  return res.json({ success: true, data: await jobRepository.updateInterview(req.params.interviewId, validateInterviewUpdate(req.body)), requestId: req.requestId });
};

export const getInterviewRoom = async (req, res) => res.json({ success: true, data: await jobRepository.getInterviewRoom(req.params.interviewId, identity(req), role(req)), requestId: req.requestId });

export const createLiveKitToken = async (req, res) => {
  const userId = identity(req);
  if (!userId) return res.status(401).json({ success: false, message: "Authenticated user context is required", requestId: req.requestId });
  await jobRepository.getInterviewRoom(req.params.interviewId, userId, role(req));
  const data = await createInterviewLiveKitToken({ interviewId: req.params.interviewId, userId, role: role(req), name: displayName(req) });
  return res.json({ success: true, data, requestId: req.requestId });
};

export const saveInterviewOffer = async (req, res) => res.json({ success: true, data: await jobRepository.saveInterviewOffer(req.params.interviewId, identity(req), role(req), validateRoomDescription(req.body).sdp), requestId: req.requestId });

export const saveInterviewAnswer = async (req, res) => res.json({ success: true, data: await jobRepository.saveInterviewAnswer(req.params.interviewId, identity(req), role(req), validateRoomDescription(req.body).sdp), requestId: req.requestId });

export const saveInterviewVideoFrame = async (req, res) => res.json({ success: true, data: await jobRepository.saveInterviewVideoFrame(req.params.interviewId, identity(req), role(req), validateVideoFrame(req.body)), requestId: req.requestId });

export const getInterviewVideoFrame = async (req, res) => res.json({ success: true, data: await jobRepository.getInterviewVideoFrame(req.params.interviewId, identity(req), role(req)), requestId: req.requestId });

export const requestInterviewMedia = async (req, res) => res.json({ success: true, data: await jobRepository.requestInterviewMedia(req.params.interviewId, identity(req), role(req)), requestId: req.requestId });

export const getInterviewMediaRequest = async (req, res) => res.json({ success: true, data: await jobRepository.getInterviewMediaRequest(req.params.interviewId, identity(req), role(req)), requestId: req.requestId });

export const listInterviewTranscript = async (req, res) => res.json({ success: true, data: await jobRepository.listInterviewTranscript(req.params.interviewId, identity(req), role(req)), requestId: req.requestId });

export const appendInterviewTranscript = async (req, res) => res.status(201).json({ success: true, data: await jobRepository.appendInterviewTranscript(req.params.interviewId, identity(req), role(req), displayName(req), validateTranscriptEntry(req.body)), requestId: req.requestId });
export const updateInterviewTranscript = async (req, res) => {
  const data = await jobRepository.updateInterviewTranscript(req.params.interviewId, req.params.entryId, identity(req), role(req), validateTranscriptUpdate(req.body));
  return res.json({ success: true, data, requestId: req.requestId });
};
export const deleteInterviewTranscript = async (req, res) => {
  await jobRepository.deleteInterviewTranscript(req.params.interviewId, req.params.entryId, identity(req), role(req));
  return res.json({ success: true, data: { id: req.params.entryId }, requestId: req.requestId });
};
export const getInterviewAnalysisContext = async (req, res) => res.json({ success: true, data: await loadInterviewAnalysisContext(req.params.interviewId, identity(req), role(req)), requestId: req.requestId });
