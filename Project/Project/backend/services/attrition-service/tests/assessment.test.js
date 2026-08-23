import test from "node:test";
import assert from "node:assert/strict";
import { assessAttrition } from "../src/services/attritionAssessmentService.js";

test("attrition assessment is deterministic and simulation-aware", () => {
  const candidate = { compensation: { current: 80000, market: 100000 }, engagement: { careerGrowth: 0.3 } };
  const baseline = assessAttrition(candidate, {});
  const improved = assessAttrition(candidate, { salaryAdjustment: 15, roleChange: true, remoteWork: true });
  assert.equal(baseline.method, "rule-based");
  assert.ok(Number.isInteger(baseline.riskScore));
  assert.ok(improved.riskScore < baseline.riskScore);
});
