import Icon from "../../components/common/Icon";
import { initials, applicationMatchScore, applicationJobTitle, dateLabel } from "./adminDashboardUtils";
import "./AdminLegacyOverview.css";

export default function AdminLegacyOverview({ applications, averageMatchScore, pipelineStages, maxPipelineCount, recentApplications, overviewJobs, jobApplicationCounts, goToAdminSection, navigate }) {
  return <>
            <section className="admin-overview admin-overview--legacy" aria-label="Hiring performance overview">
              <div className="admin-overview__grid">
                <section className="admin-overview-panel admin-overview-panel--pipeline">
                  <div className="admin-overview-panel__heading"><div><span className="admin-overline"><i />Hiring pipeline</span><h2>Candidate momentum</h2><p>See where every application sits today.</p></div><button className="admin-link-button" type="button" onClick={() => goToAdminSection("admin-applications")}>Open pipeline <Icon name="arrowRight" size={14} /></button></div>
                  <div className="admin-pipeline-summary"><strong>{applications.length}</strong><span>Total candidates in your workspace</span><b>{averageMatchScore === null ? "—" : `${averageMatchScore}%`}</b><span>Average CV match</span></div>
                  <div className="admin-pipeline-list">{pipelineStages.map((stage) => <div className="admin-pipeline-row" key={stage.key}><span>{stage.label}</span><div className="admin-pipeline-track"><i className={`admin-pipeline-bar admin-pipeline-bar--${stage.tone}`} style={{ width: `${Math.round((stage.count / maxPipelineCount) * 100)}%` }} /></div><strong>{stage.count}</strong></div>)}</div>
                </section>

                <section className="admin-overview-panel admin-overview-panel--activity">
                  <div className="admin-overview-panel__heading"><div><span className="admin-overline"><i />Latest activity</span><h2>Recent applications</h2><p>Stay close to your newest candidates.</p></div><button className="admin-icon-link" type="button" aria-label="View all applications" title="View all applications" onClick={() => goToAdminSection("admin-applications")}><Icon name="arrowRight" size={15} /></button></div>
                  {recentApplications.length === 0 ? <div className="admin-overview-empty"><Icon name="people" size={22} /><span>No candidate activity yet</span><button type="button" onClick={() => goToAdminSection("admin-jobs")}>Publish your first role</button></div> : <div className="admin-recent-list">{recentApplications.map((application) => { const applicant = application.applicant || {}; const match = applicationMatchScore(application); const profilePhoto = applicant.profilePhoto || ""; return <button className="admin-recent-item" type="button" key={application.id} onClick={() => navigate(`/admin/applications/${application.id}`)}><span className={`admin-recent-avatar${profilePhoto ? " admin-recent-avatar--photo" : ""}`}>{profilePhoto ? <img src={profilePhoto} alt="" /> : initials(applicant.displayName || applicant.email)}</span><span className="admin-recent-copy"><strong>{applicant.displayName || applicant.email || "Candidate"}</strong><small>{applicationJobTitle(application)} · {dateLabel(application.createdAt)}</small></span><span className={`admin-recent-status admin-recent-status--${application.status || "new"}`}>{application.status || "new"}</span><b>{match >= 0 ? `${Math.round(match)}%` : "—"}</b></button>; })}</div>}
                </section>
              </div>

              <section className="admin-overview-panel admin-overview-panel--roles">
                <div className="admin-overview-panel__heading"><div><span className="admin-overline"><i />Published roles</span><h2>Your active opportunities</h2><p>Keep the roles that matter most visible and moving.</p></div><button className="admin-link-button" type="button" onClick={() => goToAdminSection("admin-jobs")}>Manage job posts <Icon name="arrowRight" size={14} /></button></div>
                {overviewJobs.length === 0 ? <div className="admin-overview-empty admin-overview-empty--wide"><Icon name="briefcase" size={22} /><span>No job posts yet</span><button type="button" onClick={() => goToAdminSection("admin-jobs")}>Create a job post</button></div> : <div className="admin-role-grid">{overviewJobs.map((job) => <article className="admin-role-card" key={job.id}><div className="admin-role-card__top"><span className={`admin-status admin-status--${job.status}`}>{job.status === "open" ? "Open" : "Closed"}</span><small>{dateLabel(job.createdAt)}</small></div><h3>{job.title}</h3><p>{job.company}{job.location ? ` · ${job.location}` : ""}</p><div className="admin-role-card__footer"><span><Icon name="people" size={13} />{jobApplicationCounts[job.id] || 0} applicant{jobApplicationCounts[job.id] === 1 ? "" : "s"}</span><button type="button" onClick={() => goToAdminSection("admin-applications")}>Review <Icon name="arrowRight" size={13} /></button></div></article>)}</div>}
              </section>
            </section>
  </>;
}
