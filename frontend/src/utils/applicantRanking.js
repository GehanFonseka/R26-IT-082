const number = (value) => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value)) ? Number(value) : null;
const normalize = (value) => String(value || "").trim().toLowerCase();
const skills = (value) => (Array.isArray(value) ? value : String(value || "").split(",")).map(normalize).filter(Boolean);

export function descriptionScore(application) {
  const probability = number(application.matchScore?.probability);
  if (probability !== null && probability >= 0 && probability <= 1) return probability;
  const percentage = number(application.matchScore?.percentage);
  return percentage !== null && percentage >= 0 && percentage <= 100 ? percentage / 100 : -1;
}

export function skillScore(application, job) {
  const analysis = application.candidateAnalysis;
  if (analysis?.model?.status !== "live") return -1;
  const required = skills(job.mustHaveSkills);
  const preferred = skills(job.niceToHaveSkills);
  const targets = required.length ? required : preferred;
  if (!targets.length) return number(analysis.technicalCompetencyScore) ?? -1;
  const evidence = new Map((analysis.skills || []).map((skill) => [normalize(skill.normalizedName || skill.name), number(skill.modelSkillEvidenceStrength)]));
  if (!targets.some((name) => evidence.get(name) !== null && evidence.get(name) !== undefined)) return -1;
  return targets.reduce((sum, name) => sum + (evidence.get(name) ?? 0), 0) / targets.length;
}

export function rankApplicants(applications, job) {
  return [...applications].sort((a, b) => descriptionScore(b) - descriptionScore(a)
    || skillScore(b, job) - skillScore(a, job)
    || String(a.id).localeCompare(String(b.id)));
}
