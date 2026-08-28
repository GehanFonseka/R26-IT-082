import { getAttritionAssessment as requestAssessment } from "./apiClient";

export const ATTRITION_FEATURES = [
  "SalaryGapRisk", "CompanySwitchRate", "LowMatchRisk", "LowSimilarityRisk",
  "LowInterviewRisk", "NoticeRisk", "LocationWorkRisk", "TrainingRisk",
  "MentorshipRisk", "CareerDevelopmentRisk", "CertificationRisk",
];

export async function getAttritionAssessment(candidate, simulation = {}, context = {}) {
  return requestAssessment(candidate, simulation, context);
}

export function getAssessmentMetadata() {
  return { modelName: "Rule-based attrition assessment", provider: "attrition-service", threshold: null };
}
