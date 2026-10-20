import { env } from "../config/env.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { forwardJson, forwardMultipart } from "../utils/httpClient.js";
import { upload, audioUpload, requireBody, userHeaders, jobHeaders, scoreFields, optionalCandidateAnalysis, scoreCandidateForJob, backfillApplicationScores, enrichApplicationProfilePhotos } from "./proxySupport.js";

export const registerProxyPart1 = (app) => {
  app.post("/api/cv/extract", authenticate, upload.single("file"), asyncHandler(async (req, res) => {
    if (!req.file) throw Object.assign(new Error("A PDF, DOCX, or TXT CV file is required"), { statusCode: 400 });
    const body = await forwardMultipart(`${env.services.extraction}/extract`, req.file, req.requestId, { timeoutMs: env.requestTimeoutMs });
    res.json(body);
  }));

  app.post("/api/cv/analyze", authenticate, asyncHandler(async (req, res) => {
    requireBody(req.body, ["candidate"]);
    res.status(201).json(await forwardJson(`${env.services.cvProfileAnalysis}/analyze`, req.body, req.requestId, { headers: userHeaders(req), timeoutMs: env.requestTimeoutMs }));
  }));
  app.get("/api/cv/analysis/me", authenticate, asyncHandler(async (req, res) => {
    res.json(await forwardJson(`${env.services.cvProfileAnalysis}/analysis/me`, null, req.requestId, { method: "GET", headers: userHeaders(req), timeoutMs: env.requestTimeoutMs }));
  }));

  app.post("/api/match/score", asyncHandler(async (req, res) => {
    requireBody(req.body, ["job", "candidate"]);
    res.json(await forwardJson(`${env.services.matching}/match`, req.body, req.requestId, { timeoutMs: env.requestTimeoutMs }));
  }));
  app.post("/api/match/explain", authenticate, asyncHandler(async (req, res) => {
    requireBody(req.body, ["candidate", "job", "matchResult"]);
    if (typeof req.body.rawText !== "string" || !req.body.rawText.trim()) throw Object.assign(new Error("rawText is required"), { statusCode: 400 });
    res.json(await forwardJson(`${env.services.matching}/explain`, req.body, req.requestId, { timeoutMs: env.requestTimeoutMs }));
  }));

  app.post("/api/attrition/predict", asyncHandler(async (req, res) => {
    requireBody(req.body, ["candidate", "simulation"]);
    res.json(await forwardJson(`${env.services.attrition}/predict`, req.body, req.requestId, { timeoutMs: env.requestTimeoutMs }));
  }));

  app.post("/api/auth/register", asyncHandler(async (req, res) => {
    res.status(201).json(await forwardJson(`${env.services.auth}/register`, req.body, req.requestId, { timeoutMs: env.requestTimeoutMs }));
  }));
  app.post("/api/auth/login", asyncHandler(async (req, res) => {
    res.json(await forwardJson(`${env.services.auth}/login`, req.body, req.requestId, { timeoutMs: env.requestTimeoutMs }));
  }));
  app.post("/api/auth/refresh", asyncHandler(async (req, res) => {
    res.json(await forwardJson(`${env.services.auth}/refresh`, req.body, req.requestId, { timeoutMs: env.requestTimeoutMs }));
  }));
  app.post("/api/auth/logout", asyncHandler(async (req, res) => {
    res.status(204).send();
  }));

  app.get("/api/candidates/profiles/me", authenticate, asyncHandler(async (req, res) => {
    res.json(await forwardJson(`${env.services.candidates}/profiles/me`, null, req.requestId, { method: "GET", headers: userHeaders(req), timeoutMs: env.requestTimeoutMs }));
  }));
  app.put("/api/candidates/profiles/me", authenticate, asyncHandler(async (req, res) => {
    res.json(await forwardJson(`${env.services.candidates}/profiles/me`, req.body, req.requestId, { method: "PUT", headers: userHeaders(req), timeoutMs: env.requestTimeoutMs }));
  }));

  app.get("/api/admin/jobs", authenticate, requireRole("admin"), asyncHandler(async (req, res) => {
    res.json(await forwardJson(`${env.services.jobs}/jobs`, null, req.requestId, { method: "GET", headers: jobHeaders(req), timeoutMs: env.requestTimeoutMs }));
  }));
  app.post("/api/admin/jobs", authenticate, requireRole("admin"), asyncHandler(async (req, res) => {
    res.status(201).json(await forwardJson(`${env.services.jobs}/jobs`, req.body, req.requestId, { headers: jobHeaders(req), timeoutMs: env.requestTimeoutMs }));
  }));
  app.patch("/api/admin/jobs/:jobId", authenticate, requireRole("admin"), asyncHandler(async (req, res) => {
    res.json(await forwardJson(`${env.services.jobs}/jobs/${req.params.jobId}`, req.body, req.requestId, { method: "PATCH", headers: jobHeaders(req), timeoutMs: env.requestTimeoutMs }));
  }));
  app.get("/api/admin/applications", authenticate, requireRole("admin"), asyncHandler(async (req, res) => {
    const response = await forwardJson(`${env.services.jobs}/applications`, null, req.requestId, { method: "GET", headers: jobHeaders(req), timeoutMs: env.requestTimeoutMs });
    response.data = await backfillApplicationScores(response.data || [], req);
    response.data = await enrichApplicationProfilePhotos(response.data, req);
    res.json(response);
  }));
  app.get("/api/admin/applications/:applicationId/cv-context", authenticate, requireRole("admin"), asyncHandler(async (req, res) => {
    const response = await forwardJson(`${env.services.jobs}/applications`, null, req.requestId, { method: "GET", headers: jobHeaders(req), timeoutMs: env.requestTimeoutMs });
    const application = (response.data || []).find((item) => item.id === req.params.applicationId);
    if (!application) throw Object.assign(new Error("Application not found"), { statusCode: 404 });
    const profile = application.applicant?.userId
      ? await forwardJson(`${env.services.candidates}/profiles/${application.applicant.userId}`, null, req.requestId, { method: "GET", headers: jobHeaders(req), timeoutMs: env.requestTimeoutMs })
      : { data: {} };
    res.json({ success: true, data: { rawText: profile.data?.cv?.rawText || "", candidate: profile.data?.cv?.candidate || application.candidate || {} }, requestId: req.requestId });
  }));
  app.post("/api/admin/applications/:applicationId/cv-analysis", authenticate, requireRole("admin"), asyncHandler(async (req, res) => {
    const response = await forwardJson(`${env.services.jobs}/applications`, null, req.requestId, { method: "GET", headers: jobHeaders(req), timeoutMs: env.requestTimeoutMs });
    const application = (response.data || []).find((item) => item.id === req.params.applicationId);
    if (!application) throw Object.assign(new Error("Application not found"), { statusCode: 404 });
    if (application.candidateAnalysis) return res.json({ success: true, data: application.candidateAnalysis, requestId: req.requestId });
    const profile = await forwardJson(`${env.services.candidates}/profiles/${application.applicant?.userId}`, null, req.requestId, { method: "GET", headers: jobHeaders(req), timeoutMs: env.requestTimeoutMs });
    res.status(201).json(await forwardJson(`${env.services.cvProfileAnalysis}/analyze`, { rawText: profile.data?.cv?.rawText || "", candidate: profile.data?.cv?.candidate || application.candidate, job: application.job }, req.requestId, { headers: { ...userHeaders(req), "x-analysis-persist": "false" }, timeoutMs: env.requestTimeoutMs }));
  }));
  app.patch("/api/admin/applications/:applicationId", authenticate, requireRole("admin"), asyncHandler(async (req, res) => {
    res.json(await forwardJson(`${env.services.jobs}/applications/${req.params.applicationId}`, req.body, req.requestId, { method: "PATCH", headers: jobHeaders(req), timeoutMs: env.requestTimeoutMs }));
  }));
  app.patch("/api/admin/applications/:applicationId/score", authenticate, requireRole("admin"), asyncHandler(async (req, res) => {
    res.json(await forwardJson(`${env.services.jobs}/applications/${req.params.applicationId}/score`, req.body, req.requestId, { method: "PATCH", headers: jobHeaders(req), timeoutMs: env.requestTimeoutMs }));
  }));
  app.get("/api/admin/interviews", authenticate, requireRole("admin"), asyncHandler(async (req, res) => {
    res.json(await forwardJson(`${env.services.jobs}/interviews`, null, req.requestId, { method: "GET", headers: jobHeaders(req), timeoutMs: env.requestTimeoutMs }));
  }));
  app.post("/api/admin/interviews", authenticate, requireRole("admin"), asyncHandler(async (req, res) => {
    res.status(201).json(await forwardJson(`${env.services.jobs}/interviews`, req.body, req.requestId, { headers: jobHeaders(req), timeoutMs: env.requestTimeoutMs }));
  }));
  app.patch("/api/admin/interviews/:interviewId", authenticate, requireRole("admin"), asyncHandler(async (req, res) => {
    res.json(await forwardJson(`${env.services.jobs}/interviews/${req.params.interviewId}`, req.body, req.requestId, { method: "PATCH", headers: jobHeaders(req), timeoutMs: env.requestTimeoutMs }));
  }));
  app.get("/api/interviews/me", authenticate, asyncHandler(async (req, res) => {
    res.json(await forwardJson(`${env.services.jobs}/interviews/me`, null, req.requestId, { method: "GET", headers: jobHeaders(req), timeoutMs: env.requestTimeoutMs }));
  }));

};
