import test from "node:test";
import assert from "node:assert/strict";
import { MongoClient } from "mongodb";
import { env } from "../src/config/env.js";
import { companyContext } from "../src/middleware/companyContext.js";
import { jobRepository } from "../src/repositories/jobRepository.js";
import { getInterviewAnalysisContext } from "../src/repositories/interviewAnalysisContextRepository.js";

const matches = (record, query) => Object.entries(query).every(([key, value]) => {
  if (key === "$and") return value.every((part) => matches(record, part));
  return value?.$in ? value.$in.includes(record[key]) : record[key] === value;
});

test("two companies share candidate applications while keeping recruitment and interviews isolated", async (t) => {
  const collections = new Map();
  const database = { collection: (name) => {
    if (!collections.has(name)) collections.set(name, []);
    const rows = collections.get(name);
    return {
      createIndex: async () => {},
      insertOne: async (record) => rows.push({ ...record }),
      findOne: async (query) => rows.find((record) => matches(record, query)) || null,
      find: (query) => {
        const cursor = { sort: () => cursor, limit: () => cursor, toArray: async () => rows.filter((record) => matches(record, query)) };
        return cursor;
      },
      updateOne: async (query, update, options) => {
        const record = rows.find((row) => matches(row, query));
        if (record) Object.assign(record, update.$set);
        else if (options?.upsert) rows.push({ ...update.$set });
      },
    };
  } };
  const previousUri = env.mongoUri;
  env.mongoUri = "mongodb://127.0.0.1:27017/test";
  t.mock.method(MongoClient.prototype, "connect", async function () { return this; });
  t.mock.method(MongoClient.prototype, "db", () => database);
  const staff = (companyId, action) => companyContext.run({ companyId, companyName: companyId === "company-a" ? "Company A" : "Company B" }, action);
  try {
    const firstJob = await staff("company-a", () => jobRepository.createJob("owner-a", {
      title: "First", status: "open", company: "Spoofed company", publisherCompany: { id: "company-b", name: "Spoofed company" },
    }));
    const secondJob = await staff("company-b", () => jobRepository.createJob("owner-b", { title: "Second", status: "open" }));
    assert.equal(firstJob.companyId, "company-a");
    assert.equal(firstJob.company, "Company A");
    assert.deepEqual(firstJob.publisherCompany, { id: "company-a", name: "Company A" });
    const updated = await staff("company-a", () => jobRepository.updateJob(firstJob.id, {
      title: "Updated first", publisherCompany: { id: "company-b", name: "Company B" }, companyId: "company-b",
    }));
    assert.deepEqual(updated.publisherCompany, firstJob.publisherCompany);
    assert.equal(updated.companyId, "company-a");
    assert.deepEqual((await jobRepository.listJobs()).map((job) => job.publisherCompany.name).sort(), ["Company A", "Company B"]);
    const application = await jobRepository.createApplication(firstJob.id, "candidate", { userId: "candidate" }, { candidate: {} });
    assert.equal(application.companyId, "company-a");
    assert.equal((await staff("company-b", () => jobRepository.listApplications())).length, 0);
    await staff("company-b", () => assert.rejects(jobRepository.updateJob(firstJob.id, { status: "closed" }), /not found/));
    assert.equal((await jobRepository.getJob(firstJob.id)).status, "open");
    const interview = await staff("company-a", () => jobRepository.createInterview("admin-a", {
      jobId: firstJob.id, applicationId: application.id, scheduledAt: "2026-10-03T10:00:00Z",
    }));
    await staff("company-b", () => assert.rejects(jobRepository.getInterviewRoom(interview.id, "admin-b", "admin"), /not found/));
    await assert.rejects(jobRepository.getInterviewRoom(interview.id, "other-candidate", "user"), /not a participant/);
    await jobRepository.saveInterviewOffer(interview.id, "candidate", "user", "v=0\r\n");
    await jobRepository.appendInterviewTranscript(interview.id, "candidate", "user", "Candidate", { text: "My answer" });
    const transcript = await staff("company-a", () => jobRepository.listInterviewTranscript(interview.id, "admin-a", "admin"));
    assert.equal(transcript.length, 1);
    assert.equal(transcript[0].companyId, "company-a");
    const room = await staff("company-a", () => jobRepository.getInterviewRoom(interview.id, "admin-a", "admin"));
    assert.equal(room.offer.userId, "candidate");
    await staff("company-b", () => assert.rejects(getInterviewAnalysisContext(interview.id, "admin-b", "admin"), /not found/));
    assert.deepEqual((await staff("company-b", () => jobRepository.listJobs())).map((job) => job.id), [secondJob.id]);
  } finally { env.mongoUri = previousUri; }
});
