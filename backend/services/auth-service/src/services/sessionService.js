import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { userRepository } from "../repositories/userRepository.js";

export const requireActiveSession = async (authorization) => {
  let claims;
  try {
    if (!authorization?.startsWith("Bearer ")) throw new Error("Missing token");
    claims = jwt.verify(authorization.slice(7), env.jwtSecret);
  } catch {
    throw Object.assign(new Error("Invalid or expired access token"), { statusCode: 401 });
  }
  const user = await userRepository.findById(claims.sub);
  const legacyAdmin = claims.role === "admin" && !claims.companyId;
  if (!user || user.role !== claims.role || (!legacyAdmin && (
    (claims.accountType && user.accountType !== claims.accountType) || (user.companyId ?? null) !== (claims.companyId ?? null)
  ))) {
    throw Object.assign(new Error("This account no longer has access. Please sign in again."), { statusCode: 401 });
  }
  return user;
};
