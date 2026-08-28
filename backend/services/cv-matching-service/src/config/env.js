import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));
const defaultModelDir = path.resolve(directory, "../../model");
const modelDir = process.env.MATCHING_MODEL_DIR
  ? path.resolve(process.cwd(), process.env.MATCHING_MODEL_DIR)
  : defaultModelDir;

export const env = {
  serviceName: "cv-matching-service",
  port: Number.parseInt(process.env.PORT ?? "4002", 10),
  modelDir,
  modelId: process.env.MATCHING_MODEL_ID ?? "cv-match-browser-local",
  modelDtype: process.env.MATCHING_MODEL_DTYPE ?? "fp32",
  threshold: Number(process.env.MATCHING_THRESHOLD ?? "0.4399277865886688"),
  explanationServiceUrl: process.env.MATCH_EXPLANATION_MODEL_SERVICE_URL ?? "http://localhost:4012",
  explanationTimeoutMs: Number.parseInt(process.env.MATCH_EXPLANATION_TIMEOUT_MS ?? "30000", 10),
};
