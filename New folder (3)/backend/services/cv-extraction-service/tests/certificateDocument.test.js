import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { readCertificateDocument, certificateFormat } from "../src/services/certificateDocument.js";

test("reads labelled text documents without needing an OCR model", async () => {
  const result = await readCertificateDocument({ buffer: Buffer.from("CERTIFICATE\nThis is to certify that\nJane Doe\nHas completed Cloud Computing"), mimeType: "text/plain" }, "document-test", {
    modelReader: async () => { assert.fail("Selectable recipient text must not require OCR"); },
  });
  assert.deepEqual(result, { recipientName: "Jane Doe", method: "text", confidence: 1 });
});

test("recognizes images and sends their bytes to the model with the original request ID", async () => {
  const buffer = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0]);
  assert.equal(certificateFormat({ buffer, mimeType: "application/octet-stream" }).mimeType, "image/png");
  const result = await readCertificateDocument({ buffer, mimeType: "application/octet-stream" }, "image-test", {
    modelReader: async (document, requestId) => {
      assert.equal(requestId, "image-test");
      assert.equal(document.mimeType, "image/png");
      assert.equal(document.data, buffer.toString("base64"));
      return { recipientName: "Jane Doe", documentText: "Awarded to Jane Doe", confidence: 0.95 };
    },
  });
  assert.equal(result.recipientName, "Jane Doe");
  assert.equal(result.method, "ocr");
});

test("does not accept a model name without transcribed evidence", async () => {
  const buffer = Buffer.from([255, 216, 255, 0]);
  const result = await readCertificateDocument({ buffer, mimeType: "image/jpeg" }, "image-test", {
    modelReader: async () => ({ recipientName: "Jane Doe", documentText: "Unreadable document", confidence: 1 }),
  });
  assert.equal(result.recipientName, "");
});

test("sharing/login HTML is reported as unavailable instead of being treated as a certificate", async () => {
  await assert.rejects(readCertificateDocument({ buffer: Buffer.from("<html>Sign in to Google Drive</html>"), mimeType: "text/html" }, "document-test"), /sharing permissions/);
});

for (const extension of ["pdf", "docx"]) {
  test(`reads a printed certificate recipient from an actual ${extension.toUpperCase()} document`, async () => {
    const buffer = await readFile(new URL(`./fixtures/recipient-certificate.${extension}`, import.meta.url));
    const result = await readCertificateDocument({ buffer, mimeType: "application/octet-stream" }, "document-test", {
      modelReader: async () => { assert.fail("Selectable certificate text should not require OCR"); },
    });
    assert.equal(result.recipientName, "Jane Doe");
    assert.equal(result.method, "text");
  });
}

test("a scanned PDF uses the document model instead of claiming that its name is missing", async () => {
  const buffer = await readFile(new URL("./fixtures/scanned-certificate.pdf", import.meta.url));
  const result = await readCertificateDocument({ buffer, mimeType: "application/octet-stream" }, "scan-test", {
    modelReader: async (document, requestId) => {
      assert.equal(requestId, "scan-test");
      assert.equal(document.mimeType, "application/pdf");
      assert.equal(document.data, buffer.toString("base64"));
      return { recipientName: "Jane Doe", documentText: "This is to certify that Jane Doe", confidence: 0.99 };
    },
  });
  assert.equal(result.recipientName, "Jane Doe");
  assert.equal(result.method, "ocr");
});
