import test from "node:test";
import assert from "node:assert/strict";
import { scopeCollection } from "../src/repositories/companyCollection.js";
import { companyContext, establishCompanyContext } from "../src/middleware/companyContext.js";

test("staff queries and mutations cannot escape their company", async () => {
  const calls = [];
  const collection = Object.fromEntries(["find", "findOne", "updateOne", "deleteOne", "insertOne"].map((method) => [
    method, (...args) => { calls.push({ method, args }); return args[0]; },
  ]));
  const scoped = scopeCollection(collection, { companyId: "company-a" });
  const hostile = { id: "other-company-record", companyId: "company-b" };
  scoped.find({}); scoped.findOne(hostile); scoped.updateOne(hostile, { $set: { status: "closed" } }); scoped.deleteOne(hostile);
  for (const call of calls) assert.equal(call.args[0].$and[1].companyId, "company-a");
  assert.deepEqual(calls[1].args[0].$and[0], hostile);
  const record = { id: "new-record", companyId: "company-b" };
  scoped.insertOne(record);
  assert.equal(calls[4].args[0].companyId, "company-a");
  assert.equal(record.companyId, "company-a");
  assert.equal(scopeCollection(collection, null), collection);
});

test("company context rejects unassigned admins and isolates concurrent requests", async () => {
  const request = (companyId) => ({ header: (name) => ({ "x-user-role": "admin", "x-company-id": companyId })[name] });
  let status;
  let body;
  const response = { status: (value) => { status = value; return response; }, json: (value) => { body = value; } };
  establishCompanyContext(request(null), response, () => assert.fail("Unassigned admin accepted"));
  assert.equal(status, 403);
  assert.equal(body.success, false);
  const run = (companyId) => new Promise((resolve) => establishCompanyContext(request(companyId), response, async () => {
    await new Promise((finish) => setImmediate(finish));
    resolve(companyContext.getStore().companyId);
  }));
  assert.deepEqual(await Promise.all([run("company-a"), run("company-b")]), ["company-a", "company-b"]);
});
