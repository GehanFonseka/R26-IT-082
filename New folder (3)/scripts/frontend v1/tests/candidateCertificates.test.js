import test from "node:test";
import assert from "node:assert/strict";
import { certificateEntries, certificateUrl } from "../src/utils/candidateCertificates.js";
import { toMatcherCandidate, toStoredCandidate } from "../src/utils/candidateProfile.js";

test("keeps certificate names and links through upload, save and reload conversions", () => {
  const stored = { certifications: ["AWS Cloud", "Data Analytics"], certificateDetails: [
    { name: "AWS Cloud", url: "https://example.com/aws" }, { name: "Data Analytics", url: "" },
  ] };
  const saved = toStoredCandidate(toMatcherCandidate(stored));
  assert.deepEqual(saved.certifications, stored.certifications);
  assert.deepEqual(saved.certificateDetails, stored.certificateDetails);
  assert.deepEqual(toMatcherCandidate(saved).candidateCertificateDetails, stored.certificateDetails);
});

test("both links on a shared certificate survive upload, save and reload", () => {
  const urls = ["https://example.com/stage-1", "https://example.com/stage-2"];
  const stored = { certifications: ["AI/ML Engineer – Stage 1 & 2"], certificateDetails: [
    { name: "AI/ML Engineer – Stage 1 & 2", url: urls[0], urls },
  ] };
  const saved = toStoredCandidate(toMatcherCandidate(stored));
  assert.deepEqual(saved.certificateDetails, stored.certificateDetails);
  assert.deepEqual(toMatcherCandidate(saved).candidateCertificateDetails, stored.certificateDetails);
});

test("shows legacy extracted names and links while keeping absent links empty", () => {
  assert.deepEqual(certificateEntries(["AWS Cloud", "https://example.com/aws", "Data Analytics"]), [
    { name: "AWS Cloud", url: "https://example.com/aws" }, { name: "Data Analytics", url: "" },
  ]);
  assert.deepEqual(certificateEntries("AWS Cloud | www.example.com/aws; Data Analytics"), [
    { name: "AWS Cloud", url: "https://www.example.com/aws" }, { name: "Data Analytics", url: "" },
  ]);
});

test("removed or renamed certifications cannot retain another certificate's link", () => {
  const candidate = toMatcherCandidate({ certifications: ["AWS Cloud"], certificateDetails: [{ name: "AWS Cloud", url: "https://example.com/aws" }] });
  candidate.candidateCertifications = "Azure Fundamentals";
  assert.deepEqual(toStoredCandidate(candidate).certificateDetails, [{ name: "Azure Fundamentals", url: "" }]);
  candidate.candidateCertifications = "";
  assert.deepEqual(toStoredCandidate(candidate).certificateDetails, []);
});

test("certificate links only allow public HTTP URLs", () => {
  for (const url of ["javascript:alert(1)", "data:text/html,test", "file:///tmp/cert", "https://user:pass@example.com/cert", "invalid"])
    assert.equal(certificateUrl(url), "");
  assert.equal(certificateUrl("https://example.com/cert?id=123"), "https://example.com/cert?id=123");
});
