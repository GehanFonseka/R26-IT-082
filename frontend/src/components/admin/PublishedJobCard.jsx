import { Link } from "react-router-dom";
import { dateLabel } from "./applicationBoardUtils";
import JobPublisher from "../jobs/JobPublisher";
import "./PublishedJobCard.css";

function PublishedJobCard({ job, changeJobStatus }) {
  return <article className="admin-job-item published-job-card">
    <Link className="published-job-card__link" to={`/admin/jobs/${encodeURIComponent(job.id)}`} aria-label={`View applicants for ${job.title}`}>
      <div className="admin-job-item__top"><span className={`admin-status admin-status--${job.status}`}>{job.status === "open" ? "Accepting applications" : "Closed"}</span><span>{dateLabel(job.createdAt)}</span></div>
      <h3>{job.title}</h3><p>{job.company}{job.location ? ` · ${job.location}` : ""}</p>
      <JobPublisher job={job} />
      <div className="admin-job-item__meta"><span>{job.employmentType || "Role"}</span><span>{job.seniority || "All levels"}</span><span>{(job.mustHaveSkills || []).length} key skills</span></div>
      <span className="published-job-card__hint">View applicants →</span>
    </Link>
    <div className="admin-job-item__footer"><Link to={`/admin/jobs/${encodeURIComponent(job.id)}`}>View applicants</Link><button type="button" onClick={() => changeJobStatus(job)}>{job.status === "open" ? "Close post" : "Reopen post"}</button></div>
  </article>;
}

export default PublishedJobCard;
