import { randomUUID } from "node:crypto";
import { jobCollection, applicationCollection, interviewCollection, interviewRoomCollection, interviewTranscriptCollection, interviewVideoFrames, interviewMediaRequests, mapJob, mapMatchScore, mapApplication, mapInterview, requireInterviewParticipant, canManageTranscript, mapRoomDescription } from "./jobRepositorySupport.js";

export const applicationsRepository = {
  async createApplication(jobId, userId, applicant, input) {
    const job = await (await jobCollection()).findOne({ id: jobId, status: "open" });
    if (!job) throw Object.assign(new Error("This job is not available for applications"), { statusCode: 404 });
    const record = { id: randomUUID(), jobId, userId, applicant, ...input, companyId: job.companyId, status: "new", createdAt: new Date(), updatedAt: new Date() };
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


};
