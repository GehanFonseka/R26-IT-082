const text = (value, limit) => String(value ?? "").trim().slice(0, limit);
const list = (value, limit, itemLimit) => (Array.isArray(value) ? value : []).map((item) => text(item, itemLimit)).filter(Boolean).slice(0, limit);
const evidence = (value = {}) => ({ area: text(value.area, 120), jobRequirement: text(value.jobRequirement, 300), cvEvidence: text(value.cvEvidence, 300), reason: text(value.reason, 500) });
const gap = (value = {}) => ({ skill: text(value.skill, 120), jobRequirement: text(value.jobRequirement, 300), reason: text(value.reason, 500), cvEvidence: text(value.cvEvidence, 300), severity: text(value.severity, 40) });
const missing = (value = {}) => ({ area: text(value.area, 120), reason: text(value.reason, 500) });
const recommendation = (value = {}) => ({ action: text(value.action, 240), reason: text(value.reason, 500) });

export const normalizeMatchExplanation = (value = {}) => ({
  summary: text(value.summary, 700), scoreExplanation: text(value.scoreExplanation, 700),
  matchingEvidence: (Array.isArray(value.matchingEvidence) ? value.matchingEvidence : []).map(evidence).filter((item) => item.area).slice(0, 8),
  gaps: (Array.isArray(value.gaps) ? value.gaps : []).map(gap).filter((item) => item.skill).slice(0, 8),
  missingEvidence: (Array.isArray(value.missingEvidence) ? value.missingEvidence : []).map(missing).filter((item) => item.area).slice(0, 8),
  recommendations: (Array.isArray(value.recommendations) ? value.recommendations : []).map(recommendation).filter((item) => item.action).slice(0, 8),
  limitations: list(value.limitations, 6, 300),
});
