import { ATTRITION_FEATURES } from "../config/attritionContract.js";

const clamp = (value) => Math.min(1, Math.max(0, Number(value) || 0));
const numericFeatures = (value) => value && ATTRITION_FEATURES.every((name) => Number.isFinite(Number(value[name])))
  ? Object.fromEntries(ATTRITION_FEATURES.map((name) => [name, clamp(value[name])])) : null;

export function calculateAttritionFeatures(candidate = {}, simulation = {}) {
  const provided = numericFeatures(simulation.features) || numericFeatures(candidate.attritionFeatures);
  if (provided) return applySimulation(provided, simulation);
  const compensation = candidate.compensation ?? {};
  const engagement = candidate.engagement ?? {};
  const expected = Number(compensation.expected ?? compensation.expectedLKR ?? compensation.market) || 0;
  const current = Number(compensation.current ?? compensation.offeredLKR) || 0;
  const salaryGap = expected > 0 ? (expected - current) / expected : 0.45;
  const history = Number(candidate.numCompaniesWorked ?? candidate.historySummary?.numCompaniesWorked)
    || (Array.isArray(candidate.history) ? candidate.history.length : 0);
  const managerSatisfaction = Number(engagement.managerSatisfaction ?? 0.6);
  const careerGrowth = Number(engagement.careerGrowth ?? 0.55);
  const remoteMismatch = engagement.currentWorkModel && engagement.remotePreference
    && engagement.currentWorkModel !== engagement.remotePreference;
  return applySimulation({
    SalaryGapRisk: clamp(salaryGap), CompanySwitchRate: clamp(history / 8),
    LowMatchRisk: clamp(1 - Number(candidate.matchProbability ?? candidate.matchScore ?? 0.65)),
    LowSimilarityRisk: clamp(1 - Number(candidate.similarity ?? 0.65)),
    LowInterviewRisk: clamp(1 - Number(candidate.interviewScore ?? 0.65)),
    NoticeRisk: clamp(Number(candidate.noticePeriodDays ?? engagement.noticePeriodDays ?? 0) / 90),
    LocationWorkRisk: remoteMismatch ? 0.65 : 0.25,
    TrainingRisk: clamp(1 - Number(engagement.trainingSatisfaction ?? 0.6)),
    MentorshipRisk: clamp(1 - managerSatisfaction),
    CareerDevelopmentRisk: clamp(1 - careerGrowth),
    CertificationRisk: clamp(1 - Number(engagement.certificationCoverage ?? 0.6)),
  }, simulation, { salaryGap, managerSatisfaction, careerGrowth });
}

function applySimulation(features, simulation = {}, context = {}) {
  const next = { ...features };
  const salary = Number(simulation.salaryAdjustment) || 0;
  next.SalaryGapRisk = clamp(next.SalaryGapRisk - salary / 100);
  if (simulation.roleChange) next.CareerDevelopmentRisk = clamp(next.CareerDevelopmentRisk - 0.2);
  if (simulation.managerChange) next.MentorshipRisk = clamp(next.MentorshipRisk - 0.2);
  if (simulation.remoteWork) next.LocationWorkRisk = clamp(next.LocationWorkRisk - 0.2);
  return next;
}
