import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { env } from "../src/config/env.js";
import { userRepository } from "../src/repositories/userRepository.js";
import { registerRecruiter, loginRecruiter } from "../src/services/authService.js";
import { createCompanyAdmin, requireCompanyOwner } from "../src/services/companyService.js";
import { validateCredentials } from "../src/validation/authValidation.js";

const input = { email: "owner@example.test", password: "testing-password", displayName: "Owner" };

test("public registration permits only user and company accounts", () => {
  assert.equal(validateCredentials(input).accountType, "user");
  assert.throws(() => validateCredentials({ ...input, role: "admin", adminCode: "anything" }), /user or company/);
  assert.throws(() => validateCredentials({ ...input, accountType: "company" }), /company name/);
});

test("company registration, admin creation and ownership remain company scoped", async (t) => {
  const records = [];
  t.mock.method(userRepository, "create", async (record) => {
    const stored = { ...record, id: `account-${records.length}` };
    records.push(stored);
    const { passwordHash, ...publicUser } = stored;
    return publicUser;
  });
  t.mock.method(userRepository, "findByEmail", async (email) => records.find((record) => record.email === email));
  t.mock.method(userRepository, "findById", async (id) => records.find((record) => record.id === id));
  const first = await registerRecruiter({ ...input, accountType: "company", companyName: "First company" });
  const second = await registerRecruiter({ ...input, email: "second@example.test", accountType: "company", companyName: "Second company" });
  assert.notEqual(first.user.companyId, second.user.companyId);
  assert.equal(first.user.accountType, "company");
  assert.equal(first.user.passwordHash, undefined);
  const claims = jwt.verify(first.accessToken, env.jwtSecret);
  assert.equal(claims.companyId, first.user.companyId);
  const request = (token) => ({ header: () => `Bearer ${token}` });
  assert.equal((await requireCompanyOwner(request(first.accessToken))).id, first.user.id);
  const admin = await createCompanyAdmin(first.user, {
    ...input, email: "admin@example.test", companyId: second.user.companyId, accountType: "company", role: "company",
  });
  assert.equal(admin.companyId, first.user.companyId);
  assert.equal(admin.accountType, "admin");
  assert.equal(admin.role, "admin");
  assert.equal(await bcrypt.compare(input.password, records[2].passwordHash), true);
  const session = await loginRecruiter({ email: admin.email, password: input.password });
  assert.equal(session.user.companyId, first.user.companyId);
  await assert.rejects(requireCompanyOwner(request(session.accessToken)), /Only company owners/);
  await assert.rejects(requireCompanyOwner(request("invalid")), /Authentication required/);
  const user = await registerRecruiter({ ...input, email: "user@example.test" });
  assert.equal(user.user.companyId, null);
  await assert.rejects(requireCompanyOwner(request(user.accessToken)), /Only company owners/);
});
