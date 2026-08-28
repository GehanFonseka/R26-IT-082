import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const configDirectory = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(configDirectory, "../../../../../.env") });
dotenv.config();
export const env = {
  serviceName: "auth-service",
  port: Number.parseInt(process.env.PORT ?? "3001", 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
  jwtSecret: process.env.JWT_SECRET ?? "development-only-secret",
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL ?? "15m",
  mongoUri: process.env.MONGODB_URI ?? "",
  mongoDbName: process.env.MONGODB_DB_NAME ?? "lanka_talent",
  adminInviteCode: process.env.ADMIN_INVITE_CODE ?? "",
};
