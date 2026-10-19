import test from "node:test";
import assert from "node:assert/strict";
import { normalizeExplanation } from "../src/utils/normalizeExplanation.js";
import { normalizeMatchExplanation } from "../src/utils/normalizeMatchExplanation.js";

test("normalizes grounded explanations for every returned skill", () => {
  const result = normalizeExplanation({ overall: { summary: "Evidence is present" }, skills: [{ name: "React", explanation: "Used in a project", cvEvidence: ["ERP project"] }] });
  assert.equal(result.overall.summary, "Evidence is present");
  assert.equal(result.skills[0].name, "React");
  assert.deepEqual(result.skills[0].cvEvidence, ["ERP project"]);
});

test("normalizes grounded job-match gaps and recommendations", () => {
  const result = normalizeMatchExplanation({ summary: "Low fit", gaps: [{ skill: "Python", reason: "No explicit evidence" }], recommendations: [{ action: "Add Python project evidence", reason: "Clarifies fit" }] });
  assert.equal(result.summary, "Low fit");
  assert.equal(result.gaps[0].skill, "Python");
  assert.equal(result.recommendations[0].action, "Add Python project evidence");
});
