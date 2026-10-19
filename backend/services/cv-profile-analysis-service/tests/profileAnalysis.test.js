import test from "node:test";
import assert from "node:assert/strict";
import { analyzeCv } from "../src/services/analysisService.js";

test("builds explainable skills, project evidence, and competency score", () => {
  const result = analyzeCv({
    rawText: "Asha Perera\nSoftware Engineer\nSUMMARY\nThree years building products.\nSKILLS\nPython, React, Docker\nPROJECTS\nProduction hiring platform: React, Docker, Python microservices\nEDUCATION\nBSc Computer Science",
    candidate: { role: "Software Engineer", yearsExperience: 3 },
    job: { mustHaveSkills: ["Python", "React"], niceToHaveSkills: ["Docker"] },
  });
  assert.equal(result.name, "Asha Perera");
  assert.equal(result.projects.length, 1);
  assert.equal(result.skills.find((skill) => skill.name === "React").relevance, "Must-have");
  assert.ok(result.technicalCompetencyScore > 0);
});
