import { randomUUID } from "node:crypto";
import { jobCollection, applicationCollection, interviewCollection, interviewRoomCollection, interviewTranscriptCollection, interviewVideoFrames, interviewMediaRequests, mapJob, mapMatchScore, mapApplication, mapInterview, requireInterviewParticipant, canManageTranscript, mapRoomDescription } from "./jobRepositorySupport.js";

export const interviewRoomRepository = {
  async getInterviewRoom(interviewId, userId, role) {
    await requireInterviewParticipant(interviewId, userId, role);
    const room = await (await interviewRoomCollection()).findOne({ interviewId });
    return room ? { interviewId, offer: mapRoomDescription(room.offer), answer: mapRoomDescription(room.answer), updatedAt: room.updatedAt } : { interviewId, offer: null, answer: null };
  },

  async saveInterviewOffer(interviewId, userId, role, sdp) {
    const interview = await requireInterviewParticipant(interviewId, userId, role);
    const offer = { sdp, userId, role, createdAt: new Date() };
    await (await interviewRoomCollection()).updateOne({ interviewId }, { $set: { interviewId, companyId: interview.companyId, offer, answer: null, updatedAt: new Date() } }, { upsert: true });
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


};
