import { randomUUID } from "node:crypto";
import { companyContext } from "../middleware/companyContext.js";
import { jobCollection, applicationCollection, interviewCollection, interviewRoomCollection, interviewTranscriptCollection, interviewVideoFrames, interviewMediaRequests, mapJob, mapMatchScore, mapApplication, mapInterview, requireInterviewParticipant, canManageTranscript, mapRoomDescription } from "./jobRepositorySupport.js";

export const jobPostsRepository = {
  async createJob(createdBy, job) {
    const context = companyContext.getStore();
    const record = {
      id: randomUUID(), ...job, createdBy, createdAt: new Date(), updatedAt: new Date(),
      company: context?.companyName || job.company,
      publisherCompany: context?.companyId && context.companyName
        ? { id: context.companyId, name: context.companyName } : null,
    };
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
    const editable = { ...changes };
    delete editable.publisherCompany;
    delete editable.companyId;
    await (await jobCollection()).updateOne({ id: jobId }, { $set: { ...editable, updatedAt: new Date() } });
    const job = await (await jobCollection()).findOne({ id: jobId });
    if (!job) throw Object.assign(new Error("Job post not found"), { statusCode: 404 });
    return mapJob(job);
  },


};
