import { RotateCw } from "lucide-react";
import "./CertificateNameCheck.css";

const labels = {
  checking: "Checking name…", matched: "Verified", mismatched: "Name differs",
  needs_review: "Needs review", unreadable: "Name could not be read", unavailable: "Check unavailable",
};

const nameKey = (value) => String(value || "").normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();

export default function CertificateNameCheck({ result, onRetry, allowRecheck = false }) {
  const cvName = nameKey(result?.cvName);
  const namesMatch = Boolean(cvName) && cvName === nameKey(result?.certificateName);
  const status = namesMatch ? "matched" : result?.status || "checking";
  const reason = namesMatch ? "The CV name and certificate name match." : result?.reason;
  return <div className={`certificate-name-check certificate-name-check--${status}`} aria-live="polite">
    <span className="certificate-name-check__status">{labels[status] || "Check unavailable"}</span>
    {(result?.cvName || result?.certificateName) && <dl>
      <div><dt>CV name</dt><dd>{result.cvName || "Could not read"}</dd></div>
      <div><dt>Certificate name</dt><dd>{result.certificateName || "Could not read"}</dd></div>
    </dl>}
    {reason && <p>{reason}</p>}
    {(allowRecheck ? status !== "checking" : ["unavailable", "unreadable", "needs_review"].includes(status)) && <button type="button" onClick={onRetry} title="Check certificate name again"><RotateCw size={14} aria-hidden="true" /> Check again</button>}
  </div>;
}
