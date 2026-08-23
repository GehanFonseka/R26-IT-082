import { env } from "../config/env.js";

const timeoutSignal = () => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.modelTimeoutMs);
  return { controller, timer };
};

export async function predictWithModel(candidate, simulation, requestId) {
  const { controller, timer } = timeoutSignal();
  try {
    const response = await fetch(`${env.modelServiceUrl.replace(/\/$/, "")}/predict`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json", "x-request-id": requestId },
      body: JSON.stringify({ candidate, simulation }),
      signal: controller.signal,
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = body?.detail?.message || body?.message || `Attrition model returned HTTP ${response.status}`;
      throw Object.assign(new Error(message), { statusCode: response.status >= 500 ? 503 : response.status });
    }
    return body;
  } catch (error) {
    if (error.name === "AbortError") throw Object.assign(new Error("Attrition model request timed out"), { statusCode: 503 });
    if (error.statusCode) throw error;
    throw Object.assign(new Error("Attrition model service is unavailable"), { statusCode: 503 });
  } finally {
    clearTimeout(timer);
  }
}
