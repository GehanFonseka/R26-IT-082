import { env } from "../config/env.js";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { forwardJson } from "../utils/httpClient.js";
import { userHeaders } from "./proxySupport.js";

export const registerCandidateCertificateRoutes = (app) => {
  app.get("/api/candidates/profiles/me/certificates", authenticate, asyncHandler(async (req, res) => {
    const revision = encodeURIComponent(String(req.query.cvRevision || ""));
    res.json(await forwardJson(`${env.services.candidates}/profiles/me/certificates?cvRevision=${revision}`, null, req.requestId,
      { method: "GET", headers: userHeaders(req), timeoutMs: env.requestTimeoutMs }));
  }));
  app.post("/api/candidates/profiles/me/certificates/verify", authenticate, asyncHandler(async (req, res) => {
    res.json(await forwardJson(`${env.services.candidates}/profiles/me/certificates/verify`, req.body, req.requestId,
      { headers: userHeaders(req), timeoutMs: env.certificateTimeoutMs + 10000 }));
  }));
};
