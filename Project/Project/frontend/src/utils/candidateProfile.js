export const toMatcherCandidate = (candidate = {}) => ({
  candidateRole: candidate.role || "",
  candidateSeniority: candidate.seniority || "",
  yearsExperience: candidate.yearsExperience ? String(candidate.yearsExperience) : "",
  candidateIndustry: candidate.industry || "",
  education: candidate.education || "",
  candidateSkills: Array.isArray(candidate.skills) ? candidate.skills.join(", ") : candidate.skills || "",
  candidateCertifications: Array.isArray(candidate.certifications) ? candidate.certifications.join("; ") : candidate.certifications || "",
  summary: candidate.summary || "",
  experienceBullets: Array.isArray(candidate.experienceHighlights)
    ? candidate.experienceHighlights.join("; ") : candidate.experienceHighlights || "",
  candidateProjects: Array.isArray(candidate.projects) ? candidate.projects.join("\n") : candidate.projects || "",
});

export const toStoredCandidate = (candidate = {}) => ({
  role: candidate.candidateRole || "",
  seniority: candidate.candidateSeniority || "",
  yearsExperience: Number(candidate.yearsExperience) || 0,
  industry: candidate.candidateIndustry || "",
  education: candidate.education || "",
  skills: String(candidate.candidateSkills || "").split(",").map((item) => item.trim()).filter(Boolean),
  certifications: String(candidate.candidateCertifications || "").split(";").map((item) => item.trim()).filter(Boolean),
  summary: candidate.summary || "",
  experienceHighlights: String(candidate.experienceBullets || "").split(";").map((item) => item.trim()).filter(Boolean),
  projects: String(candidate.candidateProjects || "").split(/\r?\n|;/).map((item) => item.trim()).filter(Boolean),
});
