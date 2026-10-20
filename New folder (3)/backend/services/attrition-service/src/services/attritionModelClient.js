import { env } from "../config/env.js";

const timeoutSignal = () => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.modelTimeoutMs);
  return { controller, timer };
};

async function postPrediction(url, payload, requestId, unavailableMessage) {
  const { controller, timer } = timeoutSignal();
  try {
    const response = await fetch(`${url.replace(/\/$/, "")}/predict`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json", "x-request-id": requestId },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = body?.detail?.message || body?.message || `${unavailableMessage} returned HTTP ${response.status}`;
      throw Object.assign(new Error(message), { statusCode: response.status >= 500 ? 503 : response.status });
    }
    return body;
  } catch (error) {
    if (error.name === "AbortError") throw Object.assign(new Error(`${unavailableMessage} request timed out`), { statusCode: 503 });
    if (error.statusCode) throw error;
    throw Object.assign(new Error(unavailableMessage), { statusCode: 503 });
  } finally {
    clearTimeout(timer);
  }
}

export const predictWithModel = (candidate, simulation, requestId) => postPrediction(
  env.modelServiceUrl, { candidate, simulation }, requestId, "Attrition model service is unavailable",
);

export const predictEarlyAttrition = (features, simulation, requestId) => postPrediction(
  env.earlyModelServiceUrl, { features, simulation }, requestId, "EarlyAttrition model service is unavailable",
);
