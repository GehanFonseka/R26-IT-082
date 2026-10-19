export const stages = ["new", "reviewing", "shortlisted", "hired"];
export const stageLabels = { new: "New", reviewing: "Reviewing", shortlisted: "Shortlisted", hired: "Hired" };
export const statusLabels = { ...stageLabels, rejected: "Rejected" };
export const dateLabel = (value) => value ? new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—";
export const initials = (value) => String(value || "Applicant").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
export const jobTitle = (application) => application.job?.title || application.jobTitle || "Unassigned job";
export const jobKey = (application) => application.job?.id || application.jobId || `${application.jobTitle || "Unassigned job"}|${application.job?.company || ""}`;
export const jobSubtitle = (application) => [application.job?.company, application.job?.location].filter(Boolean).join(" · ") || "Job details unavailable";
export const matchScore = (application) => { const percentage = Number(application.matchScore?.percentage); const probability = Number(application.matchScore?.probability); return Number.isFinite(percentage) ? percentage : Number.isFinite(probability) ? probability * 100 : -1; };
