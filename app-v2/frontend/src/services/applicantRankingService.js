import { getAdminApplicationCvAnalysis, updateAdminApplicationScore } from "./apiClient";
import { scoreMatch } from "./matchingService";
import { descriptionScore, rankApplicants } from "../utils/applicantRanking";

export async function loadRankedApplicants(applications, job, isActive = () => true) {
  const results = new Array(applications.length);
  let cursor = 0;
  let incomplete = false;
  async function worker() {
    while (cursor < applications.length && isActive()) {
      const index = cursor++;
      const application = { ...applications[index] };
      if (descriptionScore(application) < 0) {
        try {
          application.matchScore = await scoreMatch(job, application.candidate || {});
          if (isActive()) await updateAdminApplicationScore(application.id, application.matchScore).catch(() => {});
        } catch { incomplete = true; }
      }
      if (application.candidateAnalysis?.model?.status !== "live" && isActive()) {
        try {
          const response = await getAdminApplicationCvAnalysis(application.id);
          application.candidateAnalysis = response.data;
        } catch { incomplete = true; }
      }
      if (application.candidateAnalysis?.model?.status !== "live") incomplete = true;
      results[index] = application;
    }
  }
  await Promise.all(Array.from({ length: Math.min(3, applications.length) }, worker));
  return { applications: rankApplicants(results.filter(Boolean), job), incomplete };
}
