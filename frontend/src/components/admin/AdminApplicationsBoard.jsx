import { Fragment } from "react";
import ApplicationComparison from "./ApplicationComparison";
import Icon from "../common/Icon";
import "./AdminApplicationsBoard.css";

const stages = ["new", "reviewing", "shortlisted", "hired"];
const stageLabels = { new: "New", reviewing: "Reviewing", shortlisted: "Shortlisted", hired: "Hired" };
const statusLabels = { ...stageLabels, rejected: "Rejected" };
const dateLabel = (value) => value ? new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—";
const initials = (value) => String(value || "Applicant").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
const jobTitle = (application) => application.job?.title || application.jobTitle || "Unassigned job";
const jobKey = (application) => application.job?.id || application.jobId || `${application.jobTitle || "Unassigned job"}|${application.job?.company || ""}`;
const jobSubtitle = (application) => [application.job?.company, application.job?.location].filter(Boolean).join(" · ") || "Job details unavailable";
const matchScore = (application) => {
  const percentage = Number(application.matchScore?.percentage);
  const probability = Number(application.matchScore?.probability);
  return Number.isFinite(percentage) ? percentage : Number.isFinite(probability) ? probability * 100 : -1;
};

function StageProgress({ status }) {
  const current = stages.indexOf(status);
  const width = current < 0 ? 0 : (current / (stages.length - 1)) * 100;
  return <div className={`application-result__progress application-result__progress--${status}`} aria-label={`Application stage: ${statusLabels[status] || "New"}`}>
    <div className="application-result__track"><i style={{ width: `${width}%` }} /></div>
    <div className="application-result__steps">{stages.map((stage, index) => <span className={`${index <= current ? "is-complete" : ""}${index === current ? " is-current" : ""}`} key={stage}><i /><b>{stageLabels[stage]}</b></span>)}</div>
  </div>;
}

function ApplicationCard({ application, changeApplicationStatus, navigate }) {
  const applicant = application.applicant || {};
  const candidate = application.candidate || {};
  const status = application.status || "new";
  const score = matchScore(application);
  const photo = applicant.profilePhoto || "";
  return <article className="application-result">
    <div className="application-result__identity"><span className={`application-result__avatar${photo ? " application-result__avatar--photo" : ""}`}>{photo ? <img src={photo} alt="" /> : initials(applicant.displayName || applicant.email)}</span><div><small>Applied {dateLabel(application.createdAt)}</small><h3>{applicant.displayName || applicant.email || "Candidate"}</h3><p>{applicant.email || "No email provided"}</p></div></div>
    <div className="application-result__journey"><div className="application-result__job"><Icon name="briefcase" size={14} /><strong>{jobTitle(application)}</strong><span className={`application-result__status application-result__status--${status}`}>{statusLabels[status] || "New"}</span></div><StageProgress status={status} /><div className="application-result__facts"><span><b>Role</b>{candidate.candidateRole || "Not provided"}</span><span><b>Experience</b>{candidate.yearsExperience ? `${candidate.yearsExperience} years` : "Not provided"}</span></div></div>
    <div className="application-result__score"><small>CV match</small><strong>{score >= 0 ? `${Math.round(score)}%` : "—"}</strong><span>{application.matchScore?.classification || "Analysis pending"}</span>{score >= 0 && <i><em style={{ width: `${Math.min(100, Math.max(0, score))}%` }} /></i>}</div>
    <div className="application-result__actions"><label>Stage<select value={status} onChange={(event) => changeApplicationStatus(application.id, event.target.value)}><option value="new">New</option><option value="reviewing">Reviewing</option><option value="shortlisted">Shortlisted</option><option value="rejected">Rejected</option><option value="hired">Hired</option></select></label><button type="button" onClick={() => navigate(`/admin/applications/${application.id}`)}>Review CV <Icon name="arrowRight" size={14} /></button></div>
    <div className="application-result__comparison"><ApplicationComparison application={application} />{application.coverLetter && <p>{application.coverLetter}</p>}</div>
  </article>;
}

function AdminApplicationsBoard({ applications, filteredApplications, sortedApplications, loading, error, applicationQuery, setApplicationQuery, applicationStage, setApplicationStage, applicationJobFilter, setApplicationJobFilter, applicationSort, setApplicationSort, applicationJobOptions, applicationGroupCounts, changeApplicationStatus, navigate }) {
  return <section className="applications-workspace" id="applications" tabIndex="-1">
    <div className="applications-workspace__heading"><div><span className="applications-workspace__eyebrow"><i />Candidate pipeline</span><h2>Applications</h2><p>Review every candidate in a focused, easy-to-scan hiring queue.</p></div><span className="applications-workspace__count">{applications.length} received</span></div>
    {error && <p className="applications-workspace__error" role="alert"><Icon name="alert" size={15} />{error}</p>}
    {applications.length > 0 && <div className="applications-workspace__toolbar"><label className="application-filter application-filter--search"><span>Search applications</span><Icon name="search" size={15} /><input value={applicationQuery} onChange={(event) => setApplicationQuery(event.target.value)} placeholder="Name, email, role..." /></label><label className="application-filter"><span>Job post</span><select value={applicationJobFilter} onChange={(event) => setApplicationJobFilter(event.target.value)}><option value="all">All job posts</option>{applicationJobOptions.map((job) => <option value={job.key} key={job.key}>{job.title} ({job.count})</option>)}</select></label><label className="application-filter"><span>Stage</span><select value={applicationStage} onChange={(event) => setApplicationStage(event.target.value)}><option value="all">All stages</option>{Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label className="application-filter"><span>Sort candidates</span><select value={applicationSort} onChange={(event) => setApplicationSort(event.target.value)}><option value="match">Strongest match</option><option value="recent">Most recent</option><option value="oldest">Oldest first</option></select></label></div>}
    {loading ? <div className="applications-empty"><span className="applications-empty__loader" />Loading applications...</div> : applications.length === 0 ? <div className="applications-empty"><Icon name="people" size={29} /><strong>No applications yet</strong><span>When candidates apply to your open jobs, their details will appear in this workspace.</span><button type="button" onClick={() => navigate("/admin/jobs")}>View job posts <Icon name="arrowRight" size={13} /></button></div> : filteredApplications.length === 0 ? <div className="applications-empty"><Icon name="search" size={22} /><strong>No matching applications</strong><span>Try another name, role, job post, or stage.</span><button type="button" onClick={() => { setApplicationQuery(""); setApplicationStage("all"); setApplicationJobFilter("all"); }}>Clear filters</button></div> : <div className="application-result-list">{sortedApplications.map((application, index) => { const key = jobKey(application); const groupStart = index === 0 || jobKey(sortedApplications[index - 1]) !== key; return <Fragment key={application.id}>{groupStart && <header className="application-result-group"><div><span>Job post · {applicationGroupCounts[key]} applicant{applicationGroupCounts[key] === 1 ? "" : "s"}</span><h3>{jobTitle(application)}</h3><p>{jobSubtitle(application)}</p></div><strong>{applicationGroupCounts[key]} candidate{applicationGroupCounts[key] === 1 ? "" : "s"}</strong></header>}<ApplicationCard application={application} changeApplicationStatus={changeApplicationStatus} navigate={navigate} /></Fragment>; })}</div>}
  </section>;
}

export default AdminApplicationsBoard;
