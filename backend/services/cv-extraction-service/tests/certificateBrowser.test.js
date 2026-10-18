import test from "node:test";
import assert from "node:assert/strict";
import { renderCertificatePage } from "../src/services/certificateBrowser.js";
import { readCertificateDocument } from "../src/services/certificateDocument.js";
import { downloadCertificate } from "../src/services/certificateDownload.js";
import { verifyCertificate } from "../src/services/certificateVerification.js";
import { env } from "../src/config/env.js";

const sourceUrl = "https://certificate.example/verify/123";
const file = (html) => ({ sourceUrl, mimeType: "text/html", buffer: Buffer.from(html) });
const image = { data: "Ynl0ZXM=", mimeType: "image/jpeg" };

test("scrolls to a lazy certificate embedded among text and blocks private subresources and websockets", async () => {
  const blocked = [];
  const html = `<!doctype html><title>Course Certificate</title><body style="margin:0">
    <nav>Account name: Navigation Person</nav><p hidden>Recipient name: Hidden Person</p>
    <p>Course overview</p><div style="height:1900px">Long course description</div><canvas width="1000" height="600"></canvas>
    <table><tr><th>Recipient name</th><td>Jane Doe</td></tr></table>
    <script>
      fetch('http://127.0.0.1/private').catch(() => {});
      new WebSocket('ws://127.0.0.1/private');
      const canvas = document.querySelector('canvas');
      addEventListener('scroll', () => {
        if (canvas.getBoundingClientRect().top < innerHeight) {
          const context = canvas.getContext('2d'); context.fillStyle = 'white'; context.fillRect(0,0,1000,600);
          context.fillStyle = 'black'; context.font = '48px sans-serif';
          context.fillText('CERTIFICATE',50,100); context.fillText('Presented to Jane Doe',50,200);
          document.body.dataset.certificateLoaded = 'true';
        }
      });
    </script></body>`;
  const rendered = await renderCertificatePage(file(html), { download: async (url) => {
    blocked.push(url);
    return downloadCertificate(url);
  } });
  assert.equal(rendered.complete, true);
  assert.ok(rendered.images.length >= 3);
  assert.match(rendered.html, /data-certificate-loaded="true"/);
  assert.match(rendered.rawText, /Recipient name\nJane Doe/);
  assert.doesNotMatch(rendered.rawText, /Navigation Person|Hidden Person/);
  assert.ok(blocked.includes("http://127.0.0.1/private"));
  assert.ok(rendered.images.every((item) => item.mimeType === "image/jpeg" && item.data.length > 100));
});

test("waits for a page script that takes longer than five seconds before capturing", async () => {
  const rendered = await renderCertificatePage(file(`<html><body><main id="certificate">Loading</main>
    <script src="https://certificate.example/slow.js"></script></body></html>`), {
    download: async () => {
      await new Promise((resolve) => setTimeout(resolve, 5500));
      return { mimeType: "application/javascript", buffer: Buffer.from(
        "document.querySelector('#certificate').textContent = 'Certificate presented to Jane Doe';") };
    },
  });
  assert.match(rendered.rawText, /Certificate presented to Jane Doe/);
  assert.equal(rendered.complete, true);
});

test("a page that exceeds the loading budget returns an error instead of screenshots", async (t) => {
  const previous = env.certificateBrowserTimeoutMs;
  env.certificateBrowserTimeoutMs = 1000;
  t.after(() => { env.certificateBrowserTimeoutMs = previous; });
  await assert.rejects(renderCertificatePage(file(`<html><body>Loading
    <script src="https://certificate.example/slow.js"></script></body></html>`), {
    download: async () => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return { mimeType: "application/javascript", buffer: Buffer.from("void 0;") };
    },
  }), /did not finish loading within the allowed time/);
});

test("reads every screenshot in one model request without exposing the CV owner's name", async () => {
  let called = false;
  const result = await readCertificateDocument(file("<html>Loading...</html>"), "scroll-test", {
    renderPage: async () => ({ html: "<title>Certificate</title>", sourceUrl, images: [image, image, image], complete: true }),
    modelReader: async (document, requestId) => {
      called = true;
      assert.deepEqual(Object.keys(document), ["images"]);
      assert.equal(document.images.length, 3);
      assert.equal(requestId, "scroll-test");
      return { recipientName: "Jane Doe", recipientNames: ["Jane Doe", "Invented Name"], documentText: "Certificate presented to Jane Doe", confidence: 0.99 };
    },
  });
  assert.ok(called);
  assert.deepEqual(result.recipientNames, ["Jane Doe"]);
  assert.equal(result.method, "browser");
});

test("checks all recipients and requires review for conflicting certificate names or partial scans", async () => {
  const rawText = `Jane Doe\nCertificates\nCloud Course\n${sourceUrl}`;
  for (const partial of [false, true]) {
    const result = await verifyCertificate({ url: sourceUrl, rawText, requestId: "scroll-test" }, {
      download: async () => file("<html>Certificate</html>"),
      read: async () => ({ recipientName: "Jane Doe", recipientNames: partial ? ["Jane Doe"] : ["Jane Doe", "John Smith"], method: "browser", confidence: 1, scanComplete: !partial }),
    });
    assert.equal(result.status, "needs_review");
    assert.match(result.reason, partial ? /page content could not be scanned/ : /Different recipient names/);
  }
});

test("visible page text and the certificate image cannot silently contradict each other", async () => {
  const result = await readCertificateDocument(file("<html>Certificate</html>"), "scroll-test", {
    renderPage: async () => ({ html: "<title>Certificate</title><h3>Completed by Jane Doe</h3>", sourceUrl, images: [image], complete: true }),
    modelReader: async () => ({ recipientName: "John Smith", recipientNames: ["John Smith"], documentText: "Certificate awarded to John Smith", confidence: 1 }),
  });
  assert.deepEqual(result.recipientNames, ["John Smith", "Jane Doe"]);
});

test("also follows a public certificate PDF when the rendered page only offers its download link", async () => {
  const result = await readCertificateDocument(file("<html>Certificate</html>"), "scroll-test", {
    renderPage: async () => ({ html: '<title>Certificate</title><a href="/certificate.pdf">Download certificate</a>', sourceUrl, images: [image], complete: true }),
    modelReader: async () => ({ recipientName: "", recipientNames: [], documentText: "Download certificate", confidence: 0 }),
    download: async (url) => { assert.equal(url, "https://certificate.example/certificate.pdf"); return { buffer: Buffer.from("Certificate\nPresented to Jane Doe"), mimeType: "text/plain" }; },
  });
  assert.equal(result.recipientName, "Jane Doe");
  assert.equal(result.confidence, 1);
});
