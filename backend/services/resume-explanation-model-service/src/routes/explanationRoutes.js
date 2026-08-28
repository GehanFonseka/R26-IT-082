import { Router } from "express";
import { explainAttrition, explainMatch, explainResume } from "../services/geminiExplanation.js";

const router = Router();
router.post("/explain", async (req, res, next) => {
  try {
    const rawText = typeof req.body?.rawText === "string" ? req.body.rawText.trim() : "";
    if (!rawText || !req.body?.analysis || typeof req.body.analysis !== "object") return res.status(400).json({ success: false, message: "rawText and analysis are required", requestId: req.requestId });
    const explanation = await explainResume({ rawText, analysis: req.body.analysis });
    return res.json({ success: true, explanation, requestId: req.requestId });
  } catch (error) { return next(error); }
});
router.post("/explain-match", async (req, res, next) => {
  try {
    const rawText = typeof req.body?.rawText === "string" ? req.body.rawText.trim() : "";
    const validObject = (value) => value && typeof value === "object";
    if (!rawText || !validObject(req.body?.candidate) || !validObject(req.body?.job) || !validObject(req.body?.matchResult)) return res.status(400).json({ success: false, message: "rawText, candidate, job and matchResult are required", requestId: req.requestId });
    const explanation = await explainMatch({ rawText, candidate: req.body.candidate, job: req.body.job, matchResult: req.body.matchResult });
    return res.json({ success: true, explanation, requestId: req.requestId });
  } catch (error) { return next(error); }
});
router.post("/explain-attrition", async (req, res, next) => {
  try {
    const validObject = (value) => value && typeof value === "object" && !Array.isArray(value);
    if (!validObject(req.body?.candidate) || !validObject(req.body?.simulation) || !validObject(req.body?.context) || !Array.isArray(req.body?.models) || !req.body.models.length) {
      return res.status(400).json({ success: false, message: "candidate, simulation, context and models are required", requestId: req.requestId });
    }
    const explanation = await explainAttrition({ candidate: req.body.candidate, simulation: req.body.simulation, context: req.body.context, models: req.body.models });
    return res.json({ success: true, explanation, requestId: req.requestId });
  } catch (error) { return next(error); }
});
export default router;
