import { randomUUID } from "node:crypto";
import { jobCollection, applicationCollection, interviewCollection, interviewRoomCollection, interviewTranscriptCollection, interviewVideoFrames, interviewMediaRequests, mapJob, mapMatchScore, mapApplication, mapInterview, requireInterviewParticipant, canManageTranscript, mapRoomDescription } from "./jobRepositorySupport.js";

export const interviewsRepository = {
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
      companyId: job.companyId,
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


};
