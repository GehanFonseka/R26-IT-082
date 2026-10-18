import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { userRepository } from "../repositories/userRepository.js";
import { validateCredentials } from "../validation/authValidation.js";

export const registerRecruiter = async (body) => {
  const { email, password, displayName, role, accountType, companyName } = validateCredentials(body);
  const companyId = accountType === "company" ? randomUUID() : null;
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await userRepository.create({ email, passwordHash, displayName, role, accountType, companyId, companyName });
  return { user, accessToken: createAccessToken(user) };
};

export const loginRecruiter = async (body) => {
  const { email, password } = validateCredentials(body, { requireDisplayName: false });
  const user = await userRepository.findByEmail(email);
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw Object.assign(new Error("Invalid credentials"), { statusCode: 401 });
  if (user.role === "admin" && !user.companyId) throw Object.assign(new Error("This legacy admin account must be assigned to a company before signing in"), { statusCode: 403 });
  return { user: { ...user, passwordHash: undefined }, accessToken: createAccessToken(user) };
};

const createAccessToken = (user) => jwt.sign(
  { sub: user.id, email: user.email, role: user.role, displayName: user.displayName, accountType: user.accountType, companyId: user.companyId, companyName: user.companyName },
  env.jwtSecret,
  { expiresIn: env.accessTokenTtl },
);
