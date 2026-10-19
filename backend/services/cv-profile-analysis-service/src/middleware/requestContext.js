import { randomUUID } from "node:crypto";

export const requestContext = (req, res, next) => {
  req.requestId = req.header("x-request-id") || randomUUID();
  res.setHeader("x-request-id", req.requestId);
  next();
};
