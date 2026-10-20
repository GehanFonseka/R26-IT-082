import { FileText, RotateCw } from "lucide-react";
import ProfileCertificates from "../profile/ProfileCertificates";
import useApplicantCertificates from "../../hooks/useApplicantCertificates";
import { toMatcherCandidate } from "../../utils/candidateProfile";
import "./ApplicantCertificates.css";

export default function ApplicantCertificates({ application }) {
  const { data, loading, error, reload } = useApplicantCertificates(application.id);
  const cv = data?.cv;
  return <section className="applicant-certificates" aria-label="Candidate certificates" aria-busy={loading}>
    <div className="applicant-certificates__toolbar">
      <div><h2>Candidate certificates</h2><p>View the same certificate details and name checks shown to the candidate.</p></div>
      <button type="button" onClick={reload} disabled={loading}><RotateCw size={16} aria-hidden="true" />{loading ? "Loading…" : "Reload certificates"}</button>
    </div>
    {loading && <p className="applicant-certificates__notice" role="status">Loading certificates from the candidate’s latest saved CV…</p>}
    {error && <p className="applicant-certificates__error" role="alert">{error}</p>}
    {!loading && !error && <>
      {cv?.fileName && <p className="applicant-certificates__file"><FileText size={16} aria-hidden="true" /><span>{cv.fileName}</span></p>}
      <ProfileCertificates key={cv?.revision || "no-cv"} candidate={toMatcherCandidate(cv?.candidate)} hasCv={Boolean(cv)}
        cvText={cv?.rawText || ""} active={Boolean(cv)} cvRevision={cv?.revision || ""}
        savedChecks={cv?.certificateChecks || {}} ownerId={application.applicant?.userId || application.userId || ""} applicationId={application.id} />
    </>}
  </section>;
}
