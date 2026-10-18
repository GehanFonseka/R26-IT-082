const text = (value, limit) => String(value ?? "").trim().slice(0, limit);
const list = (value, limit, itemLimit) => (Array.isArray(value) ? value : [])
  .map((item) => text(item, itemLimit)).filter(Boolean).slice(0, limit);

const model = (value = {}) => ({
  modelKey: text(value.modelKey, 80), target: text(value.target, 80), summary: text(value.summary, 600),
  cvEvidence: list(value.cvEvidence, 4, 240), jobComparison: text(value.jobComparison, 500), gaps: list(value.gaps, 4, 240),
  drivers: (Array.isArray(value.drivers) ? value.drivers : []).map((item) => ({
    feature: text(item.feature, 120), explanation: text(item.explanation, 300),
  })).filter((item) => item.feature && item.explanation).slice(0, 5),
  recommendations: list(value.recommendations, 4, 240), limitations: list(value.limitations, 4, 240),
});

export const normalizeAttritionExplanation = (value = {}) => ({
  overview: text(value.overview, 700), models: (Array.isArray(value.models) ? value.models : []).map(model).filter((item) => item.modelKey).slice(0, 2),
});
