import { assessAttrition } from "../services/attritionAssessmentService.js";
import { predictEarlyAttrition, predictWithModel } from "../services/attritionModelClient.js";
import { env } from "../config/env.js";
import { calculateAttritionFeatures } from "../utils/featureCalculator.js";
import { explainAttrition } from "../services/explanationClient.js";

const safeModelCall = (call) => call.then((result) => ({ result })).catch((error) => ({ error: error.message }));
const agreement = (attrition, early) => {
  if (!attrition || !early) return "single-model";
  const sameSide = attrition.predictedAttrition === early.predictedAttrition;
  return sameSide ? "agreement" : "disagreement";
};

export const predict = async (req, res) => {
  const { candidate, simulation, context } = req.body ?? {};
  if (!candidate || typeof candidate !== "object") {
    return res.status(400).json({ success: false, message: "candidate object is required", requestId: req.requestId });
  }
  if (simulation !== undefined && (typeof simulation !== "object" || Array.isArray(simulation))) {
    return res.status(400).json({ success: false, message: "simulation must be an object", requestId: req.requestId });
  }
  if (context !== undefined && (typeof context !== "object" || Array.isArray(context))) {
    return res.status(400).json({ success: false, message: "context must be an object", requestId: req.requestId });
  }
  const currentSimulation = simulation ?? {};
  const earlyFeatures = calculateAttritionFeatures(candidate, currentSimulation);
  if (!env.modelServiceUrl && !env.earlyModelServiceUrl) {
    return res.json({ ...assessAttrition(candidate, currentSimulation), requestId: req.requestId });
  }
  const calls = await Promise.all([
    env.modelServiceUrl ? safeModelCall(predictWithModel(candidate, currentSimulation, req.requestId)) : Promise.resolve({}),
    env.earlyModelServiceUrl ? safeModelCall(predictEarlyAttrition(earlyFeatures, currentSimulation, req.requestId)) : Promise.resolve({}),
  ]);
  const attrition = calls[0].result;
  const earlyAttrition = calls[1].result;
  const primary = attrition || earlyAttrition;
  if (!primary) return res.status(503).json({ success: false, message: "Attrition model services are unavailable", requestId: req.requestId });
  const explainability = await explainAttrition({
    candidate, simulation: currentSimulation, context: context ?? {}, models: { attrition, earlyAttrition }, requestId: req.requestId,
  });
  return res.json({
    ...primary,
    target: primary.target || (attrition ? "Attrition" : "EarlyAttrition"),
    models: { attrition: attrition || null, earlyAttrition: earlyAttrition || null },
    modelAgreement: agreement(attrition, earlyAttrition),
    modelWarnings: [calls[0].error, calls[1].error].filter(Boolean),
    earlyAttritionFeatures: earlyFeatures,
    ...(explainability ? { explainability } : {}),
    requestId: req.requestId,
  });
};
