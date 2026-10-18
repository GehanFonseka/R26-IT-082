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
        compensation: { current: "180000", expected: "220000" },
        projects: ["Design system refresh", "Research portal"],
      },
    },
  });
  assert.equal(profile.cv.fileName, "asha-cv.pdf");
  assert.equal(profile.cv.candidate.role, "Product Designer");
  assert.deepEqual(profile.cv.candidate.skills, ["Figma"]);
  assert.equal(profile.cv.candidate.yearsExperience, 4);
  assert.deepEqual(profile.cv.candidate.compensation, { current: 180000, expected: 220000, currency: "LKR" });
  assert.deepEqual(profile.cv.candidate.projects, ["Design system refresh", "Research portal"]);
});

test("keeps multiple certificate links, removes duplicates and filters unsafe links", () => {
  const first = "https://example.com/stage-1";
  const second = "https://example.com/stage-2";
  const profile = validateProfile({ displayName: "Test Candidate", cv: { candidate: {
    certifications: ["AI/ML Engineer – Stage 1 & 2"], certificateDetails: [{
      name: "AI/ML Engineer – Stage 1 & 2", url: first,
      urls: [first, second, first, "javascript:alert(1)"],
    }],
  } } });
  assert.deepEqual(profile.cv.candidate.certificateDetails, [{ name: "AI/ML Engineer – Stage 1 & 2", url: first, urls: [first, second] }]);
});

test("profile validation preserves certificate name and full link and removes unsafe URLs", () => {
  const url = `https://example.com/credentials/${"a".repeat(220)}?verify=1`;
  const profile = validateProfile({ displayName: "Asha Perera", cv: { candidate: {
    certifications: ["Cloud Practitioner", "Data Analyst"],
    certificateDetails: [
      { name: "Cloud Practitioner", url },
      { name: "Data Analyst", url: "javascript:alert(1)" },
      { name: "", url: "https://example.com/empty" },
      null,
    ],
  } } });
  assert.deepEqual(profile.cv.candidate.certificateDetails, [
    { name: "Cloud Practitioner", url }, { name: "Data Analyst", url: "" },
  ]);
});
