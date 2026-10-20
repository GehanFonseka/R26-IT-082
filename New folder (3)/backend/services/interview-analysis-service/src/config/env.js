import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));
const defaultNliModelDir = path.resolve(directory, "../../model");
dotenv.config({ path: path.resolve(directory, "../../../../../.env") });
dotenv.config();

const integer = (value, fallback) => Number.parseInt(value ?? fallback, 10);

export const env = {
  serviceName: "interview-analysis-service",
  port: integer(process.env.PORT, 4006),
  nodeEnv: process.env.NODE_ENV ?? "development",
  jobServiceUrl: process.env.JOB_SERVICE_URL ?? "http://localhost:4004",
  interviewAnswerModelUrl: process.env.INTERVIEW_ANSWER_MODEL_SERVICE_URL ?? "http://localhost:4010",
  mongoUri: process.env.MONGODB_URI ?? "",
  mongoDbName: process.env.INTERVIEW_ANALYSIS_DB_NAME ?? "lanka_talent_analysis",
  nliModelDir: process.env.INTERVIEW_NLI_MODEL_DIR
    ? path.resolve(process.cwd(), process.env.INTERVIEW_NLI_MODEL_DIR)
    : defaultNliModelDir,
  nliModelId: process.env.INTERVIEW_NLI_MODEL_ID ?? "nli-deberta-v3-xsmall-local",
  nliModelDtype: process.env.INTERVIEW_NLI_MODEL_DTYPE ?? "q8",
  timeoutMs: integer(process.env.INTERVIEW_ANALYSIS_TIMEOUT_MS, 120000),
};
