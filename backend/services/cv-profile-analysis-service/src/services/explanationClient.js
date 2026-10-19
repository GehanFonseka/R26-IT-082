import { env } from "../config/env.js";

export const explainAnalysis = async ({ rawText, analysis, requestId = "" }) => {
  if (!rawText || !analysis?.skills?.length) return null;
  try {
    const response = await fetch(`${env.resumeExplanationModelUrl.replace(/\/$/, "")}/explain`, {
      method: "POST",
      headers: { "content-type": "application/json", ...(requestId ? { "x-request-id": requestId } : {}) },
      body: JSON.stringify({ rawText, analysis }),
      signal: AbortSignal.timeout(env.explanationTimeoutMs),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return null;
    return body.explanation || null;
  } catch {
    return null;
  }
};
