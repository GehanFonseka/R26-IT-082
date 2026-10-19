const strings = { type: "array", items: { type: "string" } };

const explanationBlock = {
  type: "object",
  properties: {
    summary: { type: "string" },
    evidence: strings,
    limitations: strings,
  },
  required: ["summary", "evidence", "limitations"],
};

const skillExplanation = {
  type: "object",
  properties: {
    name: { type: "string" },
    explanation: { type: "string" },
    scoreReason: { type: "string" },
    cvEvidence: strings,
    limitations: strings,
  },
  required: ["name", "explanation", "scoreReason", "cvEvidence", "limitations"],
};

export const explanationSchema = {
  type: "object",
  properties: {
    overall: explanationBlock,
    technicalCompetency: explanationBlock,
    skills: { type: "array", items: skillExplanation },
  },
  required: ["overall", "technicalCompetency", "skills"],
};
