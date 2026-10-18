import { certificateEntries, certificateLinks } from "../../utils/candidateCertificates";
import useCertificateChecks from "../../pages/profile/useCertificateChecks";
import CertificateNameCheck from "./CertificateNameCheck";
import "./ProfileCertificates.css";

export default function ProfileCertificates({ candidate, hasCv, cvText = "", active = false, cvRevision = "", savedChecks = {}, ownerId = "", applicationId = "" }) {
  const certificates = certificateEntries(candidate.candidateCertifications, candidate.candidateCertificateDetails);
  const { checks, retry } = useCertificateChecks(certificates.flatMap(certificateLinks), cvText, active, cvRevision, savedChecks, ownerId, applicationId);
  return <section className="profile-card profile-card--certificates" id="certificates" aria-label="Certificates">
    <div className="profile-card__heading">
      <div><p className="cv-overline">{applicationId ? "Candidate CV" : "Personal CV"}</p><h2>Certificates</h2></div>
      <span className="profile-certificates__count">{certificates.length} found</span>
    </div>
    <p className="profile-card__intro">Certificate names and links from {applicationId ? "the candidate’s latest saved" : "your"} CV. Each linked document is read to compare its recipient name with the CV name.</p>
    {certificates.length ? <ul className="profile-certificates__list">
      {certificates.map((certificate, index) => <li key={`${certificate.name}-${index}`}>
        <span className="profile-certificates__icon" aria-hidden="true">✓</span>
        <div><h3>{certificate.name}</h3>
          {certificate.url ? certificateLinks(certificate).map((url, linkIndex) => <div key={url} className="profile-certificates__link">
            <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`${certificate.name} certificate link ${linkIndex + 1}`}>{url} <span aria-hidden="true">↗</span></a>
            <CertificateNameCheck result={checks[url]} onRetry={() => retry(url)} allowRecheck={Boolean(applicationId)} />
          </div>)
            : <p>No certificate link included in the CV.</p>}
        </div>
      </li>)}
    </ul> : <div className="profile-certificates__empty">
      <strong>{hasCv ? "No certificates found" : applicationId ? "No candidate CV uploaded" : "Upload your CV to see certificates"}</strong>
      <p>{applicationId ? "There are no certificates to check. If the candidate uploads an updated CV, reload this tab to see its certificates." : hasCv ? "Include a Certificates or Certifications section with each name and its link, then upload your CV again." : "Your certificate names and links will appear here after your CV is read."}</p>
      {!applicationId && <a href="#cv-profile">{hasCv ? "Update CV" : "Upload CV"} <span aria-hidden="true">→</span></a>}
    </div>}
  </section>;
}
