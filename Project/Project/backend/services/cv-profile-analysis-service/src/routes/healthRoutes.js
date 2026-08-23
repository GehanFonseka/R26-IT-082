import { Router } from "express";
import { env } from "../config/env.js";

const router = Router();
router.get("/health", (_req, res) => res.json({ success: true, service: env.serviceName, status: "ok" }));
export default router;
