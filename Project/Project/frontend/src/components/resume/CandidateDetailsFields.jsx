import { useId, useState } from "react";
import "./CandidateDetailsFields.css";

function CandidateDetailsFields({ candidate, onChange, hint = "Review before saving" }) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();
  const update = (field, value) => onChange({ ...candidate, [field]: value });
  return <section className="candidate-details">
    <div className="candidate-details__disclosure">
      <div className="candidate-details__disclosure-copy">
        <strong>Candidate details</strong>
        <small>{isOpen ? hint : "Fields are hidden until you review them"}</small>
      </div>
      <button
        className="candidate-details__toggle"
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? "Hide details" : "View details"}
        <span aria-hidden="true">{isOpen ? "−" : "+"}</span>
      </button>
    </div>
    <div id={panelId} className="candidate-details__panel" hidden={!isOpen}>
      <label>Candidate role<input value={candidate.candidateRole} onChange={(event) => update("candidateRole", event.target.value)} /></label>
      <div className="candidate-details__two-col">
        <label>Seniority<input value={candidate.candidateSeniority} onChange={(event) => update("candidateSeniority", event.target.value)} /></label>
        <label>Years of experience<input value={candidate.yearsExperience} onChange={(event) => update("yearsExperience", event.target.value)} /></label>
      </div>
      <label>Industry experience<input value={candidate.candidateIndustry} onChange={(event) => update("candidateIndustry", event.target.value)} /></label>
      <label>Education<input value={candidate.education} onChange={(event) => update("education", event.target.value)} /></label>
      <label>Skills<input value={candidate.candidateSkills} onChange={(event) => update("candidateSkills", event.target.value)} placeholder="Separate skills with commas" /></label>
      <label>Certifications<input value={candidate.candidateCertifications} onChange={(event) => update("candidateCertifications", event.target.value)} placeholder="Separate certifications with semicolons" /></label>
      <label>Professional summary<textarea value={candidate.summary} onChange={(event) => update("summary", event.target.value)} rows="3" /></label>
      <label>Experience highlights<textarea value={candidate.experienceBullets} onChange={(event) => update("experienceBullets", event.target.value)} rows="4" /></label>
      <label>Projects<textarea value={candidate.candidateProjects || ""} onChange={(event) => update("candidateProjects", event.target.value)} rows="5" placeholder="One project per line" /></label>
    </div>
  </section>;
}

export default CandidateDetailsFields;
