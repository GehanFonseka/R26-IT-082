import { Router } from "express";
import { env } from "../config/env.js";
import { modelStatus } from "../model/nliModel.js";

const router = Router();
router.get("/health", (req, res) => res.json({
  success: true,
  service: env.serviceName,
  status: modelStatus().loaded ? "ok" : "degraded",
  modelLoaded: modelStatus().loaded,
  model: modelStatus().model,
  ...(modelStatus().error ? { modelError: modelStatus().error } : {}),
  requestId: req.requestId,
}));
export default router;
