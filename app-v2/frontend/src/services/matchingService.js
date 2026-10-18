import { explainMatch as requestExplanation, scoreMatch as requestScore } from "./apiClient";

export const MODEL_ID = import.meta.env.VITE_MATCHING_MODEL_ID || "cv-match-browser-local";
export const DECISION_THRESHOLD = Number(import.meta.env.VITE_MATCHING_THRESHOLD || "0.4399277865886688");

export async function scoreMatch(job, candidate, onProgress = () => {}) {
  onProgress("Sending the job and candidate profile to the matching service...");
  const response = await requestScore(job, candidate);
  onProgress("Local model score received from the backend.");
  return response;
}

export async function explainMatch(rawText, candidate, job, matchResult) {
  const response = await requestExplanation(rawText, candidate, job, matchResult);
  return response.explanation || null;
}
