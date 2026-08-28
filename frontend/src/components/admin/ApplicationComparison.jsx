const displayList = (value) => (Array.isArray(value) ? value : String(value || "").split(/[|,;\n]+/)).map((item) => String(item).trim()).filter(Boolean);

function ApplicationComparison({ application }) {
  const candidate = application.candidate || {};
  const job = application.job || {};
  const score = application.matchScore;
  return (
    <details className="admin-application__comparison">
      <summary><span>View CV and job comparison</span><b>{score ? `${score.percentage}% model match` : "Analysis pending"}</b></summary>
      <div className="admin-comparison-grid">
        <div>
          <span className="admin-comparison__label">Candidate CV profile</span>
          <dl>
            <div><dt>Role</dt><dd>{candidate.candidateRole || candidate.role || "Not provided"}</dd></div>
            <div><dt>Seniority</dt><dd>{candidate.candidateSeniority || candidate.seniority || "Not provided"}</dd></div>
            <div><dt>Experience</dt><dd>{candidate.yearsExperience ? `${candidate.yearsExperience} years` : "Not provided"}</dd></div>
            <div><dt>Industry</dt><dd>{candidate.candidateIndustry || candidate.industry || "Not provided"}</dd></div>
            <div><dt>Education</dt><dd>{candidate.education || "Not provided"}</dd></div>
          </dl>
          <span className="admin-comparison__sub-label">Skills</span>
          <div className="admin-comparison__chips">{displayList(candidate.candidateSkills || candidate.skills).length ? displayList(candidate.candidateSkills || candidate.skills).map((skill) => <span key={skill}>{skill}</span>) : <small>Not provided</small>}</div>
          {candidate.summary && <p className="admin-comparison__summary">{candidate.summary}</p>}
        </div>
        <div>
          <span className="admin-comparison__label">Job requirements</span>
          <dl>
            <div><dt>Title</dt><dd>{job.title || application.jobTitle}</dd></div>
            <div><dt>Seniority</dt><dd>{job.seniority || "Not specified"}</dd></div>
            <div><dt>Industry</dt><dd>{job.industry || "Not specified"}</dd></div>
            <div><dt>Company</dt><dd>{job.company || "Not provided"}</dd></div>
          </dl>
          <span className="admin-comparison__sub-label">Must-have skills</span>
          <div className="admin-comparison__chips">{displayList(job.mustHaveSkills).length ? displayList(job.mustHaveSkills).map((skill) => <span key={skill}>{skill}</span>) : <small>Not specified</small>}</div>
          {job.requirements && <p className="admin-comparison__summary"><b>Requirements:</b> {job.requirements}</p>}
        </div>
      </div>
      <p className="admin-comparison__note">The percentage and classification above come from the server-side local matching model. The fields shown here are the candidate CV snapshot and the job data used for that comparison.</p>
    </details>
  );
}

export default ApplicationComparison;
