import { AsyncLocalStorage } from "node:async_hooks";

export const companyContext = new AsyncLocalStorage();

export const establishCompanyContext = (req, res, next) => {
  const isAdmin = req.header("x-user-role") === "admin";
  const companyId = req.header("x-company-id");
  if (isAdmin && !companyId) {
    return res.status(403).json({ success: false, message: "A company account is required", requestId: req.requestId });
  }
  companyContext.run(isAdmin ? { companyId, companyName: req.header("x-company-name") } : null, next);
};
