import test from "node:test";
import assert from "node:assert/strict";
import { certificateRecipient } from "../src/utils/certificateNames.js";
import { parseCertificateWebpage } from "../src/utils/certificateWebpage.js";
import { renderCertificatePage } from "../src/services/certificateBrowser.js";
import { readCertificateDocument } from "../src/services/certificateDocument.js";
import { isNonCertificateRecipient } from "../src/utils/certificateRecipientRoles.js";

const sourceUrl = "https://certificate.example/verify/provider";
const file = (html) => ({ sourceUrl, mimeType: "text/html", buffer: Buffer.from(html) });

test("reads LinkedIn-style recipient heading without a colon and a course completion statement", () => {
  const html = "<title>LinkedIn Learning Certificate of Completion</title><main><h3>Certificate recipient</h3>"
    + "<div>ASHAN NIRMAL</div><h3>Course completed</h3><p>Ethics in the Age of Generative AI</p>"
    + "<p>Course completed by ASHAN NIRMAL</p><p>August 19, 2023</p></main>";
  assert.equal(parseCertificateWebpage(html, sourceUrl).recipientName, "ASHAN NIRMAL");
  assert.equal(certificateRecipient("Certificate recipient\nASHAN NIRMAL"), "ASHAN NIRMAL");
  assert.equal(parseCertificateWebpage("<title>Certificate</title><p>Course completed by ASHAN NIRMAL</p>", sourceUrl).recipientName, "ASHAN NIRMAL");
});

test("reads Udemy-style certificate recipient in a detail sidebar and preserves printed initials", () => {
  const html = "<title>Certificate of Completion</title><main>Game Development for beginners with Python</main>"
    + "<aside><h2>Certificate Recipient:</h2><div><span>S.D Ashan Nirmal Wimalarathna</span></div>"
    + "<h2>About the Course:</h2><p>Instructors: Bluelime Learning Solutions</p></aside>";
  assert.equal(parseCertificateWebpage(html, sourceUrl).recipientName, "S.D Ashan Nirmal Wimalarathna");
  assert.equal(certificateRecipient("Certificate Recipient: S.D Ashan Nirmal Wimalarathna"), "S.D Ashan Nirmal Wimalarathna");
  assert.equal(parseCertificateWebpage("<title>Certificate</title><aside>Recipient name: Account Person</aside>", sourceUrl).recipientName, "");
  assert.equal(parseCertificateWebpage("<title>Certificate</title><nav>Certificate recipient: Account Person</nav>", sourceUrl).recipientName, "");
});

test("LinkedIn course instructor is excluded even when vision mislabels that person as a recipient", async () => {
  const html = "<title>LinkedIn Learning Certificate</title><main><h3>Certificate recipient</h3>"
    + "<p>ASHAN NIRMAL</p><h3>Course</h3><p>By: Vilas Dhar</p></main>";
  const rawText = "Certificate recipient\nASHAN NIRMAL\nCourse\nBy: Vilas Dhar";
  assert(isNonCertificateRecipient("Vilas Dhar", rawText));
  assert(!isNonCertificateRecipient("ASHAN NIRMAL", rawText));
  assert(!isNonCertificateRecipient("Vilas Dhar", rawText + "\nCertificate recipient: Vilas Dhar"));
  const result = await readCertificateDocument(file(html), "provider-role-test", {
    renderPage: async () => ({ html, sourceUrl, rawText, images: [], complete: true }),
    modelReader: async () => ({ recipientName: "ASHAN NIRMAL", recipientNames: ["ASHAN NIRMAL", "Vilas Dhar"],
      documentText: rawText, confidence: 0.99, visionUsed: true, inspectionComplete: true }),
  });
  assert.deepEqual(result.recipientNames, ["ASHAN NIRMAL"]);
  assert(result.scanComplete);
});

test("screenshots retain visible certificate sidebar text without treating navigation as evidence", async () => {
  const html = '<!doctype html><body><nav>Certificate recipient: Account Person</nav><main>Certificate</main>'
    + '<aside><h2>Certificate Recipient:</h2><p>S.D Ashan Nirmal Wimalarathna</p></aside>'
    + '<aside><p>Account name: Account Person</p></aside></body>';
  const rendered = await renderCertificatePage(file(html));
  assert.match(rendered.rawText, /Certificate Recipient:\nS\.D Ashan Nirmal Wimalarathna/);
  assert.doesNotMatch(rendered.rawText, /Account Person/);
  assert.equal(rendered.complete, true);
  const result = await readCertificateDocument(file(html), "provider-label-test", {
    renderPage: async () => rendered,
    modelReader: async () => ({ recipientName: "", documentText: rendered.rawText, confidence: 0, inspectionComplete: true }),
  });
  assert.equal(result.recipientName, "S.D Ashan Nirmal Wimalarathna");
  assert.equal(result.source, "html_text");
});
