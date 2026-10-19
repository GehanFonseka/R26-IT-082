import { Router } from "express";
import { env } from "../config/env.js";
import { modelStatus } from "../model/model.js";

const router = Router();
router.get("/health", (req, res) => res.json({
  success: true, service: env.serviceName, status: "ok", modelLoaded: modelStatus().loaded, requestId: req.requestId,
}));
export default router;
