import { env } from "../config/env.js";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { forwardJson } from "../utils/httpClient.js";

export const registerCompanyRoutes = (app) => {
  app.get("/api/auth/session", asyncHandler(async (req, res) => {
    res.json(await forwardJson(`${env.services.auth}/session`, null, req.requestId, {
      method: "GET", headers: { authorization: req.header("authorization") ?? "" }, timeoutMs: env.requestTimeoutMs,
    }));
  }));
  for (const method of ["get", "post"]) {
    app[method]("/api/company/admins", authenticate, asyncHandler(async (req, res) => {
      const data = await forwardJson(`${env.services.auth}/company/admins`, method === "get" ? null : req.body, req.requestId, {
        method: method.toUpperCase(), headers: { authorization: req.header("authorization") }, timeoutMs: env.requestTimeoutMs,
      });
      res.status(method === "post" ? 201 : 200).json(data);
    }));
  }
  app.delete("/api/company/admins/:adminId", authenticate, asyncHandler(async (req, res) => {
    const data = await forwardJson(`${env.services.auth}/company/admins/${encodeURIComponent(req.params.adminId)}`, null, req.requestId, {
      method: "DELETE", headers: { authorization: req.header("authorization") }, timeoutMs: env.requestTimeoutMs,
    });
    res.json(data);
  }));
};
