import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import { env } from "../src/config/env.js";

test("certificate checks require authentication and forward body and request ID to extraction", async () => {
  const requests = [];
  const downstream = createServer(async (req, res) => {
    let body = "";
    for await (const chunk of req) body += chunk;
    requests.push({ url: req.url, requestId: req.headers["x-request-id"], body: JSON.parse(body) });
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ success: true, data: { status: "needs_review" }, requestId: req.headers["x-request-id"] }));
  });
  await new Promise((resolve) => downstream.listen(0, "127.0.0.1", resolve));
  const gateway = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => gateway.once("listening", resolve));
  const previous = env.services.extraction;
  env.services.extraction = `http://127.0.0.1:${downstream.address().port}`;
  const endpoint = `http://127.0.0.1:${gateway.address().port}/api/cv/certificates/verify`;
  const body = { url: "https://example.com/certificate.pdf", rawText: "Jane Doe\nCertificates\nCloud certificate" };
  try {
    assert.equal((await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })).status, 401);
    assert.equal(requests.length, 0);
    const token = jwt.sign({ sub: "certificate-test", role: "user" }, env.jwtSecret, { expiresIn: "5m" });
    const response = await fetch(endpoint, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json", "x-request-id": "certificate-gateway-test" }, body: JSON.stringify(body) });
    assert.equal(response.status, 200);
    assert.deepEqual(requests, [{ url: "/certificates/verify", requestId: "certificate-gateway-test", body }]);
    assert.equal((await response.json()).data.status, "needs_review");
  } finally {
    env.services.extraction = previous;
    await Promise.all([new Promise((resolve) => gateway.close(resolve)), new Promise((resolve) => downstream.close(resolve))]);
  }
});
