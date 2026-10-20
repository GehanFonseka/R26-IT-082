import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import { env } from "../src/config/env.js";

test("admin certificates use the company application owner, reload current CV, and protect rechecks", async () => {
  const requests = [];
  let revision = "cv-1";
  const downstream = createServer(async (req, res) => {
    let body = "";
    for await (const chunk of req) body += chunk;
    requests.push({ path: req.url, method: req.method, headers: req.headers, body: body ? JSON.parse(body) : null });
    res.setHeader("content-type", "application/json");
    if (req.url === "/applications") {
      const data = req.headers["x-company-id"] === "company-a"
        ? [{ id: "application-1", applicant: { userId: "candidate-1" } }, { id: "orphan" }]
        : [];
      return res.end(JSON.stringify({ success: true, data }));
    }
    if (req.url.startsWith("/profiles/candidate-1/certificates")) {
      const data = req.method === "POST" ? { status: "checking" } : {
        cv: { fileName: `${revision}.pdf`, revision, candidate: { certifications: ["Cloud certificate"] } },
        results: {}, cvRevision: revision,
      };
      return res.end(JSON.stringify({ success: true, data, requestId: req.headers["x-request-id"] }));
    }
    res.writeHead(404).end(JSON.stringify({ success: false }));
  });
  await new Promise((resolve) => downstream.listen(0, "127.0.0.1", resolve));
  const gateway = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => gateway.once("listening", resolve));
  const previous = { jobs: env.services.jobs, candidates: env.services.candidates };
  env.services.jobs = env.services.candidates = `http://127.0.0.1:${downstream.address().port}`;
  const base = `http://127.0.0.1:${gateway.address().port}/api/admin/applications`;
  const token = (role, companyId = "company-a") => jwt.sign({ sub: "admin-1", role, companyId }, env.jwtSecret, { expiresIn: "5m" });
  const headers = { authorization: `Bearer ${token("admin")}`, "content-type": "application/json", "x-request-id": "admin-certificates-test" };
  try {
    assert.equal((await fetch(`${base}/application-1/certificates`)).status, 401);
    assert.equal((await fetch(`${base}/application-1/certificates`, { headers: { authorization: `Bearer ${token("user")}` } })).status, 403);
    assert.equal((await fetch(`${base}/application-1/certificates/verify`, { method: "POST", headers: { ...headers, authorization: `Bearer ${token("user")}` }, body: "{}" })).status, 403);
    assert.equal(requests.length, 0);
    const response = await fetch(`${base}/application-1/certificates`, { headers });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).data.cv.fileName, "cv-1.pdf");
    const target = requests.at(-1);
    assert.equal(target.path, "/profiles/candidate-1/certificates?cvRevision=");
    assert.equal(target.headers["x-user-id"], "admin-1");
    assert.equal(target.headers["x-user-role"], "admin");
    assert.equal(target.headers["x-company-id"], "company-a");
    assert.equal(target.headers["x-request-id"], "admin-certificates-test");
    revision = "cv-2";
    assert.equal((await (await fetch(`${base}/application-1/certificates`, { headers })).json()).data.cv.revision, "cv-2");
    await fetch(`${base}/application-1/certificates?cvRevision=cv-2`, { headers });
    assert.equal(requests.at(-1).path, "/profiles/candidate-1/certificates?cvRevision=cv-2");
    const recheck = { url: "https://example.com/certificate", cvRevision: "cv-2", force: true, userId: "unrelated-user" };
    assert.equal((await fetch(`${base}/application-1/certificates/verify`, { method: "POST", headers, body: JSON.stringify(recheck) })).status, 200);
    assert.equal(requests.at(-1).path, "/profiles/candidate-1/certificates/verify");
    assert.deepEqual(requests.at(-1).body, recheck);
    const count = requests.filter((request) => request.path.startsWith("/profiles/")).length;
    const otherCompany = { ...headers, authorization: `Bearer ${token("admin", "company-b")}` };
    assert.equal((await fetch(`${base}/application-1/certificates`, { headers: otherCompany })).status, 404);
    assert.equal((await fetch(`${base}/application-1/certificates/verify`, { method: "POST", headers: otherCompany, body: JSON.stringify(recheck) })).status, 404);
    assert.equal((await fetch(`${base}/missing/certificates`, { headers })).status, 404);
    assert.equal((await fetch(`${base}/orphan/certificates`, { headers })).status, 409);
    assert.equal(requests.filter((request) => request.path.startsWith("/profiles/")).length, count);
  } finally {
    Object.assign(env.services, previous);
    await Promise.all([new Promise((resolve) => gateway.close(resolve)), new Promise((resolve) => downstream.close(resolve))]);
  }
});
