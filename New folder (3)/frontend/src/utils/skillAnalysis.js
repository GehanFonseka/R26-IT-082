export const hasModelScore = (analysis) => analysis?.model?.status === "live"
  && typeof analysis.technicalCompetencyScore === "number" && Number.isFinite(analysis.technicalCompetencyScore)
  && Array.isArray(analysis.skills) && analysis.skills.some((skill) => typeof skill.modelSkillEvidenceStrength === "number"
    && Number.isFinite(skill.modelSkillEvidenceStrength));

export const needsSkillAnalysis = (analysis, signature) => !hasModelScore(analysis)
  || analysis.source?.inputSignature !== signature
  || analysis.skills.some((skill) => skill.modelAlignmentLevel == null || skill.modelVersion == null)
  || analysis.explainability?.status !== "live";

export async function skillAnalysisSignature(cv, cryptoApi = globalThis.crypto) {
  if (!cryptoApi?.subtle) return null;
  const input = { rawText: cv.rawText.trim().slice(0, 100000), candidate: cv.candidate || {}, job: null };
  const hash = await cryptoApi.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(input)));
  return [...new Uint8Array(hash)].map((value) => value.toString(16).padStart(2, "0")).join("");
}
