import test from "node:test";
import assert from "node:assert/strict";
import { normalizeAttritionExplanation } from "../src/utils/normalizeAttritionExplanation.js";

test("keeps model-specific attrition explanations bounded and keyed", () => {
  const result = normalizeAttritionExplanation({
    overview: "Two local models were reviewed.",
    models: [{ modelKey: "earlyAttrition", target: "EarlyAttrition", summary: "Notice risk is material.", cvEvidence: ["The CV shows a long notice period."], jobComparison: "The role needs faster availability.", gaps: ["Exact availability is not stated."], drivers: [{ feature: "NoticeRisk", explanation: "The supplied value raises the local score." }] }],
  });
  assert.equal(result.models[0].modelKey, "earlyAttrition");
  assert.equal(result.models[0].drivers[0].feature, "NoticeRisk");
  assert.equal(result.models[0].jobComparison, "The role needs faster availability.");
  assert.deepEqual(result.models[0].gaps, ["Exact availability is not stated."]);
  assert.deepEqual(result.models[0].recommendations, []);
});
