import test from "node:test";
import assert from "node:assert/strict";
import { calculateSpeechMetrics } from "../src/services/metricsService.js";
import { pairTranscript } from "../src/services/transcriptService.js";
import { referenceFor } from "../src/services/scoringService.js";

test("pairs an interviewer question with the following candidate turns", () => {
  const pairs = pairTranscript([
    { id: "q1", role: "admin", text: "Explain React components?", createdAt: "2026-08-19T10:00:00.000Z" },
    { id: "a1", role: "user", text: "I build reusable components.", createdAt: "2026-08-19T10:00:04.000Z" },
  ]);
  assert.equal(pairs.length, 1);
  assert.equal(pairs[0].answer, "I build reusable components.");
});

test("calculates filler words and response time from transcript timestamps", () => {
  const metrics = calculateSpeechMetrics({ questionAt: "2026-08-19T10:00:00.000Z", answerStartedAt: "2026-08-19T10:00:03.000Z", answerEndedAt: "2026-08-19T10:00:13.000Z", answer: "Um, I, like, build React components." });
  assert.equal(metrics.responseTimeSeconds, 3);
  assert.equal(metrics.fillerWordCount, 2);
  assert.equal(metrics.totalWords, 6);
});

test("derives a transparent role-based reference plan when no answer is supplied", () => {
  const plan = referenceFor({ question: "How do you use React?" }, { mustHaveSkills: ["React", "Node.js"] }, []);
  assert.equal(plan.referenceSource, "job-context");
  assert.ok(plan.concepts.includes("React"));
});

test("uses the interviewer reference for the matching question ID", () => {
  const plan = referenceFor({ questionId: "q2", question: "What is Redux?" }, {}, [
    { questionId: "q1", question: "What is Redux?", answer: "An earlier question's answer." },
    { questionId: "q2", question: "What is Redux?", answer: "Redux is a predictable state container." },
  ]);
  assert.equal(plan.referenceAnswer, "Redux is a predictable state container.");
  assert.equal(plan.referenceSource, "provided");
});
test("supports question-text references without assigning another question's answer", () => {
  const pair = { questionId: "q2", question: "What is Redux?" };
  assert.equal(referenceFor(pair, {}, [{ question: "what is redux", answer: "State container." }]).referenceAnswer, "State container.");
  assert.equal(referenceFor(pair, {}, [{ questionId: "q1", question: pair.question, answer: "Different question." }]).referenceSource, "job-context");
});
