import { Router } from "express";
import { env } from "../config/env.js";
const router = Router();
router.get("/health", (req, res) => res.json({
  success: true, service: env.serviceName, status: "ok",
  method: env.modelServiceUrl && env.earlyModelServiceUrl ? "local-catboost-and-early-attrition-models" : env.modelServiceUrl ? "local-catboost-model" : env.earlyModelServiceUrl ? "local-early-attrition-model" : "rule-based",
  modelServiceConfigured: Boolean(env.modelServiceUrl),
  earlyModelServiceConfigured: Boolean(env.earlyModelServiceUrl),
  timestamp: new Date().toISOString(), requestId: req.requestId,
}));
export default router;
