const text = (value, limit) => String(value ?? "").trim().slice(0, limit);
const list = (value, limit, itemLimit) => (Array.isArray(value) ? value : [])
  .map((item) => text(item, itemLimit)).filter(Boolean).slice(0, limit);

const block = (value = {}) => ({
  summary: text(value.summary, 600), evidence: list(value.evidence, 5, 220), limitations: list(value.limitations, 4, 220),
});

const skill = (value = {}) => ({
  name: text(value.name, 100), explanation: text(value.explanation, 500), scoreReason: text(value.scoreReason, 400),
  cvEvidence: list(value.cvEvidence, 4, 220), limitations: list(value.limitations, 3, 220),
});

export const normalizeExplanation = (value = {}) => ({
  overall: block(value.overall), technicalCompetency: block(value.technicalCompetency),
  skills: (Array.isArray(value.skills) ? value.skills : []).map(skill).filter((item) => item.name).slice(0, 20),
});
