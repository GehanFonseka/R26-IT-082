import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const configDirectory = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(configDirectory, "../../../../../.env") });
dotenv.config();
const nodeEnv = process.env.NODE_ENV ?? "development";
const isProduction = nodeEnv === "production";
const jwtSecret = process.env.JWT_SECRET;

if (isProduction && (!jwtSecret || jwtSecret === "development-only-secret")) {
  throw new Error("FATAL: In production mode, JWT_SECRET must be explicitly set and cannot use the development fallback.");
}

const adminInviteCode = process.env.ADMIN_INVITE_CODE ?? "";
if (isProduction && (!adminInviteCode || adminInviteCode === "change-me-admin-code")) {
  console.warn("WARNING: ADMIN_INVITE_CODE is not securely set in production. Please set a secure ADMIN_INVITE_CODE.");
}

export const env = {
  serviceName: "auth-service",
  port: Number.parseInt(process.env.PORT ?? "3001", 10),
  nodeEnv,
  jwtSecret: jwtSecret ?? "development-only-secret",
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL ?? "15m",
  mongoUri: process.env.MONGODB_URI ?? "",
  mongoDbName: process.env.MONGODB_DB_NAME ?? "lanka_talent",
  adminInviteCode,
};

