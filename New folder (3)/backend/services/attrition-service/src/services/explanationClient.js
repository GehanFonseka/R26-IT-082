import { env } from "../config/env.js";
import { log } from "../utils/logger.js";

const modelEntries = ({ attrition, earlyAttrition }) => [
  ["attrition", attrition, "Attrition"],
  ["earlyAttrition", earlyAttrition, "EarlyAttrition"],
].filter(([, model]) => model).map(([modelKey, model, target]) => ({
  modelKey,
  target: model.target || target,
  modelId: model.modelId || model.modelVersion || "local-model",
  modelInput: model.modelInput || model.featureValues || {},
  modelOutput: {
    riskScore: model.riskScore,
    riskLevel: model.riskLevel,
    probability: model.probability,
    threshold: model.threshold,
    predictedAttrition: model.predictedAttrition,
    method: model.method,
    topRiskDrivers: model.topRiskDrivers || [],
  },
}));

const canonicalModel = (entry, generated = {}) => {
  const localDrivers = entry.modelOutput.topRiskDrivers || [];
  const generatedDrivers = new Map((generated.drivers || []).map((item) => [item.feature, item.explanation]));
  return {
    modelKey: entry.modelKey, target: entry.target, modelId: entry.modelId,
    ...entry.modelOutput, summary: generated.summary || "",
    cvEvidence: generated.cvEvidence || [], jobComparison: generated.jobComparison || "", gaps: generated.gaps || [],
    drivers: localDrivers.map((driver) => ({ ...driver, explanation: generatedDrivers.get(driver.feature) || driver.explanation || "" })),
    recommendations: generated.recommendations || [], limitations: generated.limitations || [],
  };
};

const contextInfo = (context = {}) => ({
  cvAvailable: Boolean(String(context.cvText || "").trim()),
  jobAvailable: Boolean(context.job && Object.values(context.job).some((value) => String(value ?? "").trim())),
});

export async function explainAttrition({ candidate, simulation, context = {}, models, requestId = "" }) {
  const entries = modelEntries(models);
  if (!entries.length) return null;
  const grounding = contextInfo(context);
  try {
    const response = await fetch(`${env.explanationServiceUrl.replace(/\/$/, "")}/explain-attrition`, {
      method: "POST", headers: { "content-type": "application/json", "x-request-id": requestId },
      body: JSON.stringify({ candidate, simulation, context, models: entries }),
      signal: AbortSignal.timeout(env.explanationTimeoutMs),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.message || `Gemini explanation returned HTTP ${response.status}`);
    const generated = body.explanation || {};
    const generatedByKey = new Map((generated.models || []).map((item) => [item.modelKey, item]));
    return {
      status: "live", provider: "gemini", model: generated.model || undefined,
      context: grounding,
      overview: generated.overview || "The local model outputs were reviewed against their exact inputs.",
      models: entries.map((entry) => canonicalModel(entry, generatedByKey.get(entry.modelKey))),
    };
  } catch (error) {
    log("warn", "attrition.explanation.unavailable", { requestId, reason: error.message });
    return { status: "unavailable", provider: "gemini", context: grounding, models: entries.map((entry) => canonicalModel(entry)) };
  }
}
