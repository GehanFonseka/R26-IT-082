import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { env } from "../src/config/env.js";
import { userRepository } from "../src/repositories/userRepository.js";
import { requireActiveSession } from "../src/services/sessionService.js";

test("legacy sessions resolve assigned company identity while invalid and reassigned sessions remain denied", async (t) => {
  let user = { id: "owner", role: "admin", accountType: "company", companyId: "company-a", companyName: "Company A" };
  t.mock.method(userRepository, "findById", async () => user);
  const token = (claims, expiresIn = "5m") => `Bearer ${jwt.sign({ sub: "owner", ...claims }, env.jwtSecret, { expiresIn })}`;
  assert.equal((await requireActiveSession(token({ role: "admin" }))).companyId, "company-a");
  await assert.rejects(requireActiveSession(token({ role: "admin", accountType: "admin", companyId: "company-b" })), { statusCode: 401 });
  await assert.rejects(requireActiveSession(token({ role: "user" })), { statusCode: 401 });
  await assert.rejects(requireActiveSession(token({ role: "admin" }, -1)), { statusCode: 401 });
  await assert.rejects(requireActiveSession("Bearer invalid"), { statusCode: 401 });
  user = null;
  await assert.rejects(requireActiveSession(token({ role: "admin" })), { statusCode: 401 });
});
