import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import gatewayApp from "../src/app.js";
import authApp from "../../services/auth-service/src/app.js";
import { userRepository } from "../../services/auth-service/src/repositories/userRepository.js";
import { env } from "../src/config/env.js";
import jwt from "jsonwebtoken";

const listen = async (server) => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return `http://127.0.0.1:${server.address().port}`;
};
const close = (server) => new Promise((resolve) => server.close(resolve));
const publicUser = ({ passwordHash, ...user }) => user;

test("company owner lists, adds and deletes admins through gateway with immediate access removal", async (t) => {
  const records = new Map();
  t.mock.method(userRepository, "create", async (record) => {
    if ([...records.values()].some((user) => user.email === record.email)) {
      throw Object.assign(new Error("An account with this email already exists"), { statusCode: 409 });
    }
    const user = { ...record, id: `account-${records.size}` };
    records.set(user.id, user);
    return publicUser(user);
  });
  t.mock.method(userRepository, "findById", async (id) => records.has(id) ? publicUser(records.get(id)) : null);
  t.mock.method(userRepository, "findByEmail", async (email) => {
    const user = [...records.values()].find((record) => record.email === email);
    if (!user) throw Object.assign(new Error("Invalid credentials"), { statusCode: 401 });
    return user;
  });
  t.mock.method(userRepository, "listAdmins", async (companyId) => [...records.values()]
    .filter((user) => user.companyId === companyId && user.accountType === "admin").map(publicUser));
  t.mock.method(userRepository, "deleteAdmin", async (companyId, id) => {
    const user = records.get(id);
    return user?.companyId === companyId && user.accountType === "admin" && user.role === "admin" ? records.delete(id) : false;
  });
  const jobRequests = [];
  const jobs = createServer((req, res) => {
    jobRequests.push(req.headers);
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ success: true, data: [] }));
  });
  const auth = createServer(authApp);
  const gateway = createServer(gatewayApp);
  const previousAuth = env.services.auth;
  const previousJobs = env.services.jobs;
  env.services.auth = await listen(auth);
  env.services.jobs = await listen(jobs);
  const base = await listen(gateway);
  const call = async (path, token, method = "GET", body) => {
    const response = await fetch(`${base}/api${path}`, {
      method, headers: { "content-type": "application/json", "x-request-id": "admin-management-test",
        ...(token ? { authorization: `Bearer ${token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: response.status, body: await response.json() };
  };
  const ownerInput = { email: "owner@example.test", password: "test-password", displayName: "Owner", accountType: "company", companyName: "Company A" };
  try {
    const first = await call("/auth/register", null, "POST", ownerInput);
    const second = await call("/auth/register", null, "POST", { ...ownerInput, email: "second@example.test", companyName: "Company B" });
    assert.equal(first.status, 201);
    assert.equal(second.status, 201);
    const owner = first.body.data;
    const otherOwner = second.body.data;
    const legacyOwnerToken = jwt.sign({ sub: owner.user.id, role: "admin", displayName: "Owner" }, env.jwtSecret, { expiresIn: "5m" });
    const restored = await call("/auth/session", legacyOwnerToken);
    assert.equal(restored.status, 200);
    assert.equal(restored.body.data.accountType, "company");
    assert.equal(restored.body.data.companyId, owner.user.companyId);
    assert.equal(restored.body.data.passwordHash, undefined);
    const adminInput = { displayName: "Recruiter", email: "admin@example.test", password: "test-password", companyId: otherOwner.user.companyId };
    const created = await call("/company/admins", owner.accessToken, "POST", adminInput);
    assert.equal(created.status, 201);
    assert.equal(created.body.data.companyId, owner.user.companyId);
    assert.equal(created.body.data.passwordHash, undefined);
    const id = created.body.data.id;
    assert.equal((await call("/company/admins", owner.accessToken, "POST", adminInput)).status, 409);
    assert.equal((await call("/company/admins", owner.accessToken, "POST", { ...adminInput, password: "short" })).status, 400);
    const list = await call("/company/admins", owner.accessToken);
    assert.deepEqual(list.body.data.map((admin) => admin.id), [id]);
    assert.deepEqual((await call("/company/admins", legacyOwnerToken)).body.data.map((admin) => admin.id), [id]);
    assert.deepEqual((await call("/company/admins", otherOwner.accessToken)).body.data, []);
    const login = await call("/auth/login", null, "POST", adminInput);
    assert.equal(login.status, 200);
    const staffToken = login.body.data.accessToken;
    assert.equal((await call("/admin/jobs", staffToken)).status, 200);
    assert.equal(jobRequests[0]["x-company-id"], owner.user.companyId);
    assert.equal((await call(`/company/admins/${id}`, staffToken, "DELETE")).status, 403);
    const staffList = await call("/company/admins", staffToken);
    assert.equal(staffList.status, 200);
    assert.deepEqual(staffList.body.data.map((admin) => admin.id), [id]);
    const candidate = await call("/auth/register", null, "POST", { ...adminInput, email: "candidate@example.test", accountType: "user" });
    assert.equal((await call("/company/admins", candidate.body.data.accessToken)).status, 403);
    assert.equal((await call("/company/admins", staffToken, "POST", adminInput)).status, 403);
    assert.equal((await call(`/company/admins/${id}`, otherOwner.accessToken, "DELETE")).status, 404);
    assert.equal((await call(`/company/admins/${owner.user.id}`, owner.accessToken, "DELETE")).status, 404);
    assert.equal((await call(`/company/admins/${id}`, null, "DELETE")).status, 401);
    const deleted = await call(`/company/admins/${id}`, owner.accessToken, "DELETE");
    assert.equal(deleted.status, 200);
    assert.equal(deleted.body.requestId, "admin-management-test");
    assert.deepEqual((await call("/company/admins", owner.accessToken)).body.data, []);
    assert.equal((await call(`/company/admins/${id}`, owner.accessToken, "DELETE")).status, 404);
    const revoked = await call("/admin/jobs", staffToken);
    assert.equal(revoked.status, 401);
    assert.equal(revoked.body.success, false);
    assert.equal(revoked.body.requestId, "admin-management-test");
    assert.equal(jobRequests.length, 1);
    assert.equal((await call("/company/admins", staffToken)).status, 401);
    assert.equal((await call("/auth/login", null, "POST", adminInput)).status, 401);
    assert.equal((await call("/admin/jobs", owner.accessToken)).status, 200);
  } finally {
    env.services.auth = previousAuth; env.services.jobs = previousJobs;
    await Promise.all([close(gateway), close(auth), close(jobs)]);
  }
});
