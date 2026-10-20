import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { extractCandidateFields } from "../src/utils/candidateParser.js";
import { extractCv } from "../src/services/cvExtractionService.js";

test("pairs certificate names with inline and following links without using contact or project links", () => {
  const candidate = extractCandidateFields(`Jane Doe
https://example.com/portfolio
CERTIFICATES
AWS Certified Cloud Practitioner | https://example.com/aws
Google Data Analytics
Credential URL: https://example.com/google
Certificate in Cyber Security
Issuer: Example Academy
2025
Microsoft Azure Fundamentals
Projects
Portfolio https://example.com/project`);
  assert.deepEqual(candidate.certificateDetails, [
    { name: "AWS Certified Cloud Practitioner", url: "https://example.com/aws" },
    { name: "Google Data Analytics", url: "https://example.com/google" },
    { name: "Certificate in Cyber Security", url: "" },
    { name: "Microsoft Azure Fundamentals", url: "" },
  ]);
  assert.deepEqual(candidate.certifications, candidate.certificateDetails.map((entry) => entry.name));
});

test("accepts inline headings, markdown, www links and certificate titles with commas", () => {
  const candidate = extractCandidateFields(`Jane Doe
Professional Certifications: [Cloud, Security](https://example.com/cloud); React Developer
View certificate: www.example.com/react.
Education
BSc`);
  assert.deepEqual(candidate.certificateDetails, [
    { name: "Cloud, Security", url: "https://example.com/cloud" },
    { name: "React Developer", url: "https://www.example.com/react" },
  ]);
});

test("does not invent links or certificates and ignores unsafe link lines", () => {
  assert.deepEqual(extractCandidateFields("Jane Doe\nSkills\nReact\nProjects\nWeb app").certificateDetails, []);
  const candidate = extractCandidateFields("Jane Doe\nCertifications\nCloud Practitioner\njavascript:alert(1)\nData Analyst\nhttps://user:pass@example.com/secret");
  assert.deepEqual(candidate.certificateDetails, [{ name: "Cloud Practitioner", url: "" }, { name: "Data Analyst", url: "" }]);
});

for (const extension of ["pdf", "docx"]) {
  test(`extracts embedded certificate hyperlinks from an actual ${extension.toUpperCase()} CV`, async () => {
    const buffer = await readFile(new URL(`./fixtures/certificates.${extension}`, import.meta.url));
    const result = await extractCv({ originalname: `cv.${extension}`, buffer });
    assert.deepEqual(result.candidate.certificateDetails, [
      { name: "AWS Certified Cloud Practitioner", url: "https://example.com/credentials/aws-123" },
      { name: "Google Data Analytics", url: "https://example.com/credentials/google-456" },
      { name: "Certificate in Cyber Security", url: "" },
    ]);
    assert.match(result.rawText, /https:\/\/example.com\/credentials\/aws-123/);
    assert.deepEqual(result.candidate.skills, ["React", "Node.js"]);
  });
}

test("keeps both bracketed certificate links under their shared title and stops at leadership", () => {
  const first = "https://example.com/certificates/stage-1";
  const second = "https://example.com/certificates/stage-2";
  const candidate = extractCandidateFields(`Jane Doe
CERTIFICATION
AI/ML Engineer – Stage 1 & 2 (Certificate - 2023 ) (Certificate - 2023 ) (${first}) (${second})
LEADERSHIP & ACTIVITIES
Event Vice Chair 2023
Logistics Team Lead 2024`);
  assert.deepEqual(candidate.certificateDetails, [{ name: "AI/ML Engineer – Stage 1 & 2", url: first, urls: [first, second] }]);
  assert.deepEqual(candidate.certifications, ["AI/ML Engineer – Stage 1 & 2"]);
});

test("pairs two bracketed links on separate lines with one title", () => {
  const candidate = extractCandidateFields(`CERTIFICATION
AI/ML Engineer – Stage 1 & 2
(Certificate (https://example.com/stage-1) - 2023)
(Certificate (https://example.com/stage-2) - 2023)
LEADERSHIP & ACTIVITIES`);
  assert.deepEqual(candidate.certificateDetails, [{
    name: "AI/ML Engineer – Stage 1 & 2", url: "https://example.com/stage-1",
    urls: ["https://example.com/stage-1", "https://example.com/stage-2"],
  }]);
});

test("reads bracketed hyperlink annotations from a PDF and deduplicates repeated annotations", async () => {
  const buffer = await readFile(new URL("./fixtures/bracketed-certificates.pdf", import.meta.url));
  const result = await extractCv({ originalname: "cv.pdf", buffer });
  assert.deepEqual(result.candidate.certificateDetails, [{
    name: "AI/ML Engineer - Stage 1 & 2", url: "https://example.com/certificates/stage-1",
    urls: ["https://example.com/certificates/stage-1", "https://example.com/certificates/stage-2"],
  }]);
});
