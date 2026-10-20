import { identity, requireIdentity } from "./profileController.js";
import { getCertificateChecks, verifyAndSaveCertificate } from "../services/certificateChecks.js";

export const listOwnCertificateChecks = async (req, res) => {
  if (!requireIdentity(req, res)) return;
  const data = await getCertificateChecks(identity(req), req.query.cvRevision, req.requestId);
  res.json({ success: true, data, requestId: req.requestId });
};

export const verifyOwnCertificate = async (req, res) => {
  if (!requireIdentity(req, res)) return;
  const data = await verifyAndSaveCertificate(identity(req), { ...req.body, force: req.body?.force === true }, req.requestId);
  res.json({ success: true, data, requestId: req.requestId });
};
