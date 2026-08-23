import { canonicalSkill, countSkillOccurrences, findSkill, skillCatalog } from "../utils/skillCatalog.js";
import { predictStrengthBatch } from "./strengthModelClient.js";
import { clean, clamp, list, normalize, parseSections, titleCase } from "../utils/text.js";

const prepareText = (rawText) => String(rawText || "").replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, 100000);

const durationFor = (text, item) => {
  const sourceLine = text.split(/\r?\n/).find((line) => findSkill(line, item)) || "";
  const match = sourceLine.match(/(\d+(?:\.\d+)?)\s*(years?|yrs?|months?|mos?)/i);
  if (!match) return { years: null, months: null, label: "Not explicitly stated", source: "not-stated" };
  const amount = Number(match[1]);
  const months = /month|mos?/i.test(match[2]) ? Math.round(amount) : Math.round(amount * 12);
  return { years: Number((months / 12).toFixed(1)), months, label: months < 12 ? `${months} months` : `${(months / 12).toFixed(1)} years`, source: "cv-evidence" };
};

const sectionEntries = (items, limit = 8) => items.slice(0, limit).map((line, index) => ({
  title: index === 0 ? clean(line, 120) : "Experience detail",
  company: "",
  duration: (line.match(/\b(?:20\d{2}|19\d{2})\s*[-–]\s*(?:20\d{2}|present|current)/i) || [""])[0],
  description: clean(line, 900),
}));

const projectsFrom = (items) => items.slice(0, 8).map((line, index) => {
  const technologies = skillCatalog.filter((item) => findSkill(line, item)).map((item) => item[0]);
  const complex = /microservice|distributed|production|deployment|scale|architecture|pipeline|real[- ]?time|integration/i.test(line);
  return { name: clean(line.split(/[:–]/)[0], 100) || `Project ${index + 1}`, description: clean(line, 900), technologies, complexity: complex ? "Complex" : "Foundational", candidateRole: /lead|owned|built|designed|developed/i.test(line) ? "Primary contributor" : "Contributor", leadership: /lead|led|managed|owner/i.test(line), evidence: clean(line, 300) };
});

const nameFrom = (raw, candidate, sections) => {
  if (candidate.name || candidate.fullName) return clean(candidate.name || candidate.fullName, 120);
  return (sections.other || []).slice(0, 8).find((line) => line.split(/\s+/).length >= 2 && line.split(/\s+/).length <= 5 && !/@|https?:|\+?\d[\d ()-]{7,}/i.test(line) && !/resume|curriculum vitae|developer|engineer/i.test(line)) || "Candidate";
};

const skillLevel = (duration, occurrences, projectUse) => duration.years >= 4 || (projectUse && occurrences >= 4) ? "Advanced" : duration.years >= 2 || projectUse || occurrences >= 2 ? "Intermediate" : "Beginner";
const confidence = (duration, occurrences, projectUse) => duration.source === "cv-evidence" ? "High" : projectUse || occurrences > 1 ? "Medium" : "Low";
const jobSkills = (job, field) => list(job?.[field] || (field === "mustHaveSkills" ? job?.mustHaveSkills : job?.niceToHaveSkills)).map((value) => normalize(canonicalSkill(value)));
const inferredSoftSkills = (text) => ["Communication", "Teamwork", "Leadership", "Problem solving", "Adaptability", "Collaboration", "Time management"].filter((skill) => text.toLowerCase().includes(skill.toLowerCase()));

const extractSkills = (rawText, candidate, projects, job) => skillCatalog.filter((item) => findSkill(rawText, item) || (candidate.skills || []).some((skill) => findSkill(String(skill), item))).map((item) => {
  const name = item[0]; const occurrences = countSkillOccurrences(rawText, item);
  const projectUse = projects.some((project) => project.technologies.includes(name)); const duration = durationFor(rawText, item);
  const required = jobSkills(job, "mustHaveSkills").includes(normalize(name)); const preferred = jobSkills(job, "niceToHaveSkills").includes(normalize(name));
  return { name, normalizedName: normalize(name), years: duration.years, months: duration.months, durationLabel: duration.label, level: skillLevel(duration, occurrences, projectUse), confidence: confidence(duration, occurrences, projectUse), evidenceCount: occurrences, evidence: clean(rawText.match(new RegExp(`.{0,70}${item[1]}.{0,100}`, "i"))?.[0] || "", 260), usedInProjects: projectUse, relevance: required ? "Must-have" : preferred ? "Nice-to-have" : "Additional", relevantToJob: required || preferred };
});

const competencyScore = (skills, projects, sections, job) => {
  if (!skills.length) return 0;
  const points = { Beginner: 45, Intermediate: 72, Advanced: 92 };
  const skillScore = skills.reduce((sum, skill) => sum + points[skill.level] + (skill.relevance === "Must-have" ? 8 : skill.relevance === "Nice-to-have" ? 3 : 0), 0) / skills.length;
  const projectScore = clamp(projects.length * 18 + projects.filter((project) => project.technologies.length).length * 8);
  const completeness = [sections.education, sections.experience, sections.projects, sections.summary].filter((section) => section?.length).length * 25;
  const required = jobSkills(job, "mustHaveSkills"); const matched = required.filter((item) => skills.some((skill) => skill.normalizedName === item)).length;
  const relevance = required.length ? (matched / required.length) * 100 : 70;
  return Math.round(clamp(skillScore * 0.5 + projectScore * 0.25 + completeness * 0.1 + relevance * 0.15));
};

export const analyzeCv = ({ rawText, candidate = {}, job = null }) => {
  const text = prepareText(rawText); const sections = parseSections(text); const projectLines = sections.projects?.length ? sections.projects : (Array.isArray(candidate.projects) ? candidate.projects : []); const projects = projectsFrom(projectLines); const skills = extractSkills(text, candidate, projects, job);
  const categories = []; const role = `${candidate.role || candidate.candidateRole || ""} ${text}`.toLowerCase();
  if (/developer|engineer|javascript|java|python|react|node/.test(role)) categories.push("Software Engineering");
  if (/data|machine learning|nlp|tensorflow|pytorch/.test(role)) categories.push("Data & AI");
  if (/designer|figma|ux|ui/.test(role)) categories.push("Product Design");
  return { analysisVersion: "cv-profile-v1", analysisMethod: "rule-based-evidence", name: nameFrom(text, candidate, sections), education: sectionEntries(sections.education || [], 6).map((entry) => ({ ...entry, title: entry.description })), experience: sectionEntries(sections.experience || [], 8), certifications: list(sections.certifications, 20), skills, softSkills: [...new Set([...list(sections.softSkills, 15), ...inferredSoftSkills(text)])], projects, topSkills: [...skills].sort((a, b) => Number(b.relevantToJob) - Number(a.relevantToJob) || b.evidenceCount - a.evidenceCount).slice(0, 6).map((skill) => skill.name), technicalCompetencyScore: competencyScore(skills, projects, sections, job), recommendedJobCategories: categories.length ? [...new Set(categories)] : ["General Professional Roles"], generatedAt: new Date().toISOString(), source: { hasText: Boolean(text), textLength: text.length } };
};

const modelLevel = (score) => score >= 70 ? "Advanced" : score >= 40 ? "Intermediate" : "Beginner";
const average = (items, field) => items.length ? items.reduce((sum, item) => sum + (Number(item[field]) || 0), 0) / items.length : 0;

const buildStrengthContexts = ({ text, sections, candidate, projects, skills }) => {
  const experience = [
    ...(sections.experience || []),
    ...(Array.isArray(candidate.experienceHighlights) ? candidate.experienceHighlights : []),
  ].join("\n") || text;
  const certifications = [
    ...(sections.certifications || []),
    ...(Array.isArray(candidate.certifications) ? candidate.certifications : []),
  ].join("; ");
  const contexts = [];
  for (const skill of skills) {
    const catalogItem = skillCatalog.find(([name]) => normalize(name) === skill.normalizedName);
    const relevantProjects = projects.filter((project) => project.technologies.includes(skill.name) || (catalogItem && findSkill(project.description, catalogItem)));
    const selectedProjects = relevantProjects.length ? relevantProjects.slice(0, 3) : [{ description: "No explicit project evidence was found for this skill.", projectIndex: null }];
    for (const project of selectedProjects) {
      contexts.push({
        skill: skill.name,
        project: project.description,
        experience,
        experienceYears: Number(candidate.yearsExperience) || skill.years || 0,
        certifications,
        projectIndex: project.projectIndex ?? projects.indexOf(project),
      });
    }
  }
  return contexts.slice(0, 256);
};

const mergeStrengthScores = (base, contexts, scores) => {
  const scoredContexts = contexts.map((context, index) => ({ ...context, score: scores[index] })).filter((item) => item.score);
  if (!scoredContexts.length) return base;
  const skillGroups = new Map();
  for (const item of scoredContexts) {
    const key = normalize(item.skill);
    if (!skillGroups.has(key)) skillGroups.set(key, []);
    skillGroups.get(key).push(item.score);
  }
  const skills = base.skills.map((skill) => {
    const modelScores = skillGroups.get(skill.normalizedName) || [];
    if (!modelScores.length) return skill;
    const skillEvidenceStrength = average(modelScores, "skillEvidenceStrength");
    return {
      ...skill,
      ruleBasedLevel: skill.level,
      level: modelLevel(skillEvidenceStrength),
      modelProjectStrength: Math.round(average(modelScores, "projectStrength") * 100) / 100,
      modelSkillEvidenceStrength: Math.round(skillEvidenceStrength * 100) / 100,
      modelExperienceProjectAlignment: Math.round(average(modelScores, "experienceProjectAlignment") * 100) / 100,
      modelEvidenceCount: modelScores.length,
      confidence: skillEvidenceStrength >= 70 ? "High" : skillEvidenceStrength >= 40 ? "Medium" : "Low",
    };
  });
  const projects = base.projects.map((project, projectIndex) => {
    const projectScores = scoredContexts.filter((item) => item.projectIndex === projectIndex).map((item) => item.score);
    if (!projectScores.length) return project;
    return {
      ...project,
      modelProjectStrength: Math.round(average(projectScores, "projectStrength") * 100) / 100,
      modelSkillEvidenceStrength: Math.round(average(projectScores, "skillEvidenceStrength") * 100) / 100,
      modelExperienceProjectAlignment: Math.round(average(projectScores, "experienceProjectAlignment") * 100) / 100,
      modelSkills: [...new Set(scoredContexts.filter((item) => item.projectIndex === projectIndex).map((item) => item.skill))],
    };
  });
  const modelTechnicalScore = Math.round(scoredContexts.reduce((sum, item) => sum + ((Number(item.score.skillEvidenceStrength) || 0) * 0.45) + ((Number(item.score.projectStrength) || 0) * 0.35) + ((Number(item.score.experienceProjectAlignment) || 0) * 0.2), 0) / scoredContexts.length);
  return {
    ...base,
    analysisVersion: "cv-profile-v2",
    analysisMethod: "deberta-resume-strength-with-rule-based-parsing",
    skills,
    projects,
    topSkills: [...skills].sort((a, b) => (b.modelSkillEvidenceStrength || 0) - (a.modelSkillEvidenceStrength || 0) || Number(b.relevantToJob) - Number(a.relevantToJob)).slice(0, 6).map((skill) => skill.name),
    technicalCompetencyScore: modelTechnicalScore,
    model: { service: "resume-strength-model-service", status: "live", modelId: "resume_strength_model", scoreType: "sigmoid-percent" },
    source: { ...base.source, modelContextCount: scoredContexts.length },
  };
};

export const analyzeCvWithModel = async (input) => {
  const base = analyzeCv(input);
  const text = prepareText(input.rawText);
  const sections = parseSections(text);
  const projectLines = sections.projects?.length ? sections.projects : (Array.isArray(input.candidate?.projects) ? input.candidate.projects : []);
  const projects = projectsFrom(projectLines);
  const contexts = buildStrengthContexts({ text, sections, candidate: input.candidate || {}, projects, skills: base.skills });
  if (!contexts.length) return { ...base, model: { service: "resume-strength-model-service", status: "not-run", reason: "No detected skills" } };
  try {
    return mergeStrengthScores(base, contexts, await predictStrengthBatch(contexts));
  } catch (error) {
    return { ...base, model: { service: "resume-strength-model-service", status: "unavailable", error: error.message }, source: { ...base.source, modelContextCount: 0 } };
  }
};
