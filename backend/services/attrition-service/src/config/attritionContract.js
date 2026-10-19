export const ATTRITION_FEATURES = [
  "SalaryGapRisk", "CompanySwitchRate", "LowMatchRisk", "LowSimilarityRisk",
  "LowInterviewRisk", "NoticeRisk", "LocationWorkRisk", "TrainingRisk",
  "MentorshipRisk", "CareerDevelopmentRisk", "CertificationRisk",
];

export const ATTRITION_WEIGHTS = {
  SalaryGapRisk: 1.2, CompanySwitchRate: 0.8, LowMatchRisk: 1,
  LowSimilarityRisk: 0.8, LowInterviewRisk: 0.7, NoticeRisk: 0.7,
  LocationWorkRisk: 0.8, TrainingRisk: 0.8, MentorshipRisk: 1,
  CareerDevelopmentRisk: 1.2, CertificationRisk: 0.6,
};
