import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const fail = (res, requestId, message, status = 401) => res.status(status).json({
  success: false,
  message,
  requestId,
});

export const authenticate = (req, res, next) => {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) return fail(res, req.requestId, "Authentication required");
  try {
    req.user = jwt.verify(header.slice(7), env.jwtSecret);
    next();
  } catch {
    fail(res, req.requestId, "Invalid or expired access token");
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.length || roles.includes(req.user?.role)) return next();
  return fail(res, req.requestId, "Insufficient role permissions", 403);
};
