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

const userHeaders = (req) => ({ "x-user-id": req.user.sub, "x-user-role": req.user.role, "x-company-id": req.user.companyId ?? "", "x-company-name": req.user.companyName ?? "" });
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


export { upload, audioUpload, requireBody, userHeaders, jobHeaders, scoreFields, optionalCandidateAnalysis, scoreCandidateForJob, backfillApplicationScores, enrichApplicationProfilePhotos };
