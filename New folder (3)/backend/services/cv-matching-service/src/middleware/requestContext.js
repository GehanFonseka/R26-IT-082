import { randomUUID } from "node:crypto";
import { log } from "../utils/logger.js";

export const requestContext = (req, res, next) => {
  req.requestId = req.header("x-request-id") || randomUUID();
  res.setHeader("x-request-id", req.requestId);
  const started = Date.now();
  res.on("finish", () => log("info", "request.completed", {
    requestId: req.requestId, method: req.method, route: req.originalUrl,
    status: res.statusCode, duration: Date.now() - started,
  }));
  next();
};
