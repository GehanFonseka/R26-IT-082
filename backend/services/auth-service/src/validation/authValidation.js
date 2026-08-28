export const validateCredentials = (body = {}, { requireDisplayName = true } = {}) => {
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const displayName = String(body.displayName ?? body.name ?? "").trim();
  const role = body.role === "admin" ? "admin" : "user";
  if (!/^\S+@\S+\.\S+$/.test(email)) throw Object.assign(new Error("A valid email is required"), { statusCode: 400 });
  if (password.length < 8) throw Object.assign(new Error("Password must contain at least 8 characters"), { statusCode: 400 });
  if (requireDisplayName && displayName.length < 2) throw Object.assign(new Error("A display name is required"), { statusCode: 400 });
  return { email, password, displayName, role, adminCode: String(body.adminCode ?? "") };
};
