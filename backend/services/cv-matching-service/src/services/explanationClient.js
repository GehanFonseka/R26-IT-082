import { env } from "../config/env.js";

export const explainMatch = async ({ rawText, candidate, job, matchResult, requestId = "" }) => {
  const response = await fetch(`${env.explanationServiceUrl.replace(/\/$/, "")}/explain-match`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(requestId ? { "x-request-id": requestId } : {}) },
    body: JSON.stringify({ rawText, candidate, job, matchResult }),
    signal: AbortSignal.timeout(env.explanationTimeoutMs),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(body.message || "Match explanation service is unavailable"), { statusCode: response.status });
  return body.explanation;
};
