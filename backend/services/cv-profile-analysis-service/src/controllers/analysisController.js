import { analysisRepository } from "../repositories/analysisRepository.js";
import { analyzeCvWithModel } from "../services/analysisService.js";
import { validateInput } from "../validation/analysisValidation.js";

const userId = (req) => String(req.header("x-user-id") || "");
const requireUser = (req) => { if (!userId(req)) throw Object.assign(new Error("Authenticated user context is required"), { statusCode: 401 }); };

export const analyzeProfile = async (req, res) => {
  requireUser(req);
  const analysis = await analyzeCvWithModel(validateInput(req.body), req.requestId);
  const data = req.header("x-analysis-persist") === "false" ? analysis : await analysisRepository.save(userId(req), analysis);
  res.status(201).json({ success: true, data, requestId: req.requestId });
};

export const readProfileAnalysis = async (req, res) => {
  requireUser(req);
  const data = await analysisRepository.get(userId(req));
  if (!data) return res.status(404).json({ success: false, message: "No CV profile analysis is available yet", requestId: req.requestId });
  return res.json({ success: true, data, requestId: req.requestId });
};
