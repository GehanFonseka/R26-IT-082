import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import app from "../src/app.js";
import { env } from "../src/config/env.js";
import { profileRepository } from "../src/repositories/profileRepository.js";
import { certificateCheckRepository } from "../src/repositories/certificateCheckRepository.js";
import { cvRevision } from "../src/utils/cvRevision.js";

test("admin reads candidate CV certificates, skips absent links, and saves rechecks to candidate revision", async () => {
  let profile = null;
  let reads = 0;
  let checks = {};
  const owners = [];
  const originalGet = profileRepository.get;
  const originals = { ...certificateCheckRepository };
  const previousUrl = env.extractionUrl;
  const reader = createServer(async (req, res) => {
    let body = "";
    for await (const chunk of req) body += chunk;
    assert.equal(JSON.parse(body).rawText, "Jane Candidate\nCloud certificate");
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ success: true, data: { status: "matched", cvName: "Jane Candidate", certificateName: "Jane Candidate" } }));
  });
  await new Promise((resolve) => reader.listen(0, "127.0.0.1", resolve));
  env.extractionUrl = `http://127.0.0.1:${reader.address().port}`;
  profileRepository.get = async (userId) => { reads++; owners.push(userId); return profile; };
  certificateCheckRepository.list = async () => checks;
  certificateCheckRepository.get = async (_userId, _revision, url) => checks[url];
  certificateCheckRepository.markChecking = async (userId, _cv, revision, url) => {
    owners.push(userId);
    return checks[url] = { status: "checking", cvRevision: revision };
  };
  certificateCheckRepository.save = async (userId, _cv, result) => { owners.push(userId); return checks[result.url] = result; };
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/profiles/candidate-1/certificates`;
  const headers = { "x-user-id": "admin-1", "x-user-role": "admin", "content-type": "application/json", "x-request-id": "candidate-certificates-test" };
  const url = "https://example.com/cloud";
  try {
    assert.equal((await fetch(base)).status, 401);
    assert.equal((await fetch(base, { headers: { ...headers, "x-user-role": "user" } })).status, 403);
    assert.equal(reads, 0);
    const absent = await (await fetch(base, { headers })).json();
    assert.equal(absent.data.cv, null);
    assert.deepEqual(absent.data.results, {});
    profile = { cv: { fileName: "cv.pdf", rawText: "Jane Candidate", candidate: { name: "Jane Candidate", certifications: [] } } };
    assert.deepEqual((await (await fetch(base, { headers })).json()).data.results, {});
    profile.cv.candidate = { name: "Jane Candidate", certifications: ["Cloud certificate"], certificateDetails: [{ name: "Cloud certificate", url }] };
    profile.cv.rawText = "Jane Candidate\nCloud certificate";
    const revision = cvRevision(profile.cv);
    checks = { [url]: { status: "matched", cvRevision: revision, cvName: "Jane Candidate", certificateName: "Jane Candidate" } };
    const saved = await (await fetch(base, { headers })).json();
    assert.equal(saved.data.cv.revision, revision);
    assert.equal(saved.data.results[url].status, "matched");
    assert.deepEqual(saved.data.cv.candidate.certificateDetails, profile.cv.candidate.certificateDetails);
    assert.equal((await fetch(`${base}?cvRevision=old-cv`, { headers })).status, 409);
    const verify = (body) => fetch(`${base}/verify`, { method: "POST", headers, body: JSON.stringify(body) });
    assert.equal((await verify({ url: "https://example.com/other", cvRevision: revision })).status, 400);
    assert.equal((await verify({ url, cvRevision: "old-cv" })).status, 409);
    const recheck = await verify({ url, cvRevision: revision, force: true, userId: "unrelated-user" });
    assert.equal(recheck.status, 200);
    assert.equal((await recheck.json()).data.status, "checking");
    for (let attempt = 0; checks[url].status === "checking" && attempt < 50; attempt++) await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(checks[url].status, "matched");
    assert.equal(checks[url].cvRevision, revision);
    assert(owners.every((owner) => owner === "candidate-1"));
    profile = { cv: { fileName: "updated.pdf", rawText: "Jane Candidate", candidate: { name: "Jane Candidate", certifications: [] } } };
    const updated = await (await fetch(base, { headers })).json();
    assert.equal(updated.data.cv.fileName, "updated.pdf");
    assert.deepEqual(updated.data.results, {});
    assert.notEqual(updated.data.cv.revision, revision);
  } finally {
    profileRepository.get = originalGet;
    Object.assign(certificateCheckRepository, originals);
    env.extractionUrl = previousUrl;
    await Promise.all([new Promise((resolve) => server.close(resolve)), new Promise((resolve) => reader.close(resolve))]);
  }
});
