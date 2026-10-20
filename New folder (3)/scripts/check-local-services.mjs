import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(root, ".env") });
const definitions = [
  ["gateway", "API_GATEWAY_URL", 8080, "/api/health"],
  ["auth", "AUTH_SERVICE_URL", 3001],
  ["candidate", "CANDIDATE_SERVICE_URL", 3002],
  ["extraction", "CV_EXTRACTION_SERVICE_URL", 4001],
  ["matching", "CV_MATCHING_SERVICE_URL", 4002],
  ["attrition", "ATTRITION_SERVICE_URL", 4003],
  ["jobs", "JOB_SERVICE_URL", 4004],
  ["speech", "SPEECH_TO_TEXT_SERVICE_URL", 4005],
  ["interview analysis", "INTERVIEW_ANALYSIS_SERVICE_URL", 4006],
  ["CV analysis", "CV_PROFILE_ANALYSIS_SERVICE_URL", 4007],
  ["CatBoost model", "ATTRITION_MODEL_SERVICE_URL", 4008],
  ["resume strength model", "RESUME_STRENGTH_MODEL_SERVICE_URL", 4009],
  ["interview answer model", "INTERVIEW_ANSWER_MODEL_SERVICE_URL", 4010],
  ["early attrition model", "EARLY_ATTRITION_MODEL_SERVICE_URL", 4011],
  ["explanation", "RESUME_EXPLANATION_MODEL_SERVICE_URL", 4012],
  ["certificate reader", "CERTIFICATE_LOCAL_MODEL_SERVICE_URL", 4013],
];
const requestId = randomUUID();
const results = await Promise.all(definitions.map(async ([service, variable, port, route = "/health"]) => {
  const base = process.env[variable] || `http://127.0.0.1:${port}`;
  try {
    const response = await fetch(`${base.replace(/\/$/, "")}${route}`, {
      headers: { "x-request-id": requestId }, signal: AbortSignal.timeout(5000),
    });
    const body = await response.json();
    const ready = response.ok && body.success === true && body.status !== "degraded"
      && body.modelLoaded !== false && body.configured !== false;
    const detail = body.modelLoaded === true ? "model loaded"
      : body.configured === false ? "API key missing"
      : body.workerReady === false ? "OCR loads on first request"
      : body.configured === true ? "API key configured; provider call not checked" : `HTTP ${response.status}`;
    return { service, status: ready ? "OK" : "NOT READY", detail };
  } catch (error) {
    return { service, status: "UNAVAILABLE", detail: error.cause?.code || error.name };
  }
}));
console.table(results);
console.log("Health checks do not verify predictions. Large models may need time to finish loading.");
process.exitCode = results.some(({ status }) => status !== "OK") ? 1 : 0;
