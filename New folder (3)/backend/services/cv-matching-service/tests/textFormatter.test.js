import test from "node:test";
import assert from "node:assert/strict";
import { buildCandidateText, buildJobText } from "../src/services/textFormatter.js";
import { compactModelText } from "../src/model/modelInput.js";

test("formats the job and candidate contract for the model", () => {
  const job = buildJobText({ jobTitle: "Engineer", mustHaveSkills: "Node.js" });
  const candidate = buildCandidateText({ role: "Engineer", skills: ["Node.js"] });
  assert.match(job, /Job Title: Engineer/);
  assert.match(candidate, /Candidate Role: Engineer/);
  assert.match(candidate, /Skills: Node.js/);
});

test("keeps both long model inputs within the model context window", () => {
  const longText = "Candidate Skills: React, Node.js, MongoDB. ".repeat(30);
  const compact = compactModelText(longText);
  assert.ok(compact.length <= 443);
  assert.ok(compact.startsWith("Candidate Skills:"));
  assert.ok(compact.endsWith("..."));
});
