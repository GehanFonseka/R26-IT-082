import test from "node:test";
import assert from "node:assert/strict";
import { rankApplicants, descriptionScore, skillScore } from "../src/utils/applicantRanking.js";

const job = { mustHaveSkills: ["React", "Node.js"] };
const applicant = (id, probability, react, node, extra = 100) => ({
  id, matchScore: { probability },
  candidateAnalysis: { model: { status: "live" }, skills: [
    { name: "React", modelSkillEvidenceStrength: react },
    { name: "Node.js", modelSkillEvidenceStrength: node },
    { name: "Unrelated", modelSkillEvidenceStrength: extra },
  ] },
});

test("description model takes priority over stronger skills", () => {
  const entries = [applicant("skills", .7, 100, 100), applicant("cv", .8, 10, 10)];
  assert.deepEqual(rankApplicants(entries, job).map((item) => item.id), ["cv", "skills"]);
  assert.equal(entries[0].id, "skills");
});
test("equal description outputs use job relevant model evidence", () => {
  assert.deepEqual(rankApplicants([applicant("low", .8, 20, 30), applicant("high", .8, 80, 90, 0)], job).map((item) => item.id), ["high", "low"]);
  assert.equal(skillScore(applicant("a", .8, 80, 90), job), 85);
});
test("full precision probability wins despite equal rounded percentages", () => {
  assert.equal(rankApplicants([applicant("low", .80001, 100, 100), applicant("high", .80002, 0, 0)], job)[0].id, "high");
});
test("missing scores are last and valid zero is scored", () => {
  assert.deepEqual(rankApplicants([{ id: "missing" }, applicant("zero", 0, 0, 0)], job).map((item) => item.id), ["zero", "missing"]);
  assert.equal(descriptionScore({ matchScore: { probability: null } }), -1);
  assert.equal(skillScore({ candidateAnalysis: { technicalCompetencyScore: 100 } }, job), -1);
});
