import { useNavigate } from "react-router-dom";
import Icon from "../common/Icon";
import JobMatchAnalysis from "./JobMatchAnalysis";
import "./OpportunityCard.css";

export default function OpportunityCard({ job, applied }) {
  const navigate = useNavigate();
  const company = job.publisherCompany?.name || job.company || "Company not specified";
  const initials = company.trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
  const created = job.createdAt ? new Date(job.createdAt) : null;
  const validDate = created && !Number.isNaN(created.getTime());
  const skills = job.mustHaveSkills || [];

  return <article className="opportunity-card">
    <div className="opportunity-card__cover">
    <header className="opportunity-card__header">
      <div className="opportunity-card__publisher">
        <span className="opportunity-card__monogram" aria-hidden="true">{initials}</span>
        <div><span className="opportunity-card__eyebrow">Published by</span><strong>{company}</strong></div>
      </div>
      <span className="opportunity-card__status"><i />Open</span>
    </header>
    <div className="opportunity-card__identity">
      <h3>{job.title}</h3>
      {job.location && <p><Icon name="compass" size={15} />{job.location}</p>}
    </div>
    </div>
    <dl className="opportunity-card__details">
      <div><dt>Employment</dt><dd><Icon name="briefcase" size={14} />{job.employmentType || "Full-time"}</dd></div>
      {job.seniority && <div><dt>Experience level</dt><dd>{job.seniority}</dd></div>}
      {job.industry && <div><dt>Industry</dt><dd>{job.industry}</dd></div>}
    </dl>
    {job.description && <p className="opportunity-card__description">{job.description}</p>}
    {skills.length > 0 && <div className="opportunity-card__skills">
      <span className="opportunity-card__eyebrow">Key skills</span>
      <ul>{skills.slice(0, 4).map((skill, index) => <li key={`${skill}-${index}`}>{skill}</li>)}
        {skills.length > 4 && <li aria-label={`${skills.length - 4} more skills`}>+{skills.length - 4} more</li>}
      </ul>
    </div>}
    <footer className="opportunity-card__footer">
      <div className="opportunity-card__posted">
        <Icon name={applied ? "check" : "calendar"} size={14} />
        {applied ? <span>Application sent</span> : validDate ? <span>Posted <time dateTime={created.toISOString()}>{created.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</time></span> : <span>Accepting applications</span>}
      </div>
      <div className="opportunity-card__actions">
        <JobMatchAnalysis job={job} />
        <button className="opportunity-card__apply" type="button" disabled={applied} onClick={() => navigate(`/jobs/apply/${job.id}`)}>
          {applied ? "Applied" : "View & apply"}<Icon name={applied ? "check" : "arrowRight"} size={16} />
        </button>
      </div>
    </footer>
  </article>;
}
