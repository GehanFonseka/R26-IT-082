const strings = { type: "array", items: { type: "string" } };
const matchingEvidence = { type: "object", properties: { area: { type: "string" }, jobRequirement: { type: "string" }, cvEvidence: { type: "string" }, reason: { type: "string" } }, required: ["area", "jobRequirement", "cvEvidence", "reason"] };
const gap = { type: "object", properties: { skill: { type: "string" }, jobRequirement: { type: "string" }, reason: { type: "string" }, cvEvidence: { type: "string" }, severity: { type: "string" } }, required: ["skill", "jobRequirement", "reason", "cvEvidence", "severity"] };
const recommendation = { type: "object", properties: { action: { type: "string" }, reason: { type: "string" } }, required: ["action", "reason"] };

export const matchExplanationSchema = {
  type: "object",
  properties: {
    summary: { type: "string" }, scoreExplanation: { type: "string" },
    matchingEvidence: { type: "array", items: matchingEvidence }, gaps: { type: "array", items: gap },
    missingEvidence: { type: "array", items: { type: "object", properties: { area: { type: "string" }, reason: { type: "string" } }, required: ["area", "reason"] } },
    recommendations: { type: "array", items: recommendation }, limitations: strings,
  },
  required: ["summary", "scoreExplanation", "matchingEvidence", "gaps", "missingEvidence", "recommendations", "limitations"],
};
