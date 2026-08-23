import { randomUUID } from "node:crypto";
import { getDatabase } from "../config/mongo.js";
import { normalizeSessionDescription } from "../validation/jobValidation.js";

const database = () => getDatabase();
const jobCollection = async () => (await database()).collection("jobs");
const applicationCollection = async () => (await database()).collection("applications");
const interviewCollection = async () => (await database()).collection("interviews");
const interviewRoomCollection = async () => (await database()).collection("interviewRooms");
const interviewTranscriptCollection = async () => (await database()).collection("interviewTranscripts");
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

const mapRoomDescription = (description) => description && ({
  ...description,
  sdp: normalizeSessionDescription(description.sdp),
});

export const jobRepository = {
  async createJob(createdBy, job) {
    const record = { id: randomUUID(), ...job, createdBy, createdAt: new Date(), updatedAt: new Date() };
    await (await jobCollection()).insertOne(record);
    return mapJob(record);
  },

  async listJobs({ status } = {}) {
    const query = status ? { status } : {};
    return (await (await jobCollection()).find(query).sort({ createdAt: -1 }).toArray()).map(mapJob);
  },

  async getJob(jobId) {
    return mapJob(await (await jobCollection()).findOne({ id: jobId }));
  },

  async updateJob(jobId, changes) {
    await (await jobCollection()).updateOne({ id: jobId }, { $set: { ...changes, updatedAt: new Date() } });
    const job = await (await jobCollection()).findOne({ id: jobId });
    if (!job) throw Object.assign(new Error("Job post not found"), { statusCode: 404 });
    return mapJob(job);
  },

  async createApplication(jobId, userId, applicant, input) {
    const job = await (await jobCollection()).findOne({ id: jobId, status: "open" });
    if (!job) throw Object.assign(new Error("This job is not available for applications"), { statusCode: 404 });
    const record = { id: randomUUID(), jobId, userId, applicant, ...input, status: "new", createdAt: new Date(), updatedAt: new Date() };
    try {
      await (await applicationCollection()).insertOne(record);
    } catch (error) {
      if (error.code === 11000) throw Object.assign(new Error("You have already applied for this job"), { statusCode: 409 });
      throw error;
    }
    return mapApplication(record, new Map([[job.id, job]]));
  },

  async listApplications() {
    const applications = await (await applicationCollection()).find({}).sort({ createdAt: -1 }).toArray();
    const ids = applications.map((item) => item.jobId);
    const jobs = new Map((await (await jobCollection()).find({ id: { $in: ids } }).toArray()).map((job) => [job.id, job]));
    return applications.map((item) => mapApplication(item, jobs));
  },

  async listMyApplications(userId) {
    const applications = await (await applicationCollection()).find({ userId }).sort({ createdAt: -1 }).toArray();
    const ids = applications.map((item) => item.jobId);
    const jobs = new Map((await (await jobCollection()).find({ id: { $in: ids } }).toArray()).map((job) => [job.id, job]));
    return applications.map((item) => mapApplication(item, jobs));
  },

  async updateApplication(applicationId, status) {
    await (await applicationCollection()).updateOne({ id: applicationId }, { $set: { status, updatedAt: new Date() } });
    const application = await (await applicationCollection()).findOne({ id: applicationId });
    if (!application) throw Object.assign(new Error("Application not found"), { statusCode: 404 });
    const job = await (await jobCollection()).findOne({ id: application?.jobId });
    return mapApplication(application, new Map(job ? [[job.id, job]] : []));
  },

  async updateApplicationScore(applicationId, matchScore) {
    await (await applicationCollection()).updateOne({ id: applicationId }, { $set: { matchScore, updatedAt: new Date() } });
    const application = await (await applicationCollection()).findOne({ id: applicationId });
    if (!application) throw Object.assign(new Error("Application not found"), { statusCode: 404 });
    const job = await (await jobCollection()).findOne({ id: application.jobId });
    return mapApplication(application, new Map(job ? [[job.id, job]] : []));
  },

  async listInterviews() {
    const interviews = await (await interviewCollection()).find({}).sort({ scheduledAt: 1 }).toArray();
    const applicationIds = interviews.map((item) => item.applicationId);
    const jobIds = interviews.map((item) => item.jobId);
    const [applications, jobs] = await Promise.all([
      (await applicationCollection()).find({ id: { $in: applicationIds } }).toArray(),
      (await jobCollection()).find({ id: { $in: jobIds } }).toArray(),
    ]);
    const applicationMap = new Map(applications.map((application) => [application.id, application]));
    const jobMap = new Map(jobs.map((job) => [job.id, job]));
    return interviews.map((interview) => mapInterview(interview, applicationMap, jobMap));
  },

  async listMyInterviews(userId) {
    const applications = await (await applicationCollection()).find({ userId }).toArray();
    const applicationIds = applications.map((application) => application.id);
    if (!applicationIds.length) return [];
    const interviews = await (await interviewCollection()).find({ applicationId: { $in: applicationIds } }).sort({ scheduledAt: 1 }).toArray();
    const jobIds = interviews.map((interview) => interview.jobId);
    const jobs = await (await jobCollection()).find({ id: { $in: jobIds } }).toArray();
    const applicationMap = new Map(applications.map((application) => [application.id, application]));
    const jobMap = new Map(jobs.map((job) => [job.id, job]));
    return interviews.map((interview) => mapInterview(interview, applicationMap, jobMap));
  },

  async createInterview(createdBy, input) {
    const [application, job] = await Promise.all([
      (await applicationCollection()).findOne({ id: input.applicationId }),
      (await jobCollection()).findOne({ id: input.jobId }),
    ]);
    if (!job) throw Object.assign(new Error("Job post not found"), { statusCode: 404 });
    if (!application || application.jobId !== job.id) throw Object.assign(new Error("Application does not belong to this job"), { statusCode: 400 });
    const record = {
      id: randomUUID(),
      ...input,
      createdBy,
      meetingUrl: input.meetingUrl || null,
      scheduledAt: new Date(input.scheduledAt),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await (await interviewCollection()).insertOne(record);
    return mapInterview(record, new Map([[application.id, application]]), new Map([[job.id, job]]));
  },

  async updateInterview(interviewId, changes) {
    const update = { ...changes, updatedAt: new Date() };
    if (changes.scheduledAt) update.scheduledAt = new Date(changes.scheduledAt);
    await (await interviewCollection()).updateOne({ id: interviewId }, { $set: update });
    const interview = await (await interviewCollection()).findOne({ id: interviewId });
    if (!interview) throw Object.assign(new Error("Interview not found"), { statusCode: 404 });
    const [application, job] = await Promise.all([
      (await applicationCollection()).findOne({ id: interview.applicationId }),
      (await jobCollection()).findOne({ id: interview.jobId }),
    ]);
    return mapInterview(interview, new Map(application ? [[application.id, application]] : []), new Map(job ? [[job.id, job]] : []));
  },

  async getInterviewRoom(interviewId, userId, role) {
    await requireInterviewParticipant(interviewId, userId, role);
    const room = await (await interviewRoomCollection()).findOne({ interviewId });
    return room ? { interviewId, offer: mapRoomDescription(room.offer), answer: mapRoomDescription(room.answer), updatedAt: room.updatedAt } : { interviewId, offer: null, answer: null };
  },

  async saveInterviewOffer(interviewId, userId, role, sdp) {
    await requireInterviewParticipant(interviewId, userId, role);
    const offer = { sdp, userId, role, createdAt: new Date() };
    await (await interviewRoomCollection()).updateOne({ interviewId }, { $set: { interviewId, offer, answer: null, updatedAt: new Date() } }, { upsert: true });
    return this.getInterviewRoom(interviewId, userId, role);
  },

  async saveInterviewAnswer(interviewId, userId, role, sdp) {
    await requireInterviewParticipant(interviewId, userId, role);
    const room = await (await interviewRoomCollection()).findOne({ interviewId });
    if (!room?.offer) throw Object.assign(new Error("The interview host has not opened the room yet"), { statusCode: 409 });
    if (room.offer.userId === userId) throw Object.assign(new Error("The room answer must come from the other participant"), { statusCode: 400 });
    const answer = { sdp, userId, role, createdAt: new Date() };
    await (await interviewRoomCollection()).updateOne({ interviewId }, { $set: { answer, updatedAt: new Date() } });
    return this.getInterviewRoom(interviewId, userId, role);
  },

  async saveInterviewVideoFrame(interviewId, userId, role, input) {
    await requireInterviewParticipant(interviewId, userId, role);
    const current = interviewVideoFrames.get(interviewId);
    if (!input.frame) {
      if (!current || !input.sessionId || current.sessionId === input.sessionId) interviewVideoFrames.delete(interviewId);
      return { interviewId, frame: null };
    }
    const record = {
      interviewId,
      frame: input.frame,
      sequence: input.sequence,
      sessionId: input.sessionId,
      userId,
      role,
      updatedAt: new Date(),
    };
    interviewVideoFrames.set(interviewId, record);
    return { interviewId, frame: record.frame, sequence: record.sequence, sessionId: record.sessionId, userId: record.userId, role: record.role, updatedAt: record.updatedAt };
  },

  async getInterviewVideoFrame(interviewId, userId, role) {
    await requireInterviewParticipant(interviewId, userId, role);
    const record = interviewVideoFrames.get(interviewId);
    if (!record || Date.now() - record.updatedAt.getTime() > 10000) {
      interviewVideoFrames.delete(interviewId);
      return { interviewId, frame: null };
    }
    return { interviewId, frame: record.frame, sequence: record.sequence, sessionId: record.sessionId, userId: record.userId, role: record.role, updatedAt: record.updatedAt };
  },

  async requestInterviewMedia(interviewId, userId, role) {
    await requireInterviewParticipant(interviewId, userId, role);
    const request = { id: randomUUID(), interviewId, userId, role, createdAt: new Date() };
    interviewMediaRequests.set(interviewId, request);
    return request;
  },

  async getInterviewMediaRequest(interviewId, userId, role) {
    await requireInterviewParticipant(interviewId, userId, role);
    const request = interviewMediaRequests.get(interviewId);
    if (!request || Date.now() - request.createdAt.getTime() > 5000) {
      interviewMediaRequests.delete(interviewId);
      return null;
    }
    return request;
  },

  async listInterviewTranscript(interviewId, userId, role) {
    await requireInterviewParticipant(interviewId, userId, role);
    return (await (await interviewTranscriptCollection()).find({ interviewId }).sort({ createdAt: 1 }).limit(500).toArray()).map((entry) => ({ ...entry, _id: undefined }));
  },

  async appendInterviewTranscript(interviewId, userId, role, speakerName, input) {
    await requireInterviewParticipant(interviewId, userId, role);
    const record = { id: randomUUID(), interviewId, userId, role, speakerName: String(speakerName || "Participant").slice(0, 160), ...input, createdAt: new Date() };
    await (await interviewTranscriptCollection()).insertOne(record);
    return { ...record, _id: undefined };
  },
};
