import test from "node:test";
import assert from "node:assert/strict";
import { validateProfile } from "../src/validation/profileValidation.js";

test("profile validation keeps the uploaded CV candidate contract", () => {
  const profile = validateProfile({
    displayName: "Asha Perera",
    cv: {
      fileName: "asha-cv.pdf",
      rawText: "Candidate CV text",
      candidate: {
        role: "Product Designer",
        skills: ["Figma"],
        yearsExperience: 4,
        projects: ["Design system refresh", "Research portal"],
      },
    },
  });
  assert.equal(profile.cv.fileName, "asha-cv.pdf");
  assert.equal(profile.cv.candidate.role, "Product Designer");
  assert.deepEqual(profile.cv.candidate.skills, ["Figma"]);
  assert.equal(profile.cv.candidate.yearsExperience, 4);
  assert.deepEqual(profile.cv.candidate.projects, ["Design system refresh", "Research portal"]);
});
