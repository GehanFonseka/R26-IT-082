import { env } from "../config/env.js";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { forwardJson } from "../utils/httpClient.js";

export const registerCertificateRoutes = (app) => {
  app.post("/api/cv/certificates/verify", authenticate, asyncHandler(async (req, res) => {
    res.json(await forwardJson(`${env.services.extraction}/certificates/verify`, req.body, req.requestId, { timeoutMs: env.certificateTimeoutMs }));
  }));
  app.post("/api/cv/certificates/content/verify", authenticate, asyncHandler(async (req, res) => {
    res.json(await forwardJson(`${env.services.extraction}/certificates/content/verify`, req.body, req.requestId, { timeoutMs: env.certificateTimeoutMs }));
  }));
};
