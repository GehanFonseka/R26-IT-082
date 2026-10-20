import test from "node:test";
import assert from "node:assert/strict";
import { averageModelScore } from "../src/utils/modelScores.js";

test("overall model score excludes fallback scores when inference fails", () => {
  assert.equal(averageModelScore([
    { modelScore: { score: 80 }, answerScore: 80 },
    { modelScore: null, answerScore: 20 },
    { modelScore: { score: 60 }, answerScore: 60 },
  ]), 70);
});
test("unavailable output remains N/A while a genuine zero stays valid", () => {
  assert.equal(averageModelScore([{ modelScore: null, answerScore: 90 }]), null);
  assert.equal(averageModelScore([]), null);
  assert.equal(averageModelScore([{ modelScore: { score: 0 } }]), 0);
});
