import { assessAttrition } from "../services/attritionAssessmentService.js";
import { predictWithModel } from "../services/attritionModelClient.js";
import { env } from "../config/env.js";

export const predict = async (req, res) => {
  const { candidate, simulation } = req.body ?? {};
  if (!candidate || typeof candidate !== "object") {
    return res.status(400).json({ success: false, message: "candidate object is required", requestId: req.requestId });
  }
  if (simulation !== undefined && (typeof simulation !== "object" || Array.isArray(simulation))) {
    return res.status(400).json({ success: false, message: "simulation must be an object", requestId: req.requestId });
  }
  const result = env.modelServiceUrl
    ? await predictWithModel(candidate, simulation ?? {}, req.requestId)
    : assessAttrition(candidate, simulation ?? {});
  return res.json({ ...result, requestId: req.requestId });
};
