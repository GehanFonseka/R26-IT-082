import { applicationJobKey, applicationJobTitle, applicationJobSubtitle, applicationMatchScore } from "./adminDashboardUtils";

export function adminDashboardMetrics({ jobs, applications, interviews, jobQuery, applicationQuery, applicationStage, applicationJobFilter, applicationSort }) {
  const openJobs = jobs.filter((job) => job.status === "open").length;
  const newApplications = applications.filter((application) => application.status === "new").length;
  const scheduledInterviews = interviews.filter((interview) => !["cancelled", "completed"].includes(String(interview.status || "").toLowerCase())).length;
  const pipelineStages = [
    { key: "new", label: "New", tone: "indigo" },
    { key: "reviewing", label: "Reviewing", tone: "blue" },
    { key: "shortlisted", label: "Shortlisted", tone: "teal" },
    { key: "hired", label: "Hired", tone: "green" },
  ].map((stage) => ({ ...stage, count: applications.filter((application) => application.status === stage.key).length }));
  const maxPipelineCount = Math.max(1, ...pipelineStages.map((stage) => stage.count));
  const scoredApplications = applications.map(applicationMatchScore).filter((value) => value >= 0);
  const averageMatchScore = scoredApplications.length ? Math.round(scoredApplications.reduce((sum, value) => sum + value, 0) / scoredApplications.length) : null;
  const jobApplicationCounts = applications.reduce((counts, application) => {
    const key = applicationJobKey(application);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
  const recentApplications = [...applications].sort((first, second) => new Date(second.createdAt || 0) - new Date(first.createdAt || 0)).slice(0, 5);
  const overviewJobs = [...jobs].sort((first, second) => new Date(second.createdAt || 0) - new Date(first.createdAt || 0)).slice(0, 4);
  const applicationStageCounts = {
    new: applications.filter((application) => application.status === "new").length,
    reviewing: applications.filter((application) => application.status === "reviewing").length,
    shortlisted: applications.filter((application) => application.status === "shortlisted").length,
    hired: applications.filter((application) => application.status === "hired").length,
    rejected: applications.filter((application) => application.status === "rejected").length,
  };
  const suitableMatches = applications.filter((application) => String(application.matchScore?.classification || "").toLowerCase().includes("suitable")).length;
  const pendingMatches = applications.filter((application) => applicationMatchScore(application) < 0).length;
  const applicationJobOptions = Object.values(applications.reduce((groups, application) => {
    const key = applicationJobKey(application);
    if (!groups[key]) {
      groups[key] = {
        key,
        title: applicationJobTitle(application),
        subtitle: applicationJobSubtitle(application),
        count: 0,
      };
    }
    groups[key].count += 1;
    return groups;
  }, {})).sort((first, second) => first.title.localeCompare(second.title));
  const normalizedQuery = applicationQuery.trim().toLowerCase();
  const normalizedJobQuery = jobQuery.trim().toLowerCase();
  const filteredJobs = jobs.filter((job) => {
    if (!normalizedJobQuery) return true;
    const searchable = [
      job.title,
      job.company,
      job.location,
      job.industry,
      job.seniority,
      job.employmentType,
      ...(Array.isArray(job.mustHaveSkills) ? job.mustHaveSkills : []),
      ...(Array.isArray(job.niceToHaveSkills) ? job.niceToHaveSkills : []),
    ].filter(Boolean).join(" ").toLowerCase();
    return searchable.includes(normalizedJobQuery);
  });
  const filteredApplications = applications.filter((application) => {
    const applicant = application.applicant || {};
    const candidate = application.candidate || {};
    const searchable = [applicant.displayName, applicant.email, application.jobTitle, candidate.candidateRole, candidate.candidateIndustry].join(" ").toLowerCase();
    return (applicationStage === "all" || application.status === applicationStage)
      && (applicationJobFilter === "all" || applicationJobKey(application) === applicationJobFilter)
      && (!normalizedQuery || searchable.includes(normalizedQuery));
  });
  const sortedApplications = [...filteredApplications].sort((first, second) => {
    const jobOrder = applicationJobTitle(first).localeCompare(applicationJobTitle(second))
      || applicationJobKey(first).localeCompare(applicationJobKey(second));
    if (jobOrder !== 0) return jobOrder;
    if (applicationSort === "oldest") return new Date(first.createdAt || 0) - new Date(second.createdAt || 0);
    if (applicationSort === "recent") return new Date(second.createdAt || 0) - new Date(first.createdAt || 0);
    const scoreOrder = applicationMatchScore(second) - applicationMatchScore(first);
    return scoreOrder || new Date(second.createdAt || 0) - new Date(first.createdAt || 0);
  });
  const applicationGroupCounts = sortedApplications.reduce((counts, application) => ({ ...counts, [applicationJobKey(application)]: (counts[applicationJobKey(application)] || 0) + 1 }), {});
  return { openJobs, newApplications, scheduledInterviews, pipelineStages, maxPipelineCount, averageMatchScore, jobApplicationCounts, recentApplications, overviewJobs, applicationStageCounts, suitableMatches, pendingMatches, applicationJobOptions, filteredJobs, filteredApplications, sortedApplications, applicationGroupCounts };
}
