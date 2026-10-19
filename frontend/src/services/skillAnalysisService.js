import { analyzeCvProfile, getMyProfile, getMyCvAnalysis } from "./apiClient.js";
import { needsSkillAnalysis, skillAnalysisSignature } from "../utils/skillAnalysis.js";

export async function loadSkillAnalysis(onLoading = () => {}, api = { getMyProfile, getMyCvAnalysis, analyzeCvProfile }) {
  const response = await api.getMyProfile();
  const profile = response.data || null;
  const cv = profile?.cv;
  if (!cv?.rawText?.trim()) return { profile, warning: "" };
  const signature = await skillAnalysisSignature(cv);
  let analysis = cv.profileAnalysis;
  if (needsSkillAnalysis(analysis, signature)) {
    try {
      const saved = (await api.getMyCvAnalysis()).data;
      if (!needsSkillAnalysis(saved, signature)) analysis = saved;
    } catch { /* A missing saved analysis can be generated from this CV. */ }
  }
  let warning = "";
  if (needsSkillAnalysis(analysis, signature)) {
    onLoading("Analyzing your CV skills, projects and experience.");
    try { analysis = (await api.analyzeCvProfile(cv.rawText, cv.candidate || {})).data; }
    catch { warning = "We could not refresh your CV analysis. Please try again."; }
  }
  return { profile: { ...profile, cv: { ...cv, profileAnalysis: analysis || null } }, warning };
}
