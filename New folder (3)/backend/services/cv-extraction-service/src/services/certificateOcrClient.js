import { env } from "../config/env.js";
import { setTimeout as delay } from "node:timers/promises";
import { log } from "../utils/logger.js";

export async function readCertificateWithModel(document, requestId) {
  let response;
  let body;
  let waiting = false;
  const signal = AbortSignal.timeout(env.certificateOcrTimeoutMs);
  const payload = JSON.stringify(document);
  try {
    do {
      response = await fetch(`${env.certificateOcrModelUrl.replace(/\/$/, "")}/read-certificate`, {
        method: "POST", headers: { "content-type": "application/json", "x-request-id": requestId },
        body: payload, signal,
      });
      body = await response.json().catch(() => ({}));
      if (response.status === 429) {
        if (!waiting) log("info", "certificate.reader_waiting", { requestId });
        waiting = true;
        await delay(1500, undefined, { signal });
      }
    } while (response.status === 429);
  } catch (error) {
    const timedOut = ["TimeoutError", "AbortError"].includes(error.name);
    throw new Error(timedOut
      ? "The local certificate reader took too long. Please try again."
      : "The local certificate reader is unavailable. Start the certificate model service and try again.", { cause: error });
  }
  if (!response.ok || !body.data) throw new Error(body.message || "Local certificate reading is unavailable. Start the local OCR service and try again.");
  return body.data;
}
