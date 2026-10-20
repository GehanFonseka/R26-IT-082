const nameKey = (value) => String(value || "").normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
const statuses = new Set(["matched", "mismatched", "needs_review", "unreadable", "unavailable"]);

export function certificateCheckResult(data, url, revision) {
  const namesMatch = Boolean(nameKey(data.cvName)) && nameKey(data.cvName) === nameKey(data.certificateName);
  const status = namesMatch ? "matched" : statuses.has(data.status) ? data.status : "unavailable";
  return {
    url, cvRevision: revision, status,
    validationStatus: status === "matched" ? "valid" : status === "mismatched" ? "invalid" : status,
    validationType: "recipient_name", officiallyVerified: false,
    cvName: String(data.cvName || "").slice(0, 180), certificateName: String(data.certificateName || "").slice(0, 2000),
    reason: namesMatch ? "The CV name and certificate name match." : String(data.reason || "The certificate could not be checked.").slice(0, 1000),
    checkedAt: new Date().toISOString(), confidence: Math.max(0, Math.min(1, Number(data.confidence) || 0)),
    scanComplete: data.scanComplete === true, visionUsed: data.visionUsed === true,
    source: String(data.source || "").slice(0, 80), inspectionStatus: data.status || "unavailable",
    inspectionReason: String(data.reason || "").slice(0, 1000),
  };
}
