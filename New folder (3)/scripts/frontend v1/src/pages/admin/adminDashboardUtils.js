export const emptyJob = {
  title: "",
  company: "",
  location: "",
  employmentType: "Full-time",
  seniority: "",
  industry: "",
  description: "",
  responsibilities: "",
  requirements: "",
  mustHaveSkills: "",
  niceToHaveSkills: "",
};

export const splitSkills = (value) => String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
export const dateLabel = (value) => value ? new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—";
export const initials = (value) => String(value || "Applicant").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
export const applicationJobKey = (application) => application.job?.id || application.jobId || `${application.jobTitle || "Unassigned job"}|${application.job?.company || ""}`;
export const applicationJobTitle = (application) => application.job?.title || application.jobTitle || "Unassigned job";
export const applicationMatchScore = (application) => {
  const percentage = Number(application.matchScore?.percentage);
  const probability = Number(application.matchScore?.probability);
  if (Number.isFinite(percentage)) return percentage;
  if (Number.isFinite(probability)) return probability * 100;
  return -1;
};
export const applicationJobSubtitle = (application) => [application.job?.company, application.job?.location].filter(Boolean).join(" · ") || "Job details unavailable";

