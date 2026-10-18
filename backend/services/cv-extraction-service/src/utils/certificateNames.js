import { distance } from "fastest-levenshtein";

const tokens = (name, keepDigits = false) => String(name || "").normalize("NFKC").toLowerCase()
  .replace(/^(?:mr|mrs|ms|miss|dr|prof)\.?\s+/i, "")
  .replace(keepDigits ? /[^\p{L}\p{M}\p{N}\s]/gu : /[^\p{L}\p{M}\s]/gu, " ").split(/\s+/).filter(Boolean);

const evidenceText = (value) => String(value || "").normalize("NFKC").toLowerCase()
  .replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/\s+/g, " ").trim();

export const hasCertificateNameEvidence = (text, name) => Boolean(evidenceText(name))
  && evidenceText(text).includes(evidenceText(name));

export function certificateRecipient(text) {
  const lines = String(text || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/(?:this\s+is\s+to\s+certify\s+that|(?:certificate\s+)?(?:awarded|presented|issued)\s+to|congratulations\s+to|(?:course\s+)?completed\s+by|earned\s+by|credential\s+holder\s*:|(?:certificate\s+)?recipient(?:\s+name)?\b|name\s*:)\s*[:–-]?\s*(.*)$/i);
    if (!match) continue;
    const name = (match[1] || lines[index + 1] || "").split(/\s+(?:has|for|in\s+recognition|on\s+completion)\b/i)[0].trim();
    if (name.length >= 2 && name.length <= 180 && /^[\p{L}\p{M}\s.'’,–-]+$/u.test(name)
      && !/^(?:has|the|this|certificate|completion|successfully)\b/i.test(name)) return name;
  }
  return "";
}

export function compareCertificateNames(cvName, certificateName, threshold = 0.9) {
  const cv = tokens(cvName);
  const certificate = tokens(certificateName);
  if (!cv.length || !certificate.length) return { status: "unreadable", reason: "A name could not be read from the CV or certificate." };
  const abbreviated = [...cv, ...certificate].some((token) => token.length === 1);
  const numeric = /\p{N}/u.test(`${cvName} ${certificateName}`);
  if (!abbreviated && !numeric && [...cv].sort().join(" ") === [...certificate].sort().join(" ")) {
    return { status: "matched", reason: "The printed recipient name matches the name in the CV." };
  }
  const sharedFullName = cv.some((token) => token.length > 1 && certificate.includes(token));
  const incomplete = cv.every((token) => certificate.includes(token)) || certificate.every((token) => cv.includes(token));
  const onlyInitials = cv.every((token) => token.length === 1) || certificate.every((token) => token.length === 1);
  if (onlyInitials || (sharedFullName && (abbreviated || incomplete))) {
    return { status: "needs_review", reason: "The names share part of the name, but initials or missing names prevent a confirmed match." };
  }
  const first = tokens(cvName, true).sort().join(" ");
  const second = tokens(certificateName, true).sort().join(" ");
  if (1 - distance(first, second) / Math.max(first.length, second.length) >= threshold) {
    return { status: "needs_review", reason: "The names are close, but a spelling or OCR difference requires review." };
  }
  return { status: "mismatched", reason: "The printed recipient name differs from the name in the CV." };
}
