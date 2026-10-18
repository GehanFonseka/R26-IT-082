import { randomUUID } from "node:crypto";
import { companyCollection } from "./companyCollection.js";
import { normalizeSessionDescription } from "../validation/jobValidation.js";

const jobCollection = async () => companyCollection("jobs");
const applicationCollection = async () => companyCollection("applications");
const interviewCollection = async () => companyCollection("interviews");
const interviewRoomCollection = async () => companyCollection("interviewRooms");
const interviewTranscriptCollection = async () => companyCollection("interviewTranscripts");
const interviewVideoFrames = new Map();
const interviewMediaRequests = new Map();

const mapJob = (job) => job && ({ ...job, _id: undefined });
const mapMatchScore = (score) => {
  if (!score || typeof score !== "object") return score;
  const probability = Number(score.probability);
  return {
    ...score,
    percentage: Number.isFinite(probability) ? Number((probability * 100).toFixed(2)) : score.percentage,
  };
};
const mapApplication = (application, jobs) => {
  if (!application) return application;
  const job = jobs.get(application.jobId);
  return {
    ...application,
    _id: undefined,
    jobTitle: job?.title ?? "Unknown job",
    job: mapJob(job),
    matchScore: mapMatchScore(application.matchScore),
  };
};
const mapInterview = (interview, applications, jobs) => {
  if (!interview) return interview;
  const application = applications.get(interview.applicationId);
  const job = jobs.get(interview.jobId);
  return {
    ...interview,
    _id: undefined,
    scheduledAt: interview.scheduledAt instanceof Date ? interview.scheduledAt.toISOString() : interview.scheduledAt,
    // Interviews use the first-party WebRTC room at /interviews/:interviewId.
    // Keep the legacy field for backwards-compatible records, but never invent
    // an external meeting provider URL for a new schedule.
    meetingUrl: interview.meetingUrl || null,
    job: mapJob(job),
    application: application ? mapApplication(application, new Map(job ? [[job.id, job]] : [])) : undefined,
  };
};

const requireInterviewParticipant = async (interviewId, userId, role) => {
  const interview = await (await interviewCollection()).findOne({ id: interviewId });
  if (!interview) throw Object.assign(new Error("Interview not found"), { statusCode: 404 });
  if (role === "admin") return interview;
  const application = await (await applicationCollection()).findOne({ id: interview.applicationId, userId });
  if (!application) throw Object.assign(new Error("You are not a participant in this interview"), { statusCode: 403 });
  return interview;
};

const canManageTranscript = (entry, userId, role) => (
  entry.role === "admin" ? role === "admin" : entry.userId === userId
);

const mapRoomDescription = (description) => description && ({
  ...description,
  sdp: normalizeSessionDescription(description.sdp),
});


export { jobCollection, applicationCollection, interviewCollection, interviewRoomCollection, interviewTranscriptCollection, interviewVideoFrames, interviewMediaRequests, mapJob, mapMatchScore, mapApplication, mapInterview, requireInterviewParticipant, canManageTranscript, mapRoomDescription };
