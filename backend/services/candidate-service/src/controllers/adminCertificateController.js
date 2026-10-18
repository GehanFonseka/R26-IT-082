import { requireIdentity } from "./profileController.js";
import { profileRepository } from "../repositories/profileRepository.js";
import { getCertificateChecks, verifyAndSaveCertificate } from "../services/certificateChecks.js";
import { cvCertificateLinks, cvRevision } from "../utils/cvRevision.js";

const requireAdmin = (req, res) => {
  if (!requireIdentity(req, res)) return false;
  if (req.header("x-user-role") === "admin") return true;
  res.status(403).json({ success: false, message: "Admin role required", requestId: req.requestId });
  return false;
};

export const getApplicantCertificates = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const profile = await profileRepository.get(req.params.userId);
  const cv = profile?.cv;
  const revision = cvRevision(cv);
  if (req.query.cvRevision && req.query.cvRevision !== revision) {
    return res.status(409).json({ success: false, message: "The candidate uploaded a different CV. Reload certificates to view it.", requestId: req.requestId });
  }
  const results = cv?.rawText && cvCertificateLinks(cv).length
    ? (await getCertificateChecks(req.params.userId, revision, req.requestId)).results : {};
  res.json({ success: true, data: {
    cv: cv ? { fileName: cv.fileName, candidate: cv.candidate, rawText: cv.rawText || "", revision, certificateChecks: results } : null,
    cvUpdatedAt: profile?.cvUpdatedAt || null, cvRevision: revision, results,
  }, requestId: req.requestId });
};

export const recheckApplicantCertificate = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const data = await verifyAndSaveCertificate(req.params.userId, { ...req.body, force: req.body?.force === true }, req.requestId);
  res.json({ success: true, data, requestId: req.requestId });
};
