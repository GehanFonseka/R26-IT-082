import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { requestContext } from "./middleware/requestContext.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { registerProxyRoutes } from "./routes/proxyRoutes.js";

const app = express();
const apiRateLimiter = rateLimit(env.rateLimit);
const roomRateLimiter = rateLimit(env.roomRateLimit);
const isRoomRelayRequest = (req) => /^\/api\/interviews\/[^/]+\/room\/(video-frame|media-request)$/.test(req.path);

app.use(helmet());
app.use(cors({ origin: env.corsOrigin }));
app.use((req, res, next) => (isRoomRelayRequest(req) ? roomRateLimiter : apiRateLimiter)(req, res, next));
app.use(express.json({ limit: "1mb" }));
app.use(requestContext);
app.use(requestLogger);

const health = (req, res) => res.json({
  success: true,
  service: "api-gateway",
  status: "ok",
  timestamp: new Date().toISOString(),
  requestId: req.requestId,
});
app.get(["/health", "/api/health"], health);
registerProxyRoutes(app);
app.use(notFound);
app.use(errorHandler);

export default app;
