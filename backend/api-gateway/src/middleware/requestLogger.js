import { log } from "../utils/logger.js";

export const requestLogger = (req, res, next) => {
  const started = Date.now();
  res.on("finish", () => log("info", "request.completed", {
    requestId: req.requestId,
    method: req.method,
    route: req.originalUrl,
    status: res.statusCode,
    duration: Date.now() - started,
  }));
  next();
};
