export const validateCredentials = (body = {}, { requireDisplayName = true } = {}) => {
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const displayName = String(body.displayName ?? body.name ?? "").trim();
  const accountType = body.accountType ?? body.role ?? "user";
  if (requireDisplayName && !["user", "company"].includes(accountType)) throw Object.assign(new Error("Choose a user or company account"), { statusCode: 400 });
  const role = accountType === "company" ? "admin" : "user";
  const companyName = String(body.companyName ?? "").trim().slice(0, 160);
  if (requireDisplayName && accountType === "company" && companyName.length < 2) throw Object.assign(new Error("A company name is required"), { statusCode: 400 });
  if (!/^\S+@\S+\.\S+$/.test(email)) throw Object.assign(new Error("A valid email is required"), { statusCode: 400 });
  if (password.length < 8) throw Object.assign(new Error("Password must contain at least 8 characters"), { statusCode: 400 });
  if (requireDisplayName && displayName.length < 2) throw Object.assign(new Error("A display name is required"), { statusCode: 400 });
  return { email, password, displayName, role, accountType, companyName };
};
