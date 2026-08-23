import { ATTRITION_FEATURES, ATTRITION_WEIGHTS } from "../config/attritionContract.js";
import { calculateAttritionFeatures } from "../utils/featureCalculator.js";

const levelFor = (score) => score < 35 ? "low" : score < 65 ? "medium" : "high";
const labelFor = (level) => ({ low: "Low attrition risk", medium: "Moderate attrition risk", high: "High attrition risk" })[level];

export function assessAttrition(candidate, simulation = {}) {
  const featureValues = calculateAttritionFeatures(candidate, simulation);
  const totalWeight = ATTRITION_FEATURES.reduce((sum, name) => sum + ATTRITION_WEIGHTS[name], 0);
  const weightedRisk = ATTRITION_FEATURES.reduce((sum, name) => sum + featureValues[name] * ATTRITION_WEIGHTS[name], 0) / totalWeight;
  const riskScore = Math.round(weightedRisk * 100);
  const riskLevel = levelFor(riskScore);
  return {
    success: true, riskScore, riskLevel, riskLabel: labelFor(riskLevel),
    featureValues, method: "rule-based", simulation,
  };
}
