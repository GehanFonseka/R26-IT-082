import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { forwardJson } from "../utils/httpClient.js";

const fail = (res, requestId, message, status = 401) => res.status(status).json({
  success: false,
  message,
  requestId,
});

export const authenticate = async (req, res, next) => {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) return fail(res, req.requestId, "Authentication required");
  try {
    req.user = jwt.verify(header.slice(7), env.jwtSecret);
  } catch {
    return fail(res, req.requestId, "Invalid or expired access token");
  }
  if (req.user.accountType === "admin" || (req.user.role === "admin" && !req.user.companyId)) {
    try {
      const session = await forwardJson(`${env.services.auth}/session`, null, req.requestId, {
        method: "GET", headers: { authorization: header }, timeoutMs: env.requestTimeoutMs,
      });
      if (session.data?.id !== req.user.sub || session.data.role !== req.user.role || !session.data.companyId) {
        return fail(res, req.requestId, "This admin account must be assigned to a company", 403);
      }
      req.user = { ...req.user, ...session.data, sub: session.data.id };
    } catch (error) { return next(error); }
  }
  next();
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.length || roles.includes(req.user?.role)) return next();
  return fail(res, req.requestId, "Insufficient role permissions", 403);
};
