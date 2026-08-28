import { findSkill, skillCatalog } from "../utils/skillCatalog.js";
import { normalize } from "../utils/text.js";
import { predictStrengthBatch } from "./strengthModelClient.js";

const modelLevel = (score) => score >= 70 ? "Advanced" : score >= 40 ? "Intermediate" : "Beginner";
const average = (items, field) => items.length ? items.reduce((sum, item) => sum + (Number(item[field]) || 0), 0) / items.length : 0;
const mostCommon = (items, field) => {
  const counts = new Map();
  items.map((item) => item[field]).filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "";
};

const buildContexts = ({ text, sections, candidate, projects, skills }) => {
  const experienceEntries = [...(sections.experience || []), ...(Array.isArray(candidate.experienceHighlights) ? candidate.experienceHighlights : [])];
  const experience = experienceEntries.join("\n") || text;
  const certifications = [...(sections.certifications || []), ...(Array.isArray(candidate.certifications) ? candidate.certifications : [])].join("; ");
  const allProjects = projects.map((project) => project.description);
  const allSkills = [...new Set([...skills.map((skill) => skill.name), ...projects.flatMap((project) => project.technologies)])];
  const contexts = [];
  for (const skill of skills) {
    const catalogItem = skillCatalog.find(([name]) => normalize(name) === skill.normalizedName);
    const relevant = projects.filter((project) => project.technologies.includes(skill.name) || (catalogItem && findSkill(project.description, catalogItem)));
    const selected = relevant.length ? relevant.slice(0, 3) : [{ description: "No explicit project evidence was found for this skill.", projectIndex: null }];
    for (const project of selected) contexts.push({
      skill: skill.name, project: project.description, experience,
      experienceYears: Number(candidate.yearsExperience) || skill.years || 0, certifications,
      experienceEntries, allProjects, allSkills, projectIndex: project.projectIndex ?? projects.indexOf(project),
    });
  }
  return contexts.slice(0, 256);
};

const mergeScores = (base, contexts, scores) => {
  const scored = contexts.map((context, index) => ({ ...context, score: scores[index] })).filter((item) => item.score);
  if (!scored.length) return base;
  const groups = new Map();
  for (const item of scored) groups.set(normalize(item.skill), [...(groups.get(normalize(item.skill)) || []), item.score]);
  const skills = base.skills.map((skill) => {
    const modelScores = groups.get(skill.normalizedName) || [];
    if (!modelScores.length) return skill;
    const skillScore = average(modelScores, "skillEvidenceStrength");
    return {
      ...skill, ruleBasedLevel: skill.level,
      level: mostCommon(modelScores, "skillProficiency") || modelLevel(skillScore),
      modelProjectStrength: Math.round(average(modelScores, "projectStrength") * 100) / 100,
      modelSkillEvidenceStrength: Math.round(skillScore * 100) / 100,
      modelExperienceProjectAlignment: Math.round(average(modelScores, "experienceProjectAlignment") * 100) / 100,
      modelProjectStrengthLevel: mostCommon(modelScores, "projectStrengthLevel"),
      modelSkillStrengthLevel: mostCommon(modelScores, "skillStrengthLevel"),
      modelSkillProficiency: mostCommon(modelScores, "skillProficiency") || modelLevel(skillScore),
      modelAlignmentLevel: mostCommon(modelScores, "alignmentLevel"),
      modelEvidenceCount: modelScores.length,
      modelProjectStrengthConfidence: Math.round(average(modelScores, "projectStrengthConfidence") * 10000) / 10000,
      modelSkillStrengthConfidence: Math.round(average(modelScores, "skillProficiencyConfidence") * 10000) / 10000,
      modelAlignmentConfidence: Math.round(average(modelScores, "alignmentConfidence") * 10000) / 10000,
      modelExperienceYears: Math.round(average(modelScores, "experienceYears") * 100) / 100,
      modelVersion: mostCommon(modelScores, "modelVersion"),
      modelScoreType: mostCommon(modelScores, "scoreType"),
      confidence: skillScore >= 70 ? "High" : skillScore >= 40 ? "Medium" : "Low",
    };
  });
  const projects = base.projects.map((project, projectIndex) => {
    const projectScores = scored.filter((item) => item.projectIndex === projectIndex).map((item) => item.score);
    if (!projectScores.length) return project;
    return {
      ...project, modelProjectStrength: Math.round(average(projectScores, "projectStrength") * 100) / 100,
      modelSkillEvidenceStrength: Math.round(average(projectScores, "skillEvidenceStrength") * 100) / 100,
      modelExperienceProjectAlignment: Math.round(average(projectScores, "experienceProjectAlignment") * 100) / 100,
      modelProjectLevel: mostCommon(projectScores, "projectStrengthLevel") || "",
      modelProjectStrengthConfidence: Math.round(average(projectScores, "projectStrengthConfidence") * 10000) / 10000,
      modelSkills: [...new Set(scored.filter((item) => item.projectIndex === projectIndex).map((item) => item.skill))],
    };
  });
  const technicalScore = Math.round(scored.reduce((sum, item) => sum + (Number(item.score.skillEvidenceStrength) || 0) * 0.45 + (Number(item.score.projectStrength) || 0) * 0.35 + (Number(item.score.experienceProjectAlignment) || 0) * 0.2, 0) / scored.length);
  return {
    ...base, analysisVersion: "cv-profile-v5", analysisMethod: "deberta-v3-base-multitask-with-rule-based-parsing",
    skills, projects,
    topSkills: [...skills].sort((a, b) => (b.modelSkillEvidenceStrength || 0) - (a.modelSkillEvidenceStrength || 0) || Number(b.relevantToJob) - Number(a.relevantToJob)).slice(0, 6).map((skill) => skill.name),
    technicalCompetencyScore: technicalScore,
    model: { service: "resume-strength-model-service", status: "live", modelId: "resume_strength_model_v5", version: "v5", scoreType: "sigmoid-percent" },
    source: { ...base.source, modelContextCount: scored.length },
  };
};

export const enrichStrengthAnalysis = async ({ base, text, sections, candidate, projects, skills, requestId = "" }) => {
  const contexts = buildContexts({ text, sections, candidate, projects, skills });
  if (!contexts.length) return { ...base, model: { service: "resume-strength-model-service", status: "not-run", reason: "No detected skills" } };
  try {
    return mergeScores(base, contexts, await predictStrengthBatch(contexts, requestId));
  } catch (error) {
    return { ...base, model: { service: "resume-strength-model-service", status: "unavailable", error: error.message }, source: { ...base.source, modelContextCount: 0 } };
  }
};
