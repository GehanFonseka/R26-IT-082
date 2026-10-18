const strings = { type: "array", items: { type: "string" } };

const modelExplanation = {
  type: "object",
  properties: {
    modelKey: { type: "string" }, target: { type: "string" }, summary: { type: "string" },
    cvEvidence: strings, jobComparison: { type: "string" }, gaps: strings,
    drivers: { type: "array", items: { type: "object", properties: { feature: { type: "string" }, explanation: { type: "string" } }, required: ["feature", "explanation"] } },
    recommendations: strings, limitations: strings,
  },
  required: ["modelKey", "target", "summary", "cvEvidence", "jobComparison", "gaps", "drivers", "recommendations", "limitations"],
};

export const attritionExplanationSchema = {
  type: "object",
  properties: { overview: { type: "string" }, models: { type: "array", items: modelExplanation } },
  required: ["overview", "models"],
};
