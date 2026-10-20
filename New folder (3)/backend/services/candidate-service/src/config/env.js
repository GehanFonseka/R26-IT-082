import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const configDirectory = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(configDirectory, "../../../../../.env") });
dotenv.config();

export const env = {
  serviceName: "candidate-service",
  port: Number.parseInt(process.env.PORT ?? "3002", 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
  mongoUri: process.env.MONGODB_URI ?? "",
  mongoDbName: process.env.MONGODB_DB_NAME ?? "lanka_talent",
  extractionUrl: process.env.CV_EXTRACTION_SERVICE_URL ?? "http://localhost:4001",
  certificateTimeoutMs: Number.parseInt(process.env.CERTIFICATE_REQUEST_TIMEOUT_MS ?? "250000", 10),
};
