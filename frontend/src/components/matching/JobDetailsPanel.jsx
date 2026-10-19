import "./JobDetailsPanel.css";

function JobDetailsPanel({ job, onChange }) {
  const update = (field, value) => onChange({ ...job, [field]: value });

  return (
    <form className="job-details-panel cv-panel" onSubmit={(event) => event.preventDefault()}>
      <div className="job-details-panel__heading cv-panel-heading">
        <span className="cv-step-number">01</span>
        <div><p className="cv-overline">Start here</p><h2>Job details</h2></div>
      </div>
      <p className="job-details-panel__intro cv-panel-intro">Describe the role you are hiring for. More context usually gives a more useful ranking signal.</p>
      <label>Job title<input value={job.jobTitle} onChange={(event) => update("jobTitle", event.target.value)} /></label>
      <div className="job-details-panel__two-col">
        <label>Required seniority<input value={job.jobSeniority} onChange={(event) => update("jobSeniority", event.target.value)} /></label>
        <label>Industry<input value={job.jobIndustry} onChange={(event) => update("jobIndustry", event.target.value)} /></label>
      </div>
      <label>Must-have skills<input value={job.mustHaveSkills} onChange={(event) => update("mustHaveSkills", event.target.value)} placeholder="Python, customer service, CRM" /></label>
      <label>Nice-to-have skills<input value={job.niceToHaveSkills} onChange={(event) => update("niceToHaveSkills", event.target.value)} placeholder="Separate skills with commas" /></label>
      <label>Job description<textarea value={job.jobDescription} onChange={(event) => update("jobDescription", event.target.value)} rows="4" placeholder="What is this person expected to do?" /></label>
      <label>Responsibilities<textarea value={job.responsibilities} onChange={(event) => update("responsibilities", event.target.value)} rows="3" placeholder="List the main responsibilities" /></label>
      <label>Requirements<textarea value={job.requirements} onChange={(event) => update("requirements", event.target.value)} rows="3" placeholder="List the essential requirements" /></label>
    </form>
  );
}

export default JobDetailsPanel;
