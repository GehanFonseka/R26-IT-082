import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const configDirectory = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(configDirectory, "../../../../.env") });
dotenv.config();

const integer = (value, fallback) => Number.parseInt(value ?? fallback, 10);

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: integer(process.env.PORT, 8080),
  jwtSecret: process.env.JWT_SECRET ?? "development-only-secret",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  requestTimeoutMs: integer(process.env.REQUEST_TIMEOUT_MS, 120000),
  rateLimit: {
    windowMs: integer(process.env.RATE_LIMIT_WINDOW_MS, 60000),
    limit: integer(process.env.RATE_LIMIT_MAX, process.env.NODE_ENV === "production" ? 120 : 300),
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many requests; please try again shortly" },
  },
  roomRateLimit: {
    windowMs: integer(process.env.ROOM_RATE_LIMIT_WINDOW_MS, 60000),
    limit: integer(process.env.ROOM_RATE_LIMIT_MAX, process.env.NODE_ENV === "production" ? 900 : 1200),
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Interview room is receiving requests too quickly" },
  },
  uploadLimitBytes: 15 * 1024 * 1024,
  services: {
    extraction: process.env.CV_EXTRACTION_SERVICE_URL ?? "http://localhost:4001",
    matching: process.env.CV_MATCHING_SERVICE_URL ?? "http://localhost:4002",
    attrition: process.env.ATTRITION_SERVICE_URL ?? "http://localhost:4003",
    auth: process.env.AUTH_SERVICE_URL ?? "http://localhost:3001",
    candidates: process.env.CANDIDATE_SERVICE_URL ?? "http://localhost:3002",
    jobs: process.env.JOB_SERVICE_URL ?? "http://localhost:4004",
    speechToText: process.env.SPEECH_TO_TEXT_SERVICE_URL ?? "http://localhost:4005",
    interviewAnalysis: process.env.INTERVIEW_ANALYSIS_SERVICE_URL ?? "http://localhost:4006",
    cvProfileAnalysis: process.env.CV_PROFILE_ANALYSIS_SERVICE_URL ?? "http://localhost:4007",
  },
};
