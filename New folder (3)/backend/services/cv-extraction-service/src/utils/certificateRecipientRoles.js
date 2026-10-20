import { certificateRecipient } from "./certificateNames.js";

const normalized = (value) => String(value || "").normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();

export function isNonCertificateRecipient(name, visibleText) {
  const key = normalized(name);
  if (!key) return false;
  const lines = String(visibleText || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.some((_, index) => normalized(certificateRecipient(lines.slice(index, index + 2).join("\n"))) === key)) return false;
  return lines.some((line, index) => {
    const role = line.match(/^(?:organization|issuer|issued\s+by|instructors?|(?:course\s+)?authors?|signed\s+by|signature|taught\s+by)\b\s*[:–-]?\s*(.*)$/i)
      || line.match(/^by\s*:\s*(.*)$/i);
    return role && normalized(role[1] || lines[index + 1]) === key;
  });
}
