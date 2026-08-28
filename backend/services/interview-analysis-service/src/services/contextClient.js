import { env } from "../config/env.js";

const request = async (url, req) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.timeoutMs);
  try {
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        "x-request-id": req.requestId,
        "x-user-id": req.header("x-user-id") || "",
        "x-user-role": req.header("x-user-role") || "",
      },
      signal: controller.signal,
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(body.message || "Interview context unavailable"), { statusCode: response.status });
    return body.data;
  } catch (error) {
    if (error.statusCode) throw error;
    if (error.name === "AbortError") throw Object.assign(new Error("Job service timed out"), { statusCode: 504 });
    throw Object.assign(new Error("Job service is unavailable"), { statusCode: 503, technicalError: error.message });
  } finally { clearTimeout(timer); }
};

export const getInterviewContext = (interviewId, req) => request(
  `${env.jobServiceUrl}/interviews/${encodeURIComponent(interviewId)}/analysis-context`, req,
);
