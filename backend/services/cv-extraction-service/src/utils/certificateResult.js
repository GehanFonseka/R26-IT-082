export function certificateContentResult(result, url, document) {
  const confirmed = result.status === "matched" || result.status === "mismatched";
  return { ...result, url, searchedText: result.cvName, found: confirmed ? result.status === "matched" : null,
    matchedText: confirmed ? result.certificateName : "", source: document?.source || result.method || "",
    confidence: document?.confidence ?? 0, scanComplete: document?.scanComplete ?? confirmed,
    visionUsed: document?.visionUsed === true,
    matchType: confirmed && result.status === "matched" ? result.cvName === result.certificateName ? "exact" : "normalized" : "none",
    verificationStatus: confirmed ? result.status === "matched" ? "content_found" : "content_not_found" : "unable_to_check",
    officiallyVerified: false };
}
