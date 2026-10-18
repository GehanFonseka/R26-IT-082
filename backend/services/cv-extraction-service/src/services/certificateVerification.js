import { extractCandidateFields } from "../utils/candidateParser.js";
import { compareCertificateNames } from "../utils/certificateNames.js";
import { readCertificateLink } from "./certificateLinkReader.js";
import { log } from "../utils/logger.js";
import { env } from "../config/env.js";
import { certificateContentResult } from "../utils/certificateResult.js";

export async function verifyCertificate({ url, rawText, requestId }, options = {}) {
  const candidate = extractCandidateFields(rawText);
  const linkedUrls = candidate.certificateDetails.flatMap((entry) => entry.urls || [entry.url]);
  if (!linkedUrls.includes(url)) throw Object.assign(new Error("This link was not found in the CV certificate section."), { statusCode: 400 });
  const result = { cvName: candidate.name || "", certificateName: "", checkedAt: new Date().toISOString() };
  if (!result.cvName) return certificateContentResult({ ...result, status: "unreadable", reason: "The CV owner's name could not be read. Upload a CV with a clear name." }, url);
  if (!env.certificateVerificationEnabled) return certificateContentResult({ ...result, status: "unavailable", reason: "Certificate name checks are disabled." }, url);
  const started = Date.now();
  let document;
  try {
    document = await readCertificateLink(url, requestId, options);
    result.certificateName = document.recipientName;
    result.method = document.method;
    Object.assign(result, compareCertificateNames(result.cvName, result.certificateName, env.certificateMatchThreshold));
    if (!result.certificateName) {
      result.reason = "The CV name was read, but no printed recipient name could be read from the linked certificate. Check that the link opens the certificate itself.";
    }
    if (document.recipientNames?.length > 1) {
      result.certificateName = document.recipientNames.join(" / ");
      result.status = "needs_review";
      result.reason = "Different recipient names were read from the certificate page. Please review the certificates.";
    }
    if (document.scanComplete === false) {
      result.status = "needs_review";
      result.reason = document.warning || "Some page content could not be scanned. Please review the remaining certificate content.";
    }
    if (result.certificateName && document.confidence < env.certificateMinOcrConfidence) {
      result.status = "needs_review";
      result.reason = "The printed name was not clear enough to confirm a match. Please review the certificate.";
    }
  } catch (error) {
    if (error.statusCode === 400) throw error;
    result.status = "unavailable";
    result.reason = error.message || "The certificate could not be read. Check its sharing permissions and try again.";
  }
  log("info", "certificate.name_check.completed", { requestId, status: result.status, method: result.method, duration: Date.now() - started });
  return certificateContentResult(result, url, document);
}
