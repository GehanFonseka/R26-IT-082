import { getAttritionAssessment as requestAssessment } from "./apiClient";

export const ATTRITION_FEATURES = [
  "SalaryGapRisk", "CompanySwitchRate", "LowMatchRisk", "LowSimilarityRisk",
  "LowInterviewRisk", "NoticeRisk", "LocationWorkRisk", "TrainingRisk",
  "MentorshipRisk", "CareerDevelopmentRisk", "CertificationRisk",
];

export async function getAttritionAssessment(candidate, simulation = {}) {
  return requestAssessment(candidate, simulation);
}

export function getAssessmentMetadata() {
  return { modelName: "Rule-based attrition assessment", provider: "attrition-service", threshold: null };
}
