import { Router } from "express";
import { env } from "../config/env.js";

const router = Router();
router.get("/health", (_req, res) => res.json({ success: true, service: env.serviceName, configured: Boolean(env.apiKey) }));
export default router;
