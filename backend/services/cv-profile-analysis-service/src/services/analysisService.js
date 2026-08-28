import { canonicalSkill, countSkillOccurrences, findSkill, skillCatalog } from "../utils/skillCatalog.js";
import { enrichStrengthAnalysis } from "./strengthAnalysis.js";
import { explainAnalysis } from "./explanationClient.js";
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

export const analyzeCvWithModel = async (input, requestId = "") => {
  const base = analyzeCv(input);
  const text = prepareText(input.rawText);
  const sections = parseSections(text);
  const projectLines = sections.projects?.length ? sections.projects : (Array.isArray(input.candidate?.projects) ? input.candidate.projects : []);
  const projects = projectsFrom(projectLines);
  const analysis = await enrichStrengthAnalysis({ base, text, sections, candidate: input.candidate || {}, projects, skills: base.skills, requestId });
  const explanation = await explainAnalysis({ rawText: text, analysis, requestId });
  return { ...analysis, explainability: explanation ? { status: "live", model: "gemini", ...explanation } : { status: "unavailable", model: "gemini" } };
};
