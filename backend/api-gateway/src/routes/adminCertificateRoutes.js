import { env } from "../config/env.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { forwardJson } from "../utils/httpClient.js";
import { jobHeaders } from "./proxySupport.js";

const applicantId = async (req) => {
  const response = await forwardJson(`${env.services.jobs}/applications`, null, req.requestId,
    { method: "GET", headers: jobHeaders(req), timeoutMs: env.requestTimeoutMs });
  const application = (response.data || []).find((item) => String(item.id) === req.params.applicationId);
  if (!application) throw Object.assign(new Error("Application not found"), { statusCode: 404 });
  const userId = application.applicant?.userId || application.userId;
  if (!userId) throw Object.assign(new Error("This application has no linked candidate profile."), { statusCode: 409 });
  return encodeURIComponent(userId);
};

export const registerAdminCertificateRoutes = (app) => {
  app.get("/api/admin/applications/:applicationId/certificates", authenticate, requireRole("admin"), asyncHandler(async (req, res) => {
    const userId = await applicantId(req);
    const revision = encodeURIComponent(String(req.query.cvRevision || ""));
    res.json(await forwardJson(`${env.services.candidates}/profiles/${userId}/certificates?cvRevision=${revision}`, null, req.requestId,
      { method: "GET", headers: jobHeaders(req), timeoutMs: env.requestTimeoutMs }));
  }));
  app.post("/api/admin/applications/:applicationId/certificates/verify", authenticate, requireRole("admin"), asyncHandler(async (req, res) => {
    const userId = await applicantId(req);
    res.json(await forwardJson(`${env.services.candidates}/profiles/${userId}/certificates/verify`, req.body, req.requestId,
      { headers: jobHeaders(req), timeoutMs: env.certificateTimeoutMs + 10000 }));
  }));
};
