import { env } from "../config/env.js";

const request = async (payload, req) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.timeoutMs);
  try {
    const response = await fetch(`${env.interviewAnswerModelUrl}/predict`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "x-request-id": req.requestId,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const body = await response.json().catch(() => ({}));
    const detail = body.detail && typeof body.detail === "object" ? body.detail : {};
    if (!response.ok) {
      throw Object.assign(new Error(detail.message || body.message || "Interview answer model is unavailable"), {
        statusCode: response.status,
        technicalError: detail.error || body.error,
      });
    }
    if (!body.data) throw Object.assign(new Error("Interview answer model returned an empty result"), { statusCode: 502 });
    return body.data;
  } catch (error) {
    if (error.statusCode) throw error;
    if (error.name === "AbortError") throw Object.assign(new Error("Interview answer model timed out"), { statusCode: 504, technicalError: error.message });
    throw Object.assign(new Error("Interview answer model service is unavailable"), { statusCode: 503, technicalError: error.message });
  } finally {
    clearTimeout(timer);
  }
};

export const scoreInterviewAnswer = (question, referenceAnswer, candidateAnswer, req) => request({
  question,
  referenceAnswer,
  candidateAnswer,
}, req);
