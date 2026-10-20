const clean = (value, fallback = "Not specified") => {
  const text = Array.isArray(value) ? value.join(", ") : String(value ?? "").replace(/\s+/g, " ").trim();
  return text || fallback;
};
const cleanList = (value) => clean(value).split(/[|,;\n]+/).map((item) => item.trim()).filter(Boolean).join(", ") || "Not specified";
const limit = (value, maxLength) => {
  const text = clean(value);
  if (text.length <= maxLength) return text;
  const boundary = text.lastIndexOf(" ", maxLength);
  const end = boundary > Math.floor(maxLength * 0.75) ? boundary : maxLength;
  return `${text.slice(0, end).trim()}...`;
};
const limitList = (value, maxLength) => limit(cleanList(value), maxLength);
const pick = (object, ...names) => names.map((name) => object?.[name]).find((value) => value !== undefined);

export function buildJobText(job = {}) {
  return clean(`Job Title: ${limit(pick(job, "jobTitle", "title"), 50)}. Required Seniority: ${limit(pick(job, "jobSeniority", "seniority"), 20)}. Industry: ${limit(pick(job, "jobIndustry", "industry"), 35)}. Must-Have Skills: ${limitList(pick(job, "mustHaveSkills", "mustHaveSkillsList"), 110)}. Nice-to-Have Skills: ${limitList(pick(job, "niceToHaveSkills", "niceToHaveSkillsList"), 70)}. Job Description: ${limit(pick(job, "jobDescription", "description"), 100)}. Responsibilities: ${limitList(job.responsibilities, 60)}. Requirements: ${limitList(job.requirements, 60)}.`);
}

export function buildCandidateText(candidate = {}) {
  return clean(`Candidate Role: ${limit(pick(candidate, "candidateRole", "role"), 50)}. Seniority Level: ${limit(pick(candidate, "candidateSeniority", "seniority"), 20)}. Years of Experience: ${limit(pick(candidate, "yearsExperience", "yearsExperience"), 10)}. Industry Experience: ${limit(pick(candidate, "candidateIndustry", "industry"), 35)}. Education: ${limit(candidate.education, 30)}. Skills: ${limitList(pick(candidate, "candidateSkills", "skills"), 145)}. Professional Summary: ${limit(candidate.summary, 50)}. Experience Highlights: ${limitList(pick(candidate, "experienceBullets", "experienceHighlights"), 50)}.`);
}
