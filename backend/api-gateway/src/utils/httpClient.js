export class GatewayError extends Error {
  constructor(message, statusCode = 502, technicalError = "") {
    super(message);
    this.statusCode = statusCode;
    this.technicalError = technicalError;
  }
}

const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const canRetry = (method) => ["GET", "HEAD"].includes(method);
const retryableStatus = (status) => [502, 503, 504].includes(status);

const fetchOnce = async (url, options, timeoutMs) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, { ...options, signal: controller.signal }); }
  finally { clearTimeout(timer); }
};

const request = async (url, options, requestId, timeoutMs) => {
  try {
    const method = options.method || "GET";
    const attempts = canRetry(method) ? 8 : 1;
    let response;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try { response = await fetchOnce(url, { ...options, headers: { ...(options.headers || {}), "x-request-id": requestId } }, timeoutMs); }
      catch (error) { if (error.name === "AbortError" || !canRetry(method) || attempt === attempts - 1) throw error; }
      if (response && (!retryableStatus(response.status) || attempt === attempts - 1)) break;
      await pause(Math.min(3000, 400 * (attempt + 1)));
    }
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new GatewayError(body.message || "Downstream request failed", response.status, body.error || body.message);
    }
    return body;
  } catch (error) {
    if (error instanceof GatewayError) throw error;
    if (error.name === "AbortError") throw new GatewayError("Downstream service timed out", 504);
    throw new GatewayError("Downstream service unavailable", 503, error.message);
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
