import { Router } from "express";
import { env } from "../config/env.js";

const router = Router();
router.get("/health", (req, res) => res.json({ success: true, service: env.serviceName, status: "ok", requestId: req.requestId }));
export default router;
