import test from "node:test";
import assert from "node:assert/strict";
import { extractCandidateFields } from "../src/utils/candidateParser.js";

test("extracts candidate fields and separates projects from CV text", () => {
  const candidate = extractCandidateFields(`Jane Doe\nSenior Engineer\n\nSkills\nNode.js, React\n\nProjects\nE-commerce platform\nBuilt a checkout API\nPortfolio website\nReact personal portfolio\n\nExperience\nBuilt APIs\n\nEducation\nBSc Computer Science`);
  assert.equal(candidate.role, "Senior Engineer");
  assert.equal(candidate.seniority, "Senior");
  assert.deepEqual(candidate.skills, ["Node.js", "React"]);
  assert.equal(candidate.experienceHighlights[0], "Built APIs");
  assert.deepEqual(candidate.projects, ["E-commerce platform", "Built a checkout API", "Portfolio website", "React personal portfolio"]);
});

test("recognizes decorated and structured project headings", () => {
  const candidate = extractCandidateFields(`Jane Doe\n\n🔹 RELEVANT PROJECTS\nProject Name: Social Media Platform\nRole: Full-Stack Developer\nTech Stack: Java, Spring Boot, React\nProject Name: Learning Platform\nRole: AI Developer\n\nEDUCATION\nBSc Computer Science`);
  assert.equal(candidate.projects.length, 2);
  assert.match(candidate.projects[0], /Social Media Platform/);
  assert.match(candidate.projects[0], /Spring Boot/);
  assert.match(candidate.projects[1], /Learning Platform/);
});
