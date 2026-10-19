import test from "node:test";
import assert from "node:assert/strict";
import { hasModelScore, needsSkillAnalysis, skillAnalysisSignature } from "../src/utils/skillAnalysis.js";
import { loadSkillAnalysis } from "../src/services/skillAnalysisService.js";

const cv = { rawText: "Synthetic Candidate\nSkills: Python\nProjects: Python API", candidate: { skills: ["Python"] } };
const scored = (signature, score = 60) => ({
  model: { status: "live" }, technicalCompetencyScore: score,
  skills: [{ name: "Python", modelSkillEvidenceStrength: score, modelAlignmentLevel: "Advanced", modelVersion: "v5" }],
  source: { inputSignature: signature }, explainability: { status: "live" },
});

test("model failures and missing outputs differ from a real zero score", () => {
  assert.ok(hasModelScore(scored("input", 0)));
  assert.ok(!hasModelScore({ model: { status: "unavailable" }, technicalCompetencyScore: 0, skills: [] }));
  assert.ok(!hasModelScore({ ...scored("input"), technicalCompetencyScore: null }));
  assert.ok(needsSkillAnalysis(scored("previous"), "changed"));
  assert.ok(needsSkillAnalysis({ ...scored("input"), model: { status: "unavailable" } }, "input"));
});

test("LAN HTTP without Web Crypto can still generate current model scores", async () => {
  assert.equal(await skillAnalysisSignature(cv, null), null);
  assert.ok(needsSkillAnalysis(scored("saved"), null));
});

test("refreshes an empty saved analysis even if its explanation is marked live", async () => {
  const signature = await skillAnalysisSignature(cv);
  const fresh = scored(signature);
  const old = { model: { status: "not-run" }, skills: [], technicalCompetencyScore: 0, explainability: { status: "live" } };
  let calls = 0;
  const result = await loadSkillAnalysis(() => {}, {
    getMyProfile: async () => ({ data: { cv: { ...cv, profileAnalysis: old } } }),
    getMyCvAnalysis: async () => ({ data: old }),
    analyzeCvProfile: async (text, candidate) => {
      calls += 1; assert.equal(text, cv.rawText); assert.deepEqual(candidate, cv.candidate);
      return { data: fresh };
    },
  });
  assert.equal(calls, 1);
  assert.equal(result.profile.cv.profileAnalysis, fresh);
});

test("reuses the current model analysis saved by the analysis service", async () => {
  const fresh = scored(await skillAnalysisSignature(cv));
  const result = await loadSkillAnalysis(() => {}, {
    getMyProfile: async () => ({ data: { cv } }),
    getMyCvAnalysis: async () => ({ data: fresh }),
    analyzeCvProfile: async () => assert.fail("A matching saved analysis should not rerun inference"),
  });
  assert.equal(result.profile.cv.profileAnalysis, fresh);
});

test("failed refreshes expose a warning instead of silently producing a zero score", async () => {
  const result = await loadSkillAnalysis(() => {}, {
    getMyProfile: async () => ({ data: { cv } }),
    getMyCvAnalysis: async () => { throw new Error("No analysis"); },
    analyzeCvProfile: async () => { throw new Error("Service unavailable"); },
  });
  assert.equal(result.profile.cv.profileAnalysis, null);
  assert.match(result.warning, /could not refresh/);
});
