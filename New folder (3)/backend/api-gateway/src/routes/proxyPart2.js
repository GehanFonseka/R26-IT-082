import { env } from "../config/env.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { forwardJson, forwardMultipart } from "../utils/httpClient.js";
import { upload, audioUpload, requireBody, userHeaders, jobHeaders, scoreFields, optionalCandidateAnalysis, scoreCandidateForJob, backfillApplicationScores, enrichApplicationProfilePhotos } from "./proxySupport.js";

export const registerProxyPart2 = (app) => {
  app.get("/api/interviews/:interviewId/room", authenticate, asyncHandler(async (req, res) => {
    res.json(await forwardJson(`${env.services.jobs}/interviews/${req.params.interviewId}/room`, null, req.requestId, { method: "GET", headers: jobHeaders(req), timeoutMs: env.requestTimeoutMs }));
  }));
  app.get("/api/interviews/:interviewId/livekit-token", authenticate, asyncHandler(async (req, res) => {
    res.json(await forwardJson(`${env.services.jobs}/interviews/${req.params.interviewId}/livekit-token`, null, req.requestId, { method: "GET", headers: jobHeaders(req), timeoutMs: env.requestTimeoutMs }));
  }));
  app.post("/api/interviews/:interviewId/room/offer", authenticate, asyncHandler(async (req, res) => {
    res.json(await forwardJson(`${env.services.jobs}/interviews/${req.params.interviewId}/room/offer`, req.body, req.requestId, { headers: jobHeaders(req), timeoutMs: env.requestTimeoutMs }));
  }));
  app.post("/api/interviews/:interviewId/room/answer", authenticate, asyncHandler(async (req, res) => {
    res.json(await forwardJson(`${env.services.jobs}/interviews/${req.params.interviewId}/room/answer`, req.body, req.requestId, { headers: jobHeaders(req), timeoutMs: env.requestTimeoutMs }));
  }));
  app.get("/api/interviews/:interviewId/room/video-frame", authenticate, asyncHandler(async (req, res) => {
    res.json(await forwardJson(`${env.services.jobs}/interviews/${req.params.interviewId}/room/video-frame`, null, req.requestId, { method: "GET", headers: jobHeaders(req), timeoutMs: env.requestTimeoutMs }));
  }));
  app.post("/api/interviews/:interviewId/room/video-frame", authenticate, asyncHandler(async (req, res) => {
    res.json(await forwardJson(`${env.services.jobs}/interviews/${req.params.interviewId}/room/video-frame`, req.body, req.requestId, { headers: jobHeaders(req), timeoutMs: env.requestTimeoutMs }));
  }));
  app.get("/api/interviews/:interviewId/room/media-request", authenticate, asyncHandler(async (req, res) => {
    res.json(await forwardJson(`${env.services.jobs}/interviews/${req.params.interviewId}/room/media-request`, null, req.requestId, { method: "GET", headers: jobHeaders(req), timeoutMs: env.requestTimeoutMs }));
  }));
  app.post("/api/interviews/:interviewId/room/media-request", authenticate, asyncHandler(async (req, res) => {
    res.json(await forwardJson(`${env.services.jobs}/interviews/${req.params.interviewId}/room/media-request`, req.body, req.requestId, { headers: jobHeaders(req), timeoutMs: env.requestTimeoutMs }));
  }));
  app.get("/api/interviews/:interviewId/transcript", authenticate, asyncHandler(async (req, res) => {
    res.json(await forwardJson(`${env.services.jobs}/interviews/${req.params.interviewId}/transcript`, null, req.requestId, { method: "GET", headers: jobHeaders(req), timeoutMs: env.requestTimeoutMs }));
  }));
  app.post("/api/interviews/:interviewId/transcript", authenticate, asyncHandler(async (req, res) => {
    res.status(201).json(await forwardJson(`${env.services.jobs}/interviews/${req.params.interviewId}/transcript`, req.body, req.requestId, { headers: jobHeaders(req), timeoutMs: env.requestTimeoutMs }));
  }));
  app.patch("/api/interviews/:interviewId/transcript/:entryId", authenticate, asyncHandler(async (req, res) => {
    res.json(await forwardJson(`${env.services.jobs}/interviews/${req.params.interviewId}/transcript/${req.params.entryId}`, req.body, req.requestId, { method: "PATCH", headers: jobHeaders(req), timeoutMs: env.requestTimeoutMs }));
  }));
  app.delete("/api/interviews/:interviewId/transcript/:entryId", authenticate, asyncHandler(async (req, res) => {
    res.json(await forwardJson(`${env.services.jobs}/interviews/${req.params.interviewId}/transcript/${req.params.entryId}`, null, req.requestId, { method: "DELETE", headers: jobHeaders(req), timeoutMs: env.requestTimeoutMs }));
  }));
  app.post("/api/interviews/:interviewId/analysis", authenticate, requireRole("admin"), asyncHandler(async (req, res) => {
    res.status(201).json(await forwardJson(`${env.services.interviewAnalysis}/interviews/${req.params.interviewId}/analyze`, { referenceAnswers: req.body?.referenceAnswers || [] }, req.requestId, { headers: jobHeaders(req), timeoutMs: env.requestTimeoutMs }));
  }));
  app.get("/api/interviews/:interviewId/analysis", authenticate, requireRole("admin"), asyncHandler(async (req, res) => {
    res.json(await forwardJson(`${env.services.interviewAnalysis}/interviews/${req.params.interviewId}/analysis`, null, req.requestId, { method: "GET", headers: jobHeaders(req), timeoutMs: env.requestTimeoutMs }));
  }));
  app.post("/api/interviews/:interviewId/transcribe", authenticate, audioUpload.single("file"), asyncHandler(async (req, res) => {
    if (!req.file) throw Object.assign(new Error("An audio recording is required"), { statusCode: 400 });
    const language = encodeURIComponent(req.body?.language || "en-US");
    res.json(await forwardMultipart(`${env.services.speechToText}/transcribe?language=${language}`, req.file, req.requestId, { timeoutMs: env.requestTimeoutMs }));
  }));
  app.get("/api/jobs", authenticate, asyncHandler(async (req, res) => {
    res.json(await forwardJson(`${env.services.jobs}/jobs?status=open`, null, req.requestId, { method: "GET", headers: jobHeaders(req), timeoutMs: env.requestTimeoutMs }));
  }));
  app.post("/api/jobs/:jobId/applications", authenticate, asyncHandler(async (req, res) => {
    requireBody(req.body, ["candidate"]);
    const jobResponse = await forwardJson(`${env.services.jobs}/jobs/${req.params.jobId}`, null, req.requestId, { method: "GET", headers: jobHeaders(req), timeoutMs: env.requestTimeoutMs });
    const score = await scoreCandidateForJob(jobResponse.data, req.body.candidate, req.requestId);
    const candidateAnalysis = await optionalCandidateAnalysis(req);
    const applicationBody = {
      candidate: req.body.candidate,
      ...(candidateAnalysis ? { candidateAnalysis } : {}),
      coverLetter: req.body.coverLetter,
      matchScore: scoreFields(score),
    };
    res.status(201).json(await forwardJson(`${env.services.jobs}/jobs/${req.params.jobId}/applications`, applicationBody, req.requestId, { headers: jobHeaders(req), timeoutMs: env.requestTimeoutMs }));
  }));
  app.get("/api/applications/me", authenticate, asyncHandler(async (req, res) => {
    res.json(await forwardJson(`${env.services.jobs}/applications/me`, null, req.requestId, { method: "GET", headers: jobHeaders(req), timeoutMs: env.requestTimeoutMs }));
  }));
};
