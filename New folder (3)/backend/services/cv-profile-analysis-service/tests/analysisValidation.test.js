import test from "node:test";
import assert from "node:assert/strict";
import { validateInput } from "../src/validation/analysisValidation.js";
import { analyzeCv } from "../src/services/analysisService.js";

test("API validation preserves CV sections used to build model project and experience contexts", () => {
  const rawText = "Synthetic Candidate\nSKILLS\nPython, Docker\nPROJECTS\nHiring API: Built Python services with Docker\nEXPERIENCE\nTwo years as a Python engineer";
  const input = validateInput({ rawText, candidate: { skills: ["Python", "Docker"] } });
  assert.equal(input.rawText, rawText);
  const analysis = analyzeCv(input);
  assert.equal(analysis.projects.length, 1);
  assert.equal(analysis.experience.length, 1);
  assert.ok(analysis.skills.find(({ name }) => name === "Python").usedInProjects);
});

test("invalid CV text cannot become a successful empty analysis", () => {
  for (const rawText of [null, {}, "short"]) {
    assert.throws(() => validateInput({ rawText, candidate: {} }), (error) => error.statusCode === 422);
  }
});
