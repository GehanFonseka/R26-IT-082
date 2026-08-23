import { env } from "../config/env.js";
import { predict } from "../model/model.js";
import { MODEL_INPUT_VERSION } from "../model/modelInput.js";
import { buildCandidateText, buildJobText } from "../services/textFormatter.js";

const hasText = (value) => typeof value === "string" ? value.trim() : Array.isArray(value) && value.length > 0;
const candidateHasEvidence = (candidate) => [
  "candidateRole", "role", "candidateSeniority", "seniority", "yearsExperience",
  "candidateIndustry", "industry", "education", "candidateSkills", "skills",
  "summary", "experienceBullets", "experienceHighlights",
].some((field) => hasText(candidate[field]));

export const score = async (req, res) => {
  const { job, candidate } = req.body ?? {};
  if (!job || !candidate || typeof job !== "object" || typeof candidate !== "object") {
    throw Object.assign(new Error("job and candidate objects are required"), { statusCode: 400 });
  }
  const jobText = buildJobText(job);
  const candidateText = buildCandidateText(candidate);
  if (!hasText(job.jobTitle ?? job.title) || !candidateHasEvidence(candidate)) {
    throw Object.assign(new Error("Job title and candidate evidence are required"), { statusCode: 400 });
  }
  const probability = await predict(jobText, candidateText);
  const classification = probability >= env.threshold ? "Suitable Match" : "Needs Review";
  return res.json({
    success: true,
    probability,
    percentage: Number((probability * 100).toFixed(2)),
    threshold: env.threshold,
    classification,
    verdict: classification,
    model: env.modelId,
    inputVersion: MODEL_INPUT_VERSION,
    requestId: req.requestId,
  });
};
