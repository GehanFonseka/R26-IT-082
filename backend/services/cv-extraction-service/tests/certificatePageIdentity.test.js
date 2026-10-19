import test from "node:test";
import assert from "node:assert/strict";
import { readCertificateDocument } from "../src/services/certificateDocument.js";
import { verifyCertificate } from "../src/services/certificateVerification.js";

const url = "https://certificate.example/verify/table";
const file = { sourceUrl: url, mimeType: "text/html", buffer: Buffer.from("<html>Loading</html>") };
const image = { data: "Ynl0ZXM=", mimeType: "image/jpeg" };

test("compares recipients read from screenshots and table text with the CV identity", async () => {
  for (const [name, status] of [["Jane Doe", "matched"], ["John Smith", "mismatched"], ["", "unreadable"]]) {
    const rawText = `SCREENSHOT 1:\nCourse overview\nSCREENSHOT 2:\nCertificate\nRecipient name\n${name}`;
    const result = await verifyCertificate({ url, rawText: `Jane Doe\nCertificates\nCloud Course\n${url}`, requestId: "table-check" }, {
      download: async () => file,
      read: (document, requestId) => readCertificateDocument(document, requestId, {
        renderPage: async () => ({ sourceUrl: url, html: "<title>Certificate</title>", images: [image, image], rawText, complete: true }),
        modelReader: async (input, id) => {
          assert.equal(id, "table-check");
          assert.deepEqual(input, { images: [image, image], rawText });
          return { recipientName: name, recipientNames: name ? [name] : [], documentText: rawText, confidence: 1 };
        },
      }),
    });
    assert.equal(result.status, status);
    assert.equal(result.cvName, "Jane Doe");
    assert.equal(result.certificateName, name);
  }
});

test("a name found in page text alone cannot supply an invented certificate recipient", async () => {
  const result = await readCertificateDocument(file, "table-check", {
    renderPage: async () => ({ sourceUrl: url, html: "<title>Certificate</title>", images: [image],
      rawText: "Account name: Jane Doe", complete: true }),
    modelReader: async () => ({ recipientName: "Jane Doe", recipientNames: ["Jane Doe"],
      documentText: "Certificate recipient could not be read", confidence: 0 }),
  });
  assert.equal(result.recipientName, "");
});
