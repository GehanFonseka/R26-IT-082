export class GatewayError extends Error {
  constructor(message, statusCode = 502, technicalError = "") {
    super(message);
    this.statusCode = statusCode;
    this.technicalError = technicalError;
  }
}

const request = async (url, options, requestId, timeoutMs) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: { ...(options.headers || {}), "x-request-id": requestId },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new GatewayError(body.message || "Downstream request failed", response.status, body.error || body.message);
    }
    return body;
  } catch (error) {
    if (error instanceof GatewayError) throw error;
    if (error.name === "AbortError") throw new GatewayError("Downstream service timed out", 504);
    throw new GatewayError("Downstream service unavailable", 503, error.message);
  } finally {
    clearTimeout(timer);
  }
};

export const forwardJson = (url, body, requestId, options = {}) => request(url, {
  method: options.method || "POST",
  headers: { "content-type": "application/json", ...(options.headers || {}) },
  ...(options.method === "GET" ? {} : { body: JSON.stringify(body ?? {}) }),
}, requestId, options.timeoutMs);

export const forwardMultipart = (url, file, requestId, options = {}) => {
  const form = new FormData();
  form.append("file", new Blob([file.buffer], { type: file.mimetype }), file.originalname);
  return request(url, { method: "POST", body: form }, requestId, options.timeoutMs);
};
