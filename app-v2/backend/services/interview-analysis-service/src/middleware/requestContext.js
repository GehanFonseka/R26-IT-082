import { randomUUID } from "node:crypto";

export const requestContext = (req, res, next) => {
  const requestId = req.header("x-request-id") || randomUUID();
  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  next();
};
