import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { userRepository } from "../repositories/userRepository.js";
import { validateCredentials } from "../validation/authValidation.js";
import { requireActiveSession } from "./sessionService.js";

export const requireCompanyMember = async (req) => {
  const user = await requireActiveSession(req.header("authorization"));
  if (user.role !== "admin" || !user.companyId || !["company", "admin"].includes(user.accountType)) {
    throw Object.assign(new Error("A company admin account is required to view company admins"), { statusCode: 403 });
  }
  return user;
};

export const requireCompanyOwner = async (req) => {
  let claims;
  try {
    const token = req.header("authorization")?.replace(/^Bearer /, "");
    claims = jwt.verify(token, env.jwtSecret);
  } catch {
    throw Object.assign(new Error("Authentication required"), { statusCode: 401 });
  }
  const owner = await userRepository.findById(claims.sub);
  if (owner?.accountType !== "company" || !owner.companyId) {
    throw Object.assign(new Error("Only company owners can manage admin accounts"), { statusCode: 403 });
  }
  return owner;
};

export const createCompanyAdmin = async (owner, body) => {
  const { email, password, displayName } = validateCredentials({ ...body, accountType: "user" });
  return userRepository.create({
    email, displayName, passwordHash: await bcrypt.hash(password, 12),
    role: "admin", accountType: "admin", companyId: owner.companyId, companyName: owner.companyName,
  });
};

export const deleteCompanyAdmin = async (owner, id) => {
  if (!await userRepository.deleteAdmin(owner.companyId, id)) {
    throw Object.assign(new Error("Admin account not found in your company"), { statusCode: 404 });
  }
  return { id };
};
