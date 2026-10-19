import test from "node:test";
import assert from "node:assert/strict";
import { buildInterviewReferences, referenceDraft } from "../src/utils/interviewReferences.js";

const questions = [
  { questionId: "q1", question: "What is Redux?", referenceSource: "provided", referenceAnswer: "A state management library." },
  { questionId: "q2", question: "What is React?", referenceSource: "job-context", referenceAnswer: "A strong answer should address React." },
];
test("compares the edited answer without losing other saved references", () => {
  assert.deepEqual(buildInterviewReferences(questions, { q2: "  A library for building user interfaces.  " }), [
    { questionId: "q1", question: "What is Redux?", answer: "A state management library." },
    { questionId: "q2", question: "What is React?", answer: "A library for building user interfaces." },
  ]);
});
test("keeps job-context references distinct from interviewer input", () => {
  assert.equal(referenceDraft(questions[1]), "");
  assert.equal(referenceDraft(questions[0]), "A state management library.");
});
test("clearing a saved reference omits it from the next comparison", () => {
  assert.deepEqual(buildInterviewReferences(questions, { q1: "   " }), []);
});
