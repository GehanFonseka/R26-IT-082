import { getAdminApplicationCvContext } from "./apiClient";
import { descriptionScore } from "../utils/applicantRanking";

const asText = (value) => Array.isArray(value) ? value.join(", ") : String(value || "");

export async function getApplicantAttritionInput(application, job) {
  const source = application.candidate || {};
  const probability = descriptionScore(application);
  const candidate = {
    ...source,
    displayName: application.applicant?.displayName || "Candidate",
    candidateRole: source.candidateRole || source.role || "",
    candidateSeniority: source.candidateSeniority || source.seniority || "",
    candidateIndustry: source.candidateIndustry || source.industry || "",
    candidateSkills: asText(source.candidateSkills || source.skills),
    experienceBullets: asText(source.experienceBullets || source.experienceHighlights),
    ...(probability >= 0 ? { matchProbability: probability } : {}),
  };
  const context = await getAdminApplicationCvContext(application.id).catch((error) => {
    if (error.status === 401 || error.status === 403) throw error;
    return null;
  });
  return { candidate, context: {
    cvText: context?.data?.rawText || "",
    job: {
      ...job,
      jobTitle: job.title || "",
      jobSeniority: job.seniority || "",
      jobIndustry: job.industry || "",
      jobDescription: job.description || "",
      mustHaveSkills: asText(job.mustHaveSkills),
      niceToHaveSkills: asText(job.niceToHaveSkills),
    },
  } };
}
