import { randomUUID } from "node:crypto";
import { jobCollection, applicationCollection, interviewCollection, interviewRoomCollection, interviewTranscriptCollection, interviewVideoFrames, interviewMediaRequests, mapJob, mapMatchScore, mapApplication, mapInterview, requireInterviewParticipant, canManageTranscript, mapRoomDescription } from "./jobRepositorySupport.js";

export const interviewTranscriptRepository = {
  async listInterviewTranscript(interviewId, userId, role) {
    await requireInterviewParticipant(interviewId, userId, role);
    return (await (await interviewTranscriptCollection()).find({ interviewId }).sort({ createdAt: 1 }).limit(500).toArray()).map((entry) => ({ ...entry, _id: undefined }));
  },

  async appendInterviewTranscript(interviewId, userId, role, speakerName, input) {
    const interview = await requireInterviewParticipant(interviewId, userId, role);
    const record = { id: randomUUID(), interviewId, userId, role, speakerName: String(speakerName || "Participant").slice(0, 160), ...input, companyId: interview.companyId, createdAt: new Date() };
    await (await interviewTranscriptCollection()).insertOne(record);
    return { ...record, _id: undefined };
  },

  async updateInterviewTranscript(interviewId, entryId, userId, role, input) {
    await requireInterviewParticipant(interviewId, userId, role);
    const collection = await interviewTranscriptCollection();
    const existing = await collection.findOne({ id: entryId, interviewId });
    if (!existing) throw Object.assign(new Error("Transcript entry not found"), { statusCode: 404 });
    if (!canManageTranscript(existing, userId, role)) throw Object.assign(new Error("You can only edit your own transcript messages"), { statusCode: 403 });
    const updatedAt = new Date();
    await collection.updateOne({ id: entryId, interviewId }, { $set: { text: input.text, updatedAt } });
    return { ...existing, text: input.text, updatedAt, _id: undefined };
  },

  async deleteInterviewTranscript(interviewId, entryId, userId, role) {
    await requireInterviewParticipant(interviewId, userId, role);
    const collection = await interviewTranscriptCollection();
    const existing = await collection.findOne({ id: entryId, interviewId });
    if (!existing) throw Object.assign(new Error("Transcript entry not found"), { statusCode: 404 });
    if (!canManageTranscript(existing, userId, role)) throw Object.assign(new Error("You can only delete your own transcript messages"), { statusCode: 403 });
    await collection.deleteOne({ id: entryId, interviewId });
    return { id: entryId };
  },
};
