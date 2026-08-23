import { scoreMatch as requestScore } from "./apiClient";

export const MODEL_ID = "Gehan77/cv-match-browser";
export const DECISION_THRESHOLD = Number(import.meta.env.VITE_MATCHING_THRESHOLD || "0.4399277865886688");

export async function scoreMatch(job, candidate, onProgress = () => {}) {
  onProgress("Sending the job and candidate profile to the matching service...");
  const response = await requestScore(job, candidate);
  onProgress("Hugging Face model score received from the backend.");
  return response;
}
