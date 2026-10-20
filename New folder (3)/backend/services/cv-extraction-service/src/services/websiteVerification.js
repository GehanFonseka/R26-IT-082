import { env } from "../config/env.js";
import { readCertificateLink } from "./certificateLinkReader.js";
import { matchContent } from "../utils/contentMatching.js";
import { log } from "../utils/logger.js";

export async function verifyWebsiteContent({ url, targetText, expectedFields = {}, requestId }) {
  const result = { url, searchedText: targetText, found: null, matchedText: "", matchType: "none",
    officiallyVerified: false, verificationStatus: "unable_to_check", status: "unable_to_check", fields: {} };
  if (!env.certificateVerificationEnabled) return { ...result, reason: "Website content checks are disabled." };
  const started = Date.now();
  try {
    const document = await readCertificateLink(url, requestId, { modelPurpose: "content" });
    if (document.scanComplete === false) return { ...result, reason: document.warning || "The page could not be inspected completely." };
    if (document.confidence < env.certificateMinOcrConfidence) return { ...result, reason: "The printed content was not clear enough to confirm the requested text." };
    const text = document.documentText || "";
    if (!text.trim()) return { ...result, reason: "No readable source evidence was available." };
    Object.assign(result, matchContent(text, targetText), { source: document.source || document.method, confidence: document.confidence });
    for (const [field, value] of Object.entries(expectedFields)) {
      const evidence = field === "recipientName" ? (document.recipientNames || [document.recipientName]).filter(Boolean).join("\n") : text;
      result.fields[field] = field === "recipientName" && !evidence ? { found: null, matchType: "none", matchedText: "", similarity: 0 }
        : matchContent(evidence, value, field === "certificateId");
    }
    if (result.found !== null) {
      result.status = "completed";
      result.verificationStatus = result.found ? "content_found" : "content_not_found";
    } else result.reason = "An approximate OCR match was found. Review the printed content before accepting it.";
  } catch (error) {
    if (error.statusCode === 400) throw error;
    result.reason = error.message || "The website could not be inspected.";
  } finally {
    log("info", "website.content_check.completed", { requestId, status: result.status, duration: Date.now() - started });
  }
  return result;
}
