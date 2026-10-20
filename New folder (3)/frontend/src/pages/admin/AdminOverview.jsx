import Icon from "../../components/common/Icon";
import "./AdminOverview.css";

const initials = (value) => String(value || "Candidate").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
const statusLabel = (value) => ({ new: "Needs review", reviewing: "Screening", shortlisted: "Interview", hired: "Hired" }[value] || "Needs review");
const timeLabel = (value) => { const date = new Date(value); return Number.isNaN(date.getTime()) ? "—" : date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }); };
const roleText = (application) => application.candidate?.candidateRole || application.job?.title || application.jobTitle || "Candidate";

const analyticsGroups = (applications) => {
  const groups = [
    { label: "Engineering", tone: "purple", words: ["engineer", "developer", "software", "technical", "devops"] },
    { label: "Design", tone: "blue", words: ["design", "ux", "ui", "creative"] },
    { label: "Product", tone: "teal", words: ["product", "research", "manager"] },
  ];
  const counts = groups.map((group) => applications.filter((application) => group.words.some((word) => roleText(application).toLowerCase().includes(word))).length);
  const other = Math.max(0, applications.length - counts.reduce((sum, count) => sum + count, 0));
  return [...groups, { label: "Other", tone: "coral" }].map((group, index) => ({ ...group, count: index < counts.length ? counts[index] : other }));
};

function AdminOverview({ applications, interviews, pipelineStages, averageMatchScore, navigate }) {
  const stageMap = Object.fromEntries(pipelineStages.map((stage) => [stage.key, stage.count]));
  const pipeline = [
    { label: "Applied", count: stageMap.new || 0, tone: "purple" },
    { label: "Screening", count: stageMap.reviewing || 0, tone: "blue" },
    { label: "Interview", count: interviews.filter((item) => item.status === "scheduled").length, tone: "teal" },
    { label: "Offer", count: stageMap.shortlisted || 0, tone: "coral" },
    { label: "Hired", count: stageMap.hired || 0, tone: "green" },
  ];
  const maxPipeline = Math.max(1, ...pipeline.map((stage) => stage.count));
  const recent = applications.slice(0, 5);
  const upcoming = interviews.filter((item) => item.status === "scheduled").sort((first, second) => new Date(first.scheduledAt) - new Date(second.scheduledAt)).slice(0, 3);
  const analytics = analyticsGroups(applications);
  const total = Math.max(1, applications.length);
  let cursor = 0;
  const donut = applications.length ? analytics.map((item) => { const color = { purple: "#7e61ef", blue: "#6a9cf2", teal: "#62cdbb", coral: "#ff8c78" }[item.tone]; const end = cursor + (item.count / total) * 100; const segment = `${color} ${cursor}% ${end}%`; cursor = end; return segment; }).join(", ") : "#edf0f7 0 100%";
  const conversion = applications.length ? Math.round((stageMap.hired || 0) / applications.length * 100) : 0;

  return <section className="admin-overview admin-overview--reference" aria-label="Hiring performance overview">
    <section className="dashboard-card dashboard-card--pipeline"><div className="dashboard-card__heading"><div><span className="dashboard-overline"><i /> Hiring pipeline</span><h2>Candidate momentum</h2><p>See where every application sits today.</p></div><button className="dashboard-link" type="button" onClick={() => navigate("/admin/applications")}>Open pipeline <Icon name="arrowRight" size={14} /></button></div><div className="dashboard-pipeline">{pipeline.map((stage) => <div className="dashboard-pipeline__stage" key={stage.label}><div className="dashboard-pipeline__label"><span>{stage.label}</span><strong>{stage.count}</strong></div><div className={`dashboard-pipeline__dots dashboard-pipeline__dots--${stage.tone}`}>{Array.from({ length: 25 }, (_, index) => <i key={index} style={{ opacity: `${0.2 + ((index % 5) * 0.13)}` }} />)}</div><div className="dashboard-pipeline__track"><i style={{ width: `${Math.round((stage.count / maxPipeline) * 100)}%` }} /></div></div>)}</div><div className="dashboard-card__footer"><span><small>Conversion rate</small><strong>{conversion}%</strong></span><span><small>Avg. match score</small><strong>{averageMatchScore === null ? "—" : `${averageMatchScore}%`}</strong></span><svg viewBox="0 0 160 48" aria-hidden="true"><path d="M2 38C17 31 24 32 35 37s17 7 28-4 18-11 29-2 15 9 25-5 19-15 26-7 10 5 15-4" /></svg></div></section>
    <section className="dashboard-card dashboard-card--activity"><div className="dashboard-card__heading"><div><span className="dashboard-overline"><i /> Latest activity</span><h2>Recent applications</h2><p>Stay close to your newest candidates.</p></div><button className="dashboard-icon-link" type="button" aria-label="View all applications" onClick={() => navigate("/admin/applications")}><Icon name="arrowRight" size={15} /></button></div><div className="dashboard-application-list">{recent.length ? recent.map((application) => { const applicant = application.applicant || {}; const photo = applicant.profilePhoto || ""; return <button className="dashboard-application" type="button" key={application.id} onClick={() => navigate(`/admin/applications/${application.id}`)}><span className={`dashboard-application__avatar${photo ? " dashboard-application__avatar--photo" : ""}`}>{photo ? <img src={photo} alt="" /> : initials(applicant.displayName || applicant.email)}</span><span className="dashboard-application__copy"><strong>{applicant.displayName || applicant.email || "Candidate"}</strong><small>{roleText(application)}</small></span><small className="dashboard-application__time">{timeLabel(application.createdAt)}</small><b className={`dashboard-application__status dashboard-application__status--${application.status || "new"}`}>{statusLabel(application.status)}</b></button>; }) : <div className="dashboard-empty"><Icon name="people" size={22} /><span>No candidate activity yet</span><button type="button" onClick={() => navigate("/admin/jobs")}>Publish your first role</button></div>}</div><button className="dashboard-footer-link" type="button" onClick={() => navigate("/admin/applications")}>View all applications <Icon name="arrowRight" size={14} /></button></section>
    <div className="dashboard-side-stack"><section className="dashboard-card dashboard-card--interviews"><div className="dashboard-card__heading"><div><span className="dashboard-overline"><i /> Today's interviews</span><h2>Interview schedule</h2></div><button className="dashboard-link" type="button" onClick={() => navigate("/admin/interviews")}>View calendar <Icon name="arrowRight" size={14} /></button></div><div className="dashboard-interview-list">{upcoming.length ? upcoming.map((interview) => { const applicant = interview.application?.applicant || {}; return <button className="dashboard-interview" type="button" key={interview.id} onClick={() => navigate(`/interviews/${interview.id}`)}><strong>{timeLabel(interview.scheduledAt)}</strong><span><b>{applicant.displayName || applicant.email || "Candidate"}</b><small>{interview.job?.title || "Scheduled interview"}</small></span><i>{initials(applicant.displayName || applicant.email)}</i></button>; }) : <div className="dashboard-empty dashboard-empty--small"><Icon name="calendar" size={20} /><span>No interviews scheduled</span></div>}</div></section><section className="dashboard-card dashboard-card--analytics"><div className="dashboard-card__heading"><div><span className="dashboard-overline"><i /> Hiring analytics</span><h2>Application mix</h2></div><span className="dashboard-card__period">This month <Icon name="arrowDown" size={12} /></span></div><div className="dashboard-analytics"><div className="dashboard-donut" style={{ "--dashboard-donut": donut }}><strong>{applications.length}</strong><small>Total<br />applications</small></div><div className="dashboard-legend">{analytics.map((item) => <span key={item.label}><i className={`dashboard-legend__dot dashboard-legend__dot--${item.tone}`} /><b>{item.label}</b><small>{item.count}</small><em>{Math.round((item.count / total) * 100)}%</em></span>)}</div></div></section></div>
  </section>;
}

export default AdminOverview;
