import { getInterviewAnalysis, runInterviewAnalysis } from "../services/analysisService.js";
import { validateInterviewId, validateReferences } from "../validation/analysisValidation.js";

const requireUser = (req) => {
  if (!req.header("x-user-id")) throw Object.assign(new Error("Authenticated user context is required"), { statusCode: 401 });
};

export const analyzeInterview = async (req, res) => {
  requireUser(req);
  const interviewId = validateInterviewId(req.params.interviewId);
  const data = await runInterviewAnalysis(interviewId, req, validateReferences(req.body?.referenceAnswers));
  res.status(201).json({ success: true, data, requestId: req.requestId });
};

export const readInterviewAnalysis = async (req, res) => {
  requireUser(req);
  const data = await getInterviewAnalysis(validateInterviewId(req.params.interviewId));
  if (!data) return res.status(404).json({ success: false, message: "No interview analysis is available yet", requestId: req.requestId });
  return res.json({ success: true, data, requestId: req.requestId });
};
