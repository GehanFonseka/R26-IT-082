import multer from "multer";
import { env } from "../config/env.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { forwardJson, forwardMultipart } from "../utils/httpClient.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.uploadLimitBytes },
  fileFilter: (_req, file, callback) => {
    const supported = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
    const extension = file.originalname.split(".").pop()?.toLowerCase();
    if (!supported.includes(file.mimetype) && !["pdf", "docx", "txt"].includes(extension)) {
      return callback(Object.assign(new Error("Supported CV formats are PDF, DOCX and TXT"), { statusCode: 415 }));
    }
    return callback(null, true);
  },
});

const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const extension = file.originalname.split(".").pop()?.toLowerCase();
    callback(null, file.mimetype?.startsWith("audio/") || ["webm", "ogg", "wav", "mp4", "m4a"].includes(extension));
  },
});

const requireBody = (body, fields) => {
  if (!body || typeof body !== "object") throw Object.assign(new Error("Request body must be a JSON object"), { statusCode: 400 });
  if (fields.some((field) => !body[field] || typeof body[field] !== "object")) {
    throw Object.assign(new Error(`${fields.join(" and ")} are required`), { statusCode: 400 });
  }
};

const userHeaders = (req) => ({ "x-user-id": req.user.sub, "x-user-role": req.user.role });
const jobHeaders = (req) => ({ ...userHeaders(req), "x-user-email": req.user.email ?? "", "x-user-name": req.user.displayName ?? "" });
const scoreFields = (score) => ({
  probability: score.probability,
  percentage: score.percentage,
  threshold: score.threshold,
  classification: score.classification,
  model: score.model,
  inputVersion: score.inputVersion,
});

const currentMatchInputVersion = "balanced-256-v2";

const optionalCandidateAnalysis = async (req) => {
  try {
    const response = await forwardJson(`${env.services.candidates}/profiles/me`, null, req.requestId, { method: "GET", headers: userHeaders(req), timeoutMs: env.requestTimeoutMs });
    return response.data?.cv?.profileAnalysis || null;
  } catch {
    return null;
  }
};

const scoreCandidateForJob = (job, candidate, requestId) => forwardJson(`${env.services.matching}/match`, { job, candidate }, requestId, { timeoutMs: env.requestTimeoutMs });

const backfillApplicationScores = async (applications, req) => {
  const missing = applications.filter((application) => application.matchScore?.inputVersion !== currentMatchInputVersion && application.candidate && application.jobId);
  if (!missing.length) return applications;
  const jobsResponse = await forwardJson(`${env.services.jobs}/jobs`, null, req.requestId, { method: "GET", headers: jobHeaders(req), timeoutMs: env.requestTimeoutMs });
  const jobs = new Map((jobsResponse.data || []).map((job) => [job.id, job]));
  return Promise.all(applications.map(async (application) => {
    if (application.matchScore?.inputVersion === currentMatchInputVersion || !application.candidate || !jobs.has(application.jobId)) return application;
    try {
      const score = await scoreCandidateForJob(jobs.get(application.jobId), application.candidate, req.requestId);
      const updated = await forwardJson(`${env.services.jobs}/applications/${application.id}/score`, { matchScore: scoreFields(score) }, req.requestId, { method: "PATCH", headers: jobHeaders(req), timeoutMs: env.requestTimeoutMs });
      return updated.data || { ...application, matchScore: scoreFields(score) };
    } catch {
      return application;
    }
  }));
};

const enrichApplicationProfilePhotos = async (applications, req) => {
  const userIds = [...new Set(applications.map((application) => application.applicant?.userId).filter(Boolean))];
  if (!userIds.length) return applications;
  try {
    const response = await forwardJson(`${env.services.candidates}/profiles/photos`, { userIds }, req.requestId, { method: "POST", headers: jobHeaders(req), timeoutMs: env.requestTimeoutMs });
    const photos = new Map((response.data || []).map((profile) => [profile.userId, profile.profilePhoto || ""]));
    return applications.map((application) => ({
      ...application,
      applicant: {
        ...(application.applicant || {}),
        profilePhoto: photos.get(application.applicant?.userId) || application.applicant?.profilePhoto || "",
      },
    }));
  } catch {
    // Profile photos are an optional presentation enhancement. A profile or
    // candidate-service outage must not hide the admin application list.
    return applications;
  }
};

export const registerProxyRoutes = (app) => {
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
  app.get("/api/interviews/:interviewId/room", authenticate, asyncHandler(async (req, res) => {
    res.json(await forwardJson(`${env.services.jobs}/interviews/${req.params.interviewId}/room`, null, req.requestId, { method: "GET", headers: jobHeaders(req), timeoutMs: env.requestTimeoutMs }));
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
