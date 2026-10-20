import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(directory, "../../../../../.env") });
dotenv.config();

export const env = {
  serviceName: "cv-profile-analysis-service",
  port: Number.parseInt(process.env.PORT ?? "4007", 10),
  mongoUri: process.env.MONGODB_URI ?? "",
  mongoDbName: process.env.CV_ANALYSIS_DB_NAME ?? "lanka_talent_analysis",
  resumeStrengthModelUrl: process.env.RESUME_STRENGTH_MODEL_SERVICE_URL ?? "http://localhost:4009",
  resumeExplanationModelUrl: process.env.RESUME_EXPLANATION_MODEL_SERVICE_URL ?? "http://localhost:4012",
  requestTimeoutMs: Number.parseInt(process.env.REQUEST_TIMEOUT_MS ?? "120000", 10),
  explanationTimeoutMs: Number.parseInt(process.env.EXPLANATION_REQUEST_TIMEOUT_MS ?? "30000", 10),
};
