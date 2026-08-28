import { Router } from "express";
import { analyzeInterview, readInterviewAnalysis } from "../controllers/analysisController.js";

const router = Router();
router.post("/interviews/:interviewId/analyze", analyzeInterview);
router.get("/interviews/:interviewId/analysis", readInterviewAnalysis);
export default router;
