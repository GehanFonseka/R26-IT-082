import test from "node:test";
import assert from "node:assert/strict";
import { createJob, updateJob } from "../src/controllers/jobController.js";
import { jobRepository } from "../src/repositories/jobRepository.js";

test("company owners and staff publish and update jobs using only their gateway company name", async (t) => {
  const received = [];
  t.mock.method(jobRepository, "createJob", async (id, job) => { received.push(job); return job; });
  t.mock.method(jobRepository, "updateJob", async (id, job) => { received.push(job); return job; });
  const response = { status: () => response, json: (value) => value };
  for (const userId of ["company-owner", "company-admin"]) {
    const request = {
      requestId: "company-job-test", params: { jobId: "job-a" },
      body: { title: "Developer", company: "Another company" },
      header: (name) => ({ "x-user-role": "admin", "x-user-id": userId, "x-company-name": "Oppr" })[name],
    };
    assert.equal((await createJob(request, response)).data.company, "Oppr");
    assert.equal((await updateJob(request, response)).data.company, "Oppr");
    request.header = (name) => ({ "x-user-role": "admin", "x-user-id": userId })[name];
    await assert.rejects(createJob(request, response), /company name is required/);
    await assert.rejects(updateJob(request, response), /company name is required/);
  }
  assert.equal(received.length, 4);
});
