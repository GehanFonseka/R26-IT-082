import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import { env } from "../src/config/env.js";

test("gateway forwards signed company claims and rejects spoofed staff permissions", async () => {
  const requests = [];
  const downstream = createServer((req, res) => {
    requests.push({ url: req.url, headers: req.headers });
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ success: true, data: [], requestId: req.headers["x-request-id"] }));
  });
  await new Promise((resolve) => downstream.listen(0, "127.0.0.1", resolve));
  const gateway = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => gateway.once("listening", resolve));
  const previousJobs = env.services.jobs;
  const previousAuth = env.services.auth;
  env.services.jobs = env.services.auth = `http://127.0.0.1:${downstream.address().port}`;
  const url = `http://127.0.0.1:${gateway.address().port}`;
  const token = (claims) => jwt.sign({ sub: "account-a", ...claims }, env.jwtSecret, { expiresIn: "5m" });
  const ownerToken = token({ role: "admin", accountType: "company", companyId: "company-a", companyName: "Company A" });
  try {
    const response = await fetch(`${url}/api/admin/jobs`, { headers: {
      authorization: `Bearer ${ownerToken}`, "x-company-id": "company-b", "x-user-id": "other-account", "x-request-id": "company-test",
    } });
    assert.equal(response.status, 200);
    assert.equal(requests[0].headers["x-company-id"], "company-a");
    assert.equal(requests[0].headers["x-user-id"], "account-a");
    assert.equal(requests[0].headers["x-request-id"], "company-test");
    const userResponse = await fetch(`${url}/api/admin/jobs`, { headers: {
      authorization: `Bearer ${token({ role: "user" })}`, "x-user-role": "admin", "x-company-id": "company-a",
    } });
    assert.equal(userResponse.status, 403);
    const legacyResponse = await fetch(`${url}/api/admin/jobs`, { headers: { authorization: `Bearer ${token({ role: "admin" })}` } });
    assert.equal(legacyResponse.status, 403);
    assert.equal(requests.length, 2);
    assert.equal(requests[1].url, "/session");
    const admins = await fetch(`${url}/api/company/admins`, { headers: { authorization: `Bearer ${ownerToken}` } });
    assert.equal(admins.status, 200);
    assert.equal(requests[2].url, "/company/admins");
    assert.equal(requests[2].headers.authorization, `Bearer ${ownerToken}`);
  } finally {
    env.services.jobs = previousJobs; env.services.auth = previousAuth;
    await Promise.all([new Promise((resolve) => gateway.close(resolve)), new Promise((resolve) => downstream.close(resolve))]);
  }
});
