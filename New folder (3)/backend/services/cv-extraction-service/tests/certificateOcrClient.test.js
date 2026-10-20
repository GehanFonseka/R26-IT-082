import test from "node:test";
import assert from "node:assert/strict";
import { readCertificateWithModel } from "../src/services/certificateOcrClient.js";

test("a stopped certificate service returns an actionable message instead of fetch failed", async (t) => {
  t.mock.method(globalThis, "fetch", async () => { throw new TypeError("fetch failed"); });
  await assert.rejects(readCertificateWithModel({ rawText: "Test certificate" }, "reader-test"),
    /local certificate reader is unavailable.*Start the certificate model service/);
});

test("a certificate inference timeout is distinguished from a stopped service", async (t) => {
  t.mock.method(globalThis, "fetch", async () => { throw new DOMException("timeout", "TimeoutError"); });
  await assert.rejects(readCertificateWithModel({ rawText: "Test certificate" }, "reader-test"), /took too long/);
});

test("model requests preserve the request ID and return inference data", async (t) => {
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    assert.equal(options.headers["x-request-id"], "reader-test");
    assert.deepEqual(JSON.parse(options.body), { rawText: "Test certificate" });
    return Response.json({ data: { recipientName: "Jane Doe", confidence: 1 } });
  });
  assert.deepEqual(await readCertificateWithModel({ rawText: "Test certificate" }, "reader-test"),
    { recipientName: "Jane Doe", confidence: 1 });
});
