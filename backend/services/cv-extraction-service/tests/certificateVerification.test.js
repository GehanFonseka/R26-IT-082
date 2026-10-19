import test from "node:test";
import assert from "node:assert/strict";
import { certificateRecipient, compareCertificateNames } from "../src/utils/certificateNames.js";
import { verifyCertificate } from "../src/services/certificateVerification.js";

const url = "https://example.com/certificate.pdf";
const rawText = "Jane Doe\nCERTIFICATES\nCloud Practitioner\n" + url;
const options = (recipientName, confidence = 1) => ({
  download: async () => ({ buffer: Buffer.from("test") }),
  read: async (_file, requestId) => { assert.equal(requestId, "name-test"); return { recipientName, confidence, method: "text" }; },
});

test("reads the printed recipient rather than the issuer, certificate title or filename", () => {
  assert.equal(certificateRecipient("CERTIFICATE OF COMPLETION\nThis is to certify that\nGunasekara G.G.K.T.A.V\nHas pursued studies\nAI/ML Engineer\nIssued by SLIIT"), "Gunasekara G.G.K.T.A.V");
  assert.equal(certificateRecipient("Presented to Jane Doe for completing Cloud Computing"), "Jane Doe");
  assert.equal(certificateRecipient("Recipient name: Jane Doe\nIssued by Example Academy"), "Jane Doe");
  assert.equal(certificateRecipient("Certificate of Completion\nIssued by Jane Doe Academy"), "");
});

test("case, honorifics, punctuation and name order can match, while distinct full names differ", () => {
  assert.equal(compareCertificateNames("JANE DOE", "Ms. Jane Doe").status, "matched");
  assert.equal(compareCertificateNames("Jane Doe", "Doe, Jane").status, "matched");
  assert.equal(compareCertificateNames("Jane Doe", "Jane Smith").status, "mismatched");
  assert.equal(compareCertificateNames("Jane Doe", "John Doe").status, "mismatched");
  assert.equal(compareCertificateNames("Jane Doe", "").status, "unreadable");
});

test("initials and incomplete names never produce a confirmed identity match", () => {
  assert.equal(compareCertificateNames("THENUKA GUNASEKARA", "Gunasekara G.G.K.T.A.V").status, "needs_review");
  assert.equal(compareCertificateNames("Jane Doe", "J. Doe").status, "needs_review");
  assert.equal(compareCertificateNames("Jane Mary Doe", "Jane Doe").status, "needs_review");
  assert.equal(compareCertificateNames("J. D.", "Jane Doe").status, "needs_review");
});

test("uses the name inside the CV and returns names, status and request context", async () => {
  const result = await verifyCertificate({ url, rawText, requestId: "name-test", displayName: "Another Account Name" }, options("Jane Doe"));
  assert.equal(result.cvName, "Jane Doe");
  assert.equal(result.certificateName, "Jane Doe");
  assert.equal(result.status, "matched");
  assert.ok(result.checkedAt);
  assert.equal((await verifyCertificate({ url, rawText, requestId: "name-test" }, options("John Doe"))).status, "mismatched");
});

test("unclear OCR requires review even if its extracted name appears to match", async () => {
  const result = await verifyCertificate({ url, rawText, requestId: "name-test" }, options("Jane Doe", 0.6));
  assert.equal(result.status, "needs_review");
});

test("rejects links outside the CV certificate section before downloading", async () => {
  await assert.rejects(verifyCertificate({ url: "https://example.com/other", rawText, requestId: "name-test" }, {
    download: async () => { assert.fail("Unlisted link must not be downloaded"); },
  }), (error) => error.statusCode === 400);
});

test("private files or unavailable document reading cannot become name mismatches", async () => {
  const result = await verifyCertificate({ url, rawText, requestId: "name-test" }, { download: async () => { throw new Error("Document requires permission"); } });
  assert.equal(result.status, "unavailable");
  assert.equal(result.certificateName, "");
});

test("a CV without an owner name does not treat the certificate title as its owner", async () => {
  const result = await verifyCertificate({ url, rawText: `CERTIFICATES\nCloud Practitioner\n${url}`, requestId: "name-test" }, {
    download: async () => { assert.fail("Missing CV name must not trigger a download"); },
  });
  assert.equal(result.status, "unreadable");
  assert.equal(result.cvName, "");
});
