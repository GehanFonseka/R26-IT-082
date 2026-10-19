function normalizeList(value) {
  return String(value || "")
    .split(/[|,;\n]+/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function getSkillGaps(jobSkills, candidateSkills) {
  const candidateText = normalizeList(candidateSkills).join(" ");
  return normalizeList(jobSkills).filter((skill) => !candidateText.includes(skill));
}

export function generateMatchAnalysis(job, candidate, result) {
  const gaps = getSkillGaps(job.mustHaveSkills, candidate.candidateSkills);
  const candidateText = Object.values(candidate).join(" ").trim();
  const strengths = [];
  const actions = [];

  if (candidate.candidateRole && job.jobTitle && candidate.candidateRole.toLowerCase().includes(job.jobTitle.toLowerCase().split(" ")[0])) {
    strengths.push({ title: "Role alignment", detail: "The candidate role is aligned with the target job title." });
  }
  if (job.mustHaveSkills && gaps.length === 0) {
    strengths.push({ title: "Must-have coverage", detail: "The candidate profile includes the listed must-have skills." });
  }
  if (candidate.yearsExperience) {
    strengths.push({ title: "Experience signal", detail: `${candidate.yearsExperience} years of experience is available for review.` });
  }
  if (candidate.candidateSkills) {
    strengths.push({ title: "Skills extracted", detail: "Skills were captured from the uploaded CV and are ready for comparison." });
  }

  if (!result) {
    actions.push({ priority: "high", title: "Run the match score", detail: "Score the completed job and candidate profile to establish the current match risk.", action: "Score this match" });
  }
  if (!candidateText) {
    actions.push({ priority: "high", title: "Upload and extract the CV", detail: "The model needs candidate evidence before it can estimate fit.", action: "Extract candidate details" });
  } else if (gaps.length > 0) {
    actions.push({ priority: "high", title: "Close the must-have skill gap", detail: `Review evidence for: ${gaps.slice(0, 4).join(", ")}.`, action: "Review required skills" });
  }
  if (!job.jobDescription.trim() || !job.responsibilities.trim() || !job.requirements.trim()) {
    actions.push({ priority: "medium", title: "Add more job context", detail: "A detailed job description, responsibilities, and requirements give the model a stronger comparison signal.", action: "Complete job details" });
  }
  if (!candidate.experienceBullets.trim() || !candidate.summary.trim()) {
    actions.push({ priority: "medium", title: "Add evidence from experience", detail: "Include a short summary and measurable experience highlights to reduce ambiguity.", action: "Complete candidate profile" });
  }
  if (candidate.candidateIndustry && job.jobIndustry && candidate.candidateIndustry.toLowerCase() !== job.jobIndustry.toLowerCase()) {
    actions.push({ priority: "medium", title: "Review industry transferability", detail: "The candidate industry differs from the target industry; validate transferable experience manually.", action: "Review industry fit" });
  }
  if (actions.length === 0) {
    actions.push({ priority: "low", title: "Ready for human review", detail: "The current profile has enough information for a focused shortlist conversation.", action: "Review original CV" });
  }

  return { actions: actions.slice(0, 4), strengths: strengths.slice(0, 4), gaps };
}
