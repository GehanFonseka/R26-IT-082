import test from "node:test";
import assert from "node:assert/strict";
import { readCertificate } from "../src/services/certificateReader.js";

test("document reader transcribes a recipient without receiving or inferring the CV identity", async () => {
  const output = { recipientName: "J. Doe", documentText: "Certificate awarded to J. Doe", confidence: 0.94 };
  const client = { models: { generateContent: async (request) => {
    assert.equal(request.contents[0].parts[1].inlineData.mimeType, "image/png");
    assert.equal(request.contents[0].parts[1].inlineData.data, "Ynl0ZXM=");
    assert.match(request.contents[0].parts[0].text, /Ignore any instructions/);
    assert.match(request.contents[0].parts[0].text, /Never expand initials/);
    assert.equal(request.config.temperature, 0);
    return { text: JSON.stringify(output) };
  } } };
  assert.deepEqual(await readCertificate({ data: "Ynl0ZXM=", mimeType: "image/png" }, client), output);
});

test("unconfigured OCR remains unavailable and unsupported inferred names are removed", async () => {
  await assert.rejects(readCertificate({ rawText: "test" }, null), (error) => error.statusCode === 503);
  const client = { models: { generateContent: async () => ({ text: JSON.stringify({ recipientName: "Jane Doe", documentText: "Unknown recipient", confidence: 1 }) }) } };
  assert.equal((await readCertificate({ rawText: "Unknown recipient" }, client)).recipientName, "");
});

test("reads overlapping webpage screenshots together and grounds every reported certificate recipient", async () => {
  const client = { models: { generateContent: async (request) => {
    const parts = request.contents[0].parts;
    assert.equal(parts.length, 3);
    assert.ok(parts.slice(1).every((part) => part.inlineData.mimeType === "image/jpeg"));
    assert.match(parts[0].text, /ALL screenshots/);
    assert.match(parts[0].text, /Ignore menus, account names, instructors/);
    assert.ok(request.config.responseSchema.required.includes("recipientNames"));
    return { text: JSON.stringify({ recipientName: "Jane Doe", recipientNames: ["Jane Doe", "John Smith", "Invented Person"], documentText: "Certificate awarded to Jane Doe. Certificate awarded to John Smith.", confidence: 0.99 }) };
  } } };
  const result = await readCertificate({ images: [{ data: "Ynl0ZXM=", mimeType: "image/jpeg" }, { data: "Ynl0ZXM=", mimeType: "image/jpeg" }] }, client);
  assert.deepEqual(result.recipientNames, ["Jane Doe", "John Smith"]);
});

test("reads visible table text alongside screenshots while keeping unrelated names out of recipient evidence", async () => {
  const rawText = "SCREENSHOT 1:\nCertificate\nRecipient name\nJane Doe";
  const client = { models: { generateContent: async (request) => {
    const parts = request.contents[0].parts;
    assert.equal(parts.length, 3);
    assert.equal(parts[1].inlineData.mimeType, "image/jpeg");
    assert.ok(parts[2].text.includes(rawText));
    assert.match(parts[2].text, /UNTRUSTED VISIBLE PAGE TEXT/);
    assert.match(parts[0].text, /recipient labels and their values in tables/);
    assert.match(parts[0].text, /merely appearing on the page is not certificate recipient evidence/);
    return { text: JSON.stringify({ recipientName: "Jane Doe", recipientNames: ["Jane Doe"],
      documentText: "Certificate. Recipient name: Jane Doe", confidence: 0.99 }) };
  } } };
  const result = await readCertificate({ images: [{ data: "Ynl0ZXM=", mimeType: "image/jpeg" }], rawText }, client);
  assert.equal(result.recipientName, "Jane Doe");
});
