import { Router } from "express";
import { analyzeProfile, readProfileAnalysis } from "../controllers/analysisController.js";

const router = Router();
router.post("/analyze", analyzeProfile);
router.get("/analysis/me", readProfileAnalysis);
export default router;
