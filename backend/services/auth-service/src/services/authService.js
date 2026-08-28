import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { userRepository } from "../repositories/userRepository.js";
import { validateCredentials } from "../validation/authValidation.js";

export const registerRecruiter = async (body) => {
  const { email, password, displayName, role, adminCode } = validateCredentials(body);
  if (role === "admin" && (!env.adminInviteCode || adminCode !== env.adminInviteCode)) {
    throw Object.assign(new Error("A valid admin invite code is required"), { statusCode: 403 });
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await userRepository.create({ email, passwordHash, displayName, role });
  return { user, accessToken: createAccessToken(user) };
};

export const loginRecruiter = async (body) => {
  const { email, password } = validateCredentials(body, { requireDisplayName: false });
  const user = await userRepository.findByEmail(email);
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw Object.assign(new Error("Invalid credentials"), { statusCode: 401 });
  return { user: { ...user, passwordHash: undefined }, accessToken: createAccessToken(user) };
};

const createAccessToken = (user) => jwt.sign(
  { sub: user.id, email: user.email, role: user.role, displayName: user.displayName },
  env.jwtSecret,
  { expiresIn: env.accessTokenTtl },
);
