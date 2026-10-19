import { ATTRITION_FEATURES, ATTRITION_WEIGHTS } from "../config/attritionContract.js";
import { calculateAttritionFeatures } from "../utils/featureCalculator.js";

const levelFor = (score) => score < 35 ? "low" : score < 65 ? "medium" : "high";
const labelFor = (level) => ({ low: "Low attrition risk", medium: "Moderate attrition risk", high: "High attrition risk" })[level];

const FEATURE_LABELS = {
  SalaryGapRisk: "Compensation & Market Parity",
  CompanySwitchRate: "Career Continuity & History",
  LowMatchRisk: "Role Competency Alignment",
  LowSimilarityRisk: "Skill Repertoire Match",
  LowInterviewRisk: "Technical Interview Assessment",
  NoticeRisk: "Notice Period & Transition Buffer",
  LocationWorkRisk: "Work Arrangement & Remote Model",
  TrainingRisk: "Onboarding & Skill Development",
  MentorshipRisk: "Leadership & Managerial Support",
  CareerDevelopmentRisk: "Growth & Seniority Pathway",
  CertificationRisk: "Professional Credentials Coverage",
};

const FEATURE_EXPLANATIONS = {
  SalaryGapRisk: {
    risk: "Salary offer is sensitive to competing tech market rates.",
    safe: "Competitive salary package removes financial dissatisfaction and anchors retention.",
  },
  CompanySwitchRate: {
    risk: "Candidate has a history of shorter employment stints.",
    safe: "Strong track record of multi-year loyalty at previous companies.",
  },
  LowMatchRisk: {
    risk: "Skill alignment requires onboarding support to prevent role frustration.",
    safe: "High CV skill match ensures immediate confidence and role comfort.",
  },
  LowSimilarityRisk: {
    risk: "Minor tech stack adaptation curve during initial weeks.",
    safe: "Familiarity with team tools and software architecture.",
  },
  LowInterviewRisk: {
    risk: "Technical interview highlighted specific areas for pairing.",
    safe: "Strong interview performance demonstrates technical capability.",
  },
  NoticeRisk: {
    risk: "Standard notice period introduces mild organizational transition buffer.",
    safe: "Manageable notice period allows smooth start date transition.",
  },
  LocationWorkRisk: {
    risk: "Commute or in-office requirements may create travel fatigue.",
    safe: "Flexible working model and convenient location protect daily work-life balance.",
  },
  TrainingRisk: {
    risk: "Structured onboarding milestones needed during first 90 days.",
    safe: "Strong self-directed learning capability ensures swift integration.",
  },
  MentorshipRisk: {
    risk: "Candidate benefits from regular manager check-ins and mentorship.",
    safe: "Supportive team environment provides ongoing guidance and safety.",
  },
  CareerDevelopmentRisk: {
    risk: "Expects clear 12-month promotion and seniority growth milestones.",
    safe: "Clear technical advancement path anchors long-term commitment.",
  },
  CertificationRisk: {
    risk: "Support for continuous learning and credentials recommended.",
    safe: "Solid educational and certification foundation in place.",
  },
};

export function assessAttrition(candidate, simulation = {}) {
  const featureValues = calculateAttritionFeatures(candidate, simulation);
  const totalWeight = ATTRITION_FEATURES.reduce((sum, name) => sum + ATTRITION_WEIGHTS[name], 0);
  const weightedRisk = ATTRITION_FEATURES.reduce((sum, name) => sum + featureValues[name] * ATTRITION_WEIGHTS[name], 0) / totalWeight;
  const riskScore = Math.round(weightedRisk * 100);
  const riskLevel = levelFor(riskScore);

  const topRiskDrivers = ATTRITION_FEATURES.map((name) => {
    const val = featureValues[name] ?? 0.35;
    const contribution = Math.round(((val - 0.35) * (ATTRITION_WEIGHTS[name] / totalWeight) * 3) * 100) / 100;
    const direction = contribution >= 0 ? "increases attrition risk" : "reduces attrition risk";
    const label = FEATURE_LABELS[name] || name;
    const explObj = FEATURE_EXPLANATIONS[name];
    const explanation = explObj
      ? (contribution >= 0 ? explObj.risk : explObj.safe)
      : (contribution >= 0 ? `${label} increases flight sensitivity.` : `${label} provides retention stability.`);

    return {
      feature: label,
      rawFeature: name,
      value: val,
      contribution,
      direction,
      explanation,
    };
  }).sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  return {
    success: true, riskScore, riskLevel, riskLabel: labelFor(riskLevel),
    featureValues, topRiskDrivers, method: "rule-based", simulation,
  };
}
