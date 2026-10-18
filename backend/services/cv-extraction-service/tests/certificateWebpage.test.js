import test from "node:test";
import assert from "node:assert/strict";
import { parseCertificateWebpage } from "../src/utils/certificateWebpage.js";
import { readCertificateDocument as readDocument } from "../src/services/certificateDocument.js";
import { verifyCertificate } from "../src/services/certificateVerification.js";

const url = "https://www.coursera.org/account/accomplishments/verify/example";
const readCertificateDocument = (file, requestId, options = {}) => readDocument(file, requestId, { ...options, renderPage: false });
const page = (body, head = "<title>Course Certificate</title>") => ({
  buffer: Buffer.from(`<!doctype html><html><head>${head}</head><body>${body}</body></html>`),
  mimeType: "text/html", sourceUrl: url,
});
const completed = "<h3><span>Completed by <strong>Thamindu Sulakshana</strong></span></h3><p>December 3, 2023</p>";

test("reads the completed-by name across nested tags without needing an OCR model", async () => {
  const result = await readCertificateDocument(page(completed), "web-test", {
    modelReader: async () => { assert.fail("A printed completed-by name must not require OCR"); },
  });
  assert.deepEqual(result, { recipientName: "Thamindu Sulakshana", method: "web", confidence: 1 });
});

test("decodes names and reads a recipient printed on the next line", () => {
  const { recipientName } = parseCertificateWebpage(page("<h3>Completed by</h3><div>Anne O&#39;Neil &nbsp; Smith</div>").buffer.toString(), url);
  assert.equal(recipientName, "Anne O'Neil Smith");
});

test("navigation, scripts, hidden content and login forms cannot supply a recipient", () => {
  const html = page(`<nav>Completed by Wrong Name</nav><script>Completed by Fake Person</script>
    <div hidden>Completed by Hidden Person</div><div style="display: none">Completed by Hidden User</div>
    <form>Recipient name: Signed In User</form>${completed}`);
  assert.equal(parseCertificateWebpage(html.buffer.toString(), url).recipientName, "Thamindu Sulakshana");
});

test("explicit credential metadata identifies a recipient, while author/profile metadata does not", () => {
  const credential = '<script type="application/ld+json">{"@context":"https://schema.org","@type":"EducationalOccupationalCredential","credentialSubject":{"@type":"Person","name":"Jane Doe"}}</script>';
  assert.equal(parseCertificateWebpage(page("Loading...", credential).buffer.toString(), url).recipientName, "Jane Doe");
  const author = '<script type="application/ld+json">{"@type":"Course","author":{"@type":"Person","name":"Course Instructor"}}</script>';
  assert.equal(parseCertificateWebpage(page("Course details", author).buffer.toString(), url).recipientName, "");
  assert.equal(parseCertificateWebpage(page("<section>Instructor<p>Name: Course Instructor</p></section>").buffer.toString(), url).recipientName, "");
});

test("reads an explicit certificate image caption and ignores ordinary profile images", () => {
  const html = page('<img alt="Jane Doe profile" src="/avatar.png"><img alt="View certificate for Jane Doe, Cloud Computing" src="/certificate.png">');
  const result = parseCertificateWebpage(html.buffer.toString(), url);
  assert.equal(result.recipientName, "Jane Doe");
  assert.deepEqual(result.documentUrls, ["https://www.coursera.org/certificate.png"]);
});

test("downloads a certificate image from a webpage through the document reader", async () => {
  const html = page('<img alt="Course certificate" src="/certificate.png">');
  const image = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0]);
  const result = await readCertificateDocument(html, "web-image-test", {
    download: async (asset) => { assert.equal(asset, "https://www.coursera.org/certificate.png"); return { buffer: image }; },
    modelReader: async (document, requestId) => {
      assert.equal(document.mimeType, "image/png");
      assert.equal(requestId, "web-image-test");
      return { recipientName: "Jane Doe", documentText: "Awarded to Jane Doe", confidence: 0.99 };
    },
  });
  assert.equal(result.recipientName, "Jane Doe");
  assert.equal(result.method, "ocr");
});

test("bounds webpage recursion and reports private/login/loading pages as unavailable", async () => {
  const html = page('<a href="/another-page">View certificate</a>');
  let downloads = 0;
  await assert.rejects(readCertificateDocument(html, "web-test", { download: async () => { downloads += 1; return html; } }), /did not expose/);
  assert.equal(downloads, 1);
  for (const content of ["<form>Recipient name: Jane Doe</form><p>Sign in to see certificate</p>", "Loading..."]) {
    await assert.rejects(readCertificateDocument(page(content), "web-test"), /sharing permissions/);
  }
});

test("a verification webpage participates in the same CV name comparison", async () => {
  const rawText = `Thamindu Sulakshana\nCertificates\nGenerative AI\n${url}`;
  const options = { download: async () => page(completed), read: readCertificateDocument };
  const matching = await verifyCertificate({ url, rawText, requestId: "web-test" }, options);
  assert.equal(matching.status, "matched");
  assert.equal(matching.method, "web");
  const differing = await verifyCertificate({ url, rawText: rawText.replace("Thamindu Sulakshana", "Another Person"), requestId: "web-test" }, options);
  assert.equal(differing.status, "mismatched");
  assert.equal(differing.certificateName, "Thamindu Sulakshana");
});
