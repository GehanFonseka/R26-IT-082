import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { gzipSync, brotliCompressSync } from "node:zlib";
import { readCertificateResponse } from "../src/utils/certificateHttp.js";

test("reads compressed HTML within the decoded byte limit without forwarding credentials", async () => {
  const html = "<html><body><h3>Completed by Jane Doe</h3></body></html>";
  const received = [];
  const server = createServer((req, res) => {
    received.push(req.headers);
    const encoding = req.url.includes("brotli") ? "br" : "gzip";
    const content = req.url.includes("large") ? "a".repeat(4096) : html;
    res.setHeader("content-type", "text/html; charset=utf-8");
    res.setHeader("content-encoding", encoding);
    res.end(encoding === "br" ? brotliCompressSync(content) : gzipSync(content));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    for (const path of ["/gzip", "/brotli"]) {
      const url = new URL(`http://certificate.test:${server.address().port}${path}`);
      const result = await readCertificateResponse(url, { address: "127.0.0.1", family: 4 }, AbortSignal.timeout(3000), 1024);
      assert.equal(result.buffer.toString(), html);
      assert.equal(result.mimeType, "text/html");
    }
    await assert.rejects(readCertificateResponse(new URL(`http://certificate.test:${server.address().port}/large`), { address: "127.0.0.1", family: 4 }, AbortSignal.timeout(3000), 1024), /too large/);
    assert.ok(received.every((headers) => !headers.authorization && !headers.cookie));
    assert.ok(received.every((headers) => headers["accept-encoding"] === "gzip, deflate, br"));
  } finally { await new Promise((resolve) => server.close(resolve)); }
});
