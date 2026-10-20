import "./CandidateCvPanel.css";
import CandidateDetailsFields from "./CandidateDetailsFields";

function CandidateCvPanel({ candidate, selectedFile, preview, status, statusType, extracting, onFileSelected, onExtract, onCandidateChange }) {
  return (
    <section className="candidate-cv-panel cv-panel">
      <div className="candidate-cv-panel__heading cv-panel-heading">
        <span className="cv-step-number">02</span>
        <div><p className="cv-overline">Upload and review</p><h2>Candidate CV</h2></div>
      </div>
      <p className="candidate-cv-panel__intro cv-panel-intro">PDF, DOCX and TXT files are supported. Extraction runs through the CV service.</p>
      <label className={`candidate-cv-panel__dropzone ${selectedFile ? "candidate-cv-panel__dropzone--selected" : ""}`} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); onFileSelected(event.dataTransfer.files[0]); }}>
        <input type="file" accept=".pdf,.docx,.txt" onChange={(event) => onFileSelected(event.target.files[0])} />
        <span className="candidate-cv-panel__upload-icon" aria-hidden="true">↑</span>
        <strong>{selectedFile?.name || "Choose a CV file"}</strong>
        <small>or drag and drop it here</small>
      </label>
      <button className="cv-button cv-button--secondary" type="button" onClick={onExtract} disabled={!selectedFile || extracting}>{extracting ? "Extracting CV details..." : "Extract CV details"}</button>
      <div className={`candidate-cv-panel__status candidate-cv-panel__status--${statusType}`} role="status">{status}</div>
      <label>Extracted text preview<textarea value={preview} readOnly rows="5" placeholder="Your CV text preview will appear here." /></label>
      <CandidateDetailsFields candidate={candidate} onChange={onCandidateChange} hint="Review before scoring" />
    </section>
  );
}

export default CandidateCvPanel;
