import { Fragment, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import CvNavigation from "../../components/layout/CvNavigation";
import CvTopbar from "../../components/layout/CvTopbar";
import Icon from "../../components/common/Icon";
import ApplicationComparison from "../../components/admin/ApplicationComparison";
import AdminOverview from "./AdminOverview";
import { useAuth } from "../../context/AuthContext";
import { createAdminJob, getAdminApplications, getAdminInterviews, getAdminJobs, updateAdminApplication, updateAdminJob } from "../../services/apiClient";
import "./AdminDashboardPage.css";
import "./AdminDashboardReference.css";

const emptyJob = {
  title: "",
  company: "",
  location: "",
  employmentType: "Full-time",
  seniority: "",
  industry: "",
  description: "",
  responsibilities: "",
  requirements: "",
  mustHaveSkills: "",
  niceToHaveSkills: "",
};

const splitSkills = (value) => String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
const dateLabel = (value) => value ? new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—";
const initials = (value) => String(value || "Applicant").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
const applicationJobKey = (application) => application.job?.id || application.jobId || `${application.jobTitle || "Unassigned job"}|${application.job?.company || ""}`;
const applicationJobTitle = (application) => application.job?.title || application.jobTitle || "Unassigned job";
const applicationMatchScore = (application) => {
  const percentage = Number(application.matchScore?.percentage);
  const probability = Number(application.matchScore?.probability);
  if (Number.isFinite(percentage)) return percentage;
  if (Number.isFinite(probability)) return probability * 100;
  return -1;
};
const applicationJobSubtitle = (application) => [application.job?.company, application.job?.location].filter(Boolean).join(" · ") || "Job details unavailable";

function AdminDashboardPage({ mode = "overview" }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [activeView, setActiveView] = useState(mode === "jobs" ? "admin-jobs" : mode === "applications" ? "admin-applications" : "admin");
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [form, setForm] = useState(emptyJob);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [jobQuery, setJobQuery] = useState("");
  const [applicationQuery, setApplicationQuery] = useState("");
  const [applicationStage, setApplicationStage] = useState("all");
  const [applicationJobFilter, setApplicationJobFilter] = useState("all");
  const [applicationSort, setApplicationSort] = useState("match");

  useEffect(() => {
    setActiveView(mode === "jobs" ? "admin-jobs" : mode === "applications" ? "admin-applications" : "admin");
  }, [mode]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([
      mode === "applications" ? Promise.resolve({ data: [] }) : getAdminJobs(),
      mode === "jobs" ? Promise.resolve({ data: [] }) : getAdminApplications(),
      mode === "overview" ? getAdminInterviews().catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
    ])
      .then(([jobResponse, applicationResponse, interviewResponse]) => {
        if (!mounted) return;
        setJobs(jobResponse.data || []);
        setApplications(applicationResponse.data || []);
        setInterviews(interviewResponse.data || []);
      })
      .catch((requestError) => mounted && setError(requestError.message || "Could not load the admin workspace."))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [mode]);

  const openJobs = jobs.filter((job) => job.status === "open").length;
  const newApplications = applications.filter((application) => application.status === "new").length;
  const scheduledInterviews = interviews.filter((interview) => !["cancelled", "completed"].includes(String(interview.status || "").toLowerCase())).length;
  const pipelineStages = [
    { key: "new", label: "New", tone: "indigo" },
    { key: "reviewing", label: "Reviewing", tone: "blue" },
    { key: "shortlisted", label: "Shortlisted", tone: "teal" },
    { key: "hired", label: "Hired", tone: "green" },
  ].map((stage) => ({ ...stage, count: applications.filter((application) => application.status === stage.key).length }));
  const maxPipelineCount = Math.max(1, ...pipelineStages.map((stage) => stage.count));
  const scoredApplications = applications.map(applicationMatchScore).filter((value) => value >= 0);
  const averageMatchScore = scoredApplications.length ? Math.round(scoredApplications.reduce((sum, value) => sum + value, 0) / scoredApplications.length) : null;
  const jobApplicationCounts = applications.reduce((counts, application) => {
    const key = applicationJobKey(application);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
  const recentApplications = [...applications].sort((first, second) => new Date(second.createdAt || 0) - new Date(first.createdAt || 0)).slice(0, 5);
  const overviewJobs = [...jobs].sort((first, second) => new Date(second.createdAt || 0) - new Date(first.createdAt || 0)).slice(0, 4);
  const applicationStageCounts = {
    new: applications.filter((application) => application.status === "new").length,
    reviewing: applications.filter((application) => application.status === "reviewing").length,
    shortlisted: applications.filter((application) => application.status === "shortlisted").length,
    hired: applications.filter((application) => application.status === "hired").length,
    rejected: applications.filter((application) => application.status === "rejected").length,
  };
  const suitableMatches = applications.filter((application) => String(application.matchScore?.classification || "").toLowerCase().includes("suitable")).length;
  const pendingMatches = applications.filter((application) => applicationMatchScore(application) < 0).length;
  const applicationJobOptions = Object.values(applications.reduce((groups, application) => {
    const key = applicationJobKey(application);
    if (!groups[key]) {
      groups[key] = {
        key,
        title: applicationJobTitle(application),
        subtitle: applicationJobSubtitle(application),
        count: 0,
      };
    }
    groups[key].count += 1;
    return groups;
  }, {})).sort((first, second) => first.title.localeCompare(second.title));
  const normalizedQuery = applicationQuery.trim().toLowerCase();
  const normalizedJobQuery = jobQuery.trim().toLowerCase();
  const filteredJobs = jobs.filter((job) => {
    if (!normalizedJobQuery) return true;
    const searchable = [
      job.title,
      job.company,
      job.location,
      job.industry,
      job.seniority,
      job.employmentType,
      ...(Array.isArray(job.mustHaveSkills) ? job.mustHaveSkills : []),
      ...(Array.isArray(job.niceToHaveSkills) ? job.niceToHaveSkills : []),
    ].filter(Boolean).join(" ").toLowerCase();
    return searchable.includes(normalizedJobQuery);
  });
  const filteredApplications = applications.filter((application) => {
    const applicant = application.applicant || {};
    const candidate = application.candidate || {};
    const searchable = [applicant.displayName, applicant.email, application.jobTitle, candidate.candidateRole, candidate.candidateIndustry].join(" ").toLowerCase();
    return (applicationStage === "all" || application.status === applicationStage)
      && (applicationJobFilter === "all" || applicationJobKey(application) === applicationJobFilter)
      && (!normalizedQuery || searchable.includes(normalizedQuery));
  });
  const sortedApplications = [...filteredApplications].sort((first, second) => {
    const jobOrder = applicationJobTitle(first).localeCompare(applicationJobTitle(second))
      || applicationJobKey(first).localeCompare(applicationJobKey(second));
    if (jobOrder !== 0) return jobOrder;
    if (applicationSort === "oldest") return new Date(first.createdAt || 0) - new Date(second.createdAt || 0);
    if (applicationSort === "recent") return new Date(second.createdAt || 0) - new Date(first.createdAt || 0);
    const scoreOrder = applicationMatchScore(second) - applicationMatchScore(first);
    return scoreOrder || new Date(second.createdAt || 0) - new Date(first.createdAt || 0);
  });
  const applicationGroupCounts = sortedApplications.reduce((counts, application) => ({ ...counts, [applicationJobKey(application)]: (counts[applicationJobKey(application)] || 0) + 1 }), {});
  const postingChecks = [
    { key: "title", label: "Job title", value: form.title },
    { key: "company", label: "Company", value: form.company },
    { key: "location", label: "Location", value: form.location },
    { key: "industry", label: "Industry", value: form.industry },
    { key: "mustHaveSkills", label: "Must-have skills", value: form.mustHaveSkills },
    { key: "description", label: "Job description", value: form.description },
    { key: "responsibilities", label: "Responsibilities", value: form.responsibilities },
    { key: "requirements", label: "Requirements", value: form.requirements },
  ];
  const completedPostingChecks = postingChecks.filter((item) => String(item.value || "").trim()).length;
  const postProgress = Math.round((completedPostingChecks / postingChecks.length) * 100);
  const coreDetailsReady = form.title.trim().length >= 2 && form.company.trim().length >= 2;

  if (user?.role !== "admin") return <Navigate to="/matching" replace />;

  const navigateFromSidebar = (view) => {
    if (view === "matcher") {
      navigate("/matching");
      return;
    }
    const destination = view === "admin-applications" ? "/admin/applications" : view === "admin-jobs" ? "/admin/jobs" : view === "admin-interviews" ? "/admin/interviews" : view === "admin-interview-results" ? "/admin/interview-results" : "/admin";
    navigate(destination);
  };

  const updateForm = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const publishJob = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setStatus("Publishing job post...");
    try {
      const response = await createAdminJob({
        ...form,
        mustHaveSkills: splitSkills(form.mustHaveSkills),
        niceToHaveSkills: splitSkills(form.niceToHaveSkills),
      });
      setJobs((current) => [response.data, ...current]);
      setForm(emptyJob);
      setStatus("Job post published and visible to candidates.");
    } catch (requestError) {
      setError(requestError.message || "Could not publish this job post.");
      setStatus("");
    } finally {
      setBusy(false);
    }
  };

  const clearJobForm = () => {
    const hasDraft = Object.entries(form).some(([key, value]) => key !== "employmentType" && String(value || "").trim());
    if (hasDraft && !window.confirm("Clear this unfinished job post? Your entered details will be removed.")) return;
    setForm(emptyJob);
    setError("");
    setStatus("");
  };

  const changeApplicationStatus = async (applicationId, nextStatus) => {
    setError("");
    try {
      const response = await updateAdminApplication(applicationId, nextStatus);
      setApplications((current) => current.map((application) => application.id === applicationId ? response.data : application));
    } catch (requestError) {
      setError(requestError.message || "Could not update the application.");
    }
  };

  const changeJobStatus = async (job) => {
    setError("");
    try {
      const response = await updateAdminJob(job.id, { ...job, status: job.status === "open" ? "closed" : "open" });
      setJobs((current) => current.map((item) => item.id === job.id ? response.data : item));
    } catch (requestError) {
      setError(requestError.message || "Could not update the job post.");
    }
  };

  const goToAdminSection = (view) => navigate(view === "admin-jobs" ? "/admin/jobs" : "/admin/applications");
  const focusJobForm = () => document.getElementById("job-posts")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="cv-app-shell admin-app-shell">
      <CvNavigation isOpen={navigationOpen} activeView={activeView} onNavigate={navigateFromSidebar} onClose={() => setNavigationOpen(false)} />
      <div className="cv-app-shell__main admin-app-shell__main">
        <CvTopbar activeView={activeView} notificationCount={newApplications} onMenuToggle={() => setNavigationOpen(true)} />
        <main className={`admin-page admin-page--${mode}`} id="admin-overview">
          <div className="admin-page__container">
            {mode !== "overview" && <header className="admin-page-heading"><div className="admin-page-heading__copy"><span className="admin-eyebrow"><i /> Admin workspace</span><h1>{mode === "jobs" ? "Job posts" : "Applications"}</h1><p>{mode === "jobs" ? "Create, publish, and manage every opportunity from one focused workspace." : "Review every candidate against the role they applied for, then move the strongest matches forward."}</p></div>{mode === "jobs" && <div className="admin-page-heading__actions"><div className="admin-page-heading__signal"><span><i /> Workspace status</span><strong>Ready to publish</strong><small>Turn your hiring need into a clear candidate opportunity.</small></div><button className="admin-page-heading__button" type="button" onClick={focusJobForm}><Icon name="plus" size={15} /> Start a new post</button></div>}{mode === "applications" && <div className="admin-page-heading__status"><span><i /> Live pipeline</span><small>{applications.length ? `${applications.length} candidate${applications.length === 1 ? "" : "s"} across ${applicationJobOptions.length} job${applicationJobOptions.length === 1 ? "" : "s"}` : "Waiting for applications"}</small></div>}</header>}
            <header className="admin-hero" aria-labelledby="admin-hero-title">
              <div className="admin-hero__content">
                <span className="admin-eyebrow"><i /> Admin command center</span>
                <h1 id="admin-hero-title">Admin workspace</h1>
                <p>Manage every role, candidate, and interview from one focused hiring workspace.</p>
                <div className="admin-hero__actions">
                  <button className="admin-button admin-button--primary" type="button" onClick={() => goToAdminSection("admin-jobs")}><Icon name="plus" size={16} /> Post a new job</button>
                  <button className="admin-button admin-button--quiet" type="button" onClick={() => goToAdminSection("admin-applications")}><Icon name="people" size={16} /> Review applications</button>
                </div>
              </div>
              <div className="admin-hero__identity">
                <div className="admin-hero__avatar">{initials(user.displayName)}</div>
                <span>Signed in as</span>
                <strong>{user.displayName}</strong>
                <small>{user.email}</small>
                <div className="admin-hero__identity-meta" aria-label="Workspace overview">
                  <span><b>{openJobs}</b><small>Open roles</small></span>
                  <i />
                  <span><b>{applications.length}</b><small>Applications</small></span>
                </div>
              </div>
            </header>

            <section className="admin-stats" aria-label="Recruiting overview">
              <article className="admin-stat admin-stat--open-jobs"><span className="admin-stat__icon admin-stat__icon--purple"><Icon name="briefcase" size={17} /></span><div><small>Open jobs</small><strong>{openJobs}</strong><span>Currently accepting applications</span></div><svg className="admin-stat__spark admin-stat__spark--purple" viewBox="0 0 120 44" aria-hidden="true"><polyline points="2,35 16,30 29,34 42,22 54,27 67,17 80,25 94,9 106,17 118,4" /></svg></article>
              <article className="admin-stat admin-stat--total-applications"><span className="admin-stat__icon admin-stat__icon--teal"><Icon name="people" size={17} /></span><div><small>Total applications</small><strong>{applications.length}</strong><span>Across every published role</span></div><svg className="admin-stat__spark admin-stat__spark--teal" viewBox="0 0 120 44" aria-hidden="true"><polyline points="2,29 14,15 26,18 39,38 51,20 64,23 77,8 89,31 101,5 118,17" /></svg></article>
              <article className="admin-stat admin-stat--needs-review"><span className="admin-stat__icon admin-stat__icon--gold"><Icon name="spark" size={17} /></span><div><small>Needs review</small><strong>{newApplications}</strong><span>New candidate submissions</span></div><svg className="admin-stat__spark admin-stat__spark--gold" viewBox="0 0 120 44" aria-hidden="true"><polyline points="2,32 15,25 28,30 39,16 51,27 63,8 76,24 88,12 101,28 112,7 118,12" /></svg></article>
              <article className="admin-stat admin-stat--interviews-planned"><span className="admin-stat__icon admin-stat__icon--blue"><Icon name="calendar" size={17} /></span><div><small>Interviews planned</small><strong>{scheduledInterviews}</strong><span>Upcoming conversations</span></div><svg className="admin-stat__spark admin-stat__spark--blue" viewBox="0 0 120 44" aria-hidden="true"><polyline points="2,30 16,25 27,31 41,17 53,24 65,12 77,22 88,8 99,29 110,19 118,27" /></svg></article>
            </section>

            {mode === "overview" && <section className="admin-overview admin-overview--legacy" aria-label="Hiring performance overview">
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
            </section>}

            {mode === "overview" && <AdminOverview applications={applications} interviews={interviews} pipelineStages={pipelineStages} averageMatchScore={averageMatchScore} navigate={navigate} />}

            {mode === "applications" && <section className="admin-application-command" aria-label="Application command centre">
              <div className="admin-application-command__intro">
                <div>
                  <span className="admin-overline"><i /> Candidate pipeline</span>
                  <h2>See your strongest matches first.</h2>
                  <p>Applications are grouped by job and ranked with the server-side CV matching result. Open a candidate to review the saved CV snapshot, job requirements, and next stage.</p>
                </div>
                <div className="admin-application-command__actions">
                  <button type="button" className="admin-button admin-button--primary" onClick={() => { setApplicationStage("new"); setApplicationJobFilter("all"); }}><Icon name="spark" size={15} /> Review new <b>{applicationStageCounts.new}</b></button>
                  <button type="button" className="admin-button admin-button--quiet" onClick={() => navigate("/admin/jobs")}><Icon name="briefcase" size={15} /> Manage roles <Icon name="arrowRight" size={14} /></button>
                </div>
              </div>
              <div className="admin-application-metrics">
                <article><span className="admin-application-metric__icon admin-application-metric__icon--dark"><Icon name="people" size={16} /></span><div><strong>{applications.length}</strong><small>Total applicants</small></div></article>
                <article><span className="admin-application-metric__icon admin-application-metric__icon--gold"><Icon name="spark" size={16} /></span><div><strong>{applicationStageCounts.new}</strong><small>Needs first review</small></div></article>
                <article><span className="admin-application-metric__icon admin-application-metric__icon--teal"><Icon name="check" size={16} /></span><div><strong>{suitableMatches}</strong><small>Suitable model matches</small></div></article>
                <article><span className="admin-application-metric__icon admin-application-metric__icon--purple"><Icon name="activity" size={16} /></span><div><strong>{pendingMatches}</strong><small>Awaiting model score</small></div></article>
              </div>
              <div className="admin-application-pipeline" aria-label="Application stage summary">
                <div><span>Pipeline health</span><strong>{applications.length ? `${Math.round(((applicationStageCounts.shortlisted + applicationStageCounts.hired) / applications.length) * 100)}%` : "0%"}</strong></div>
                <div className="admin-application-pipeline__track"><i style={{ width: `${applications.length ? Math.max(2, ((applicationStageCounts.shortlisted + applicationStageCounts.hired) / applications.length) * 100) : 0}%` }} /></div>
                <div className="admin-application-pipeline__legend"><span><i className="is-new" />{applicationStageCounts.new} new</span><span><i className="is-reviewing" />{applicationStageCounts.reviewing} reviewing</span><span><i className="is-shortlisted" />{applicationStageCounts.shortlisted} shortlisted</span><span><i className="is-hired" />{applicationStageCounts.hired} hired</span></div>
              </div>
            </section>}

            <div className="admin-content-grid">
              <section className="admin-card admin-job-form" id="job-posts" tabIndex="-1">
                <div className="admin-card__heading"><div><span className="admin-eyebrow">01 · Job publishing</span><h2>Post a new opportunity</h2></div><span className="admin-card__badge"><Icon name="shield" size={14} /> Admin only</span></div>
                <p className="admin-card__intro">Give candidates the context they need. You can close or reopen a post later from the job list.</p>
                <form onSubmit={publishJob} aria-label="Create a job post">
                  <div className="admin-job-form__progress" aria-label={`Job post readiness ${postProgress}%`}>
                    <div className="admin-job-form__progress-heading"><div><span>Post readiness</span><small>{coreDetailsReady ? "Core details are ready to publish." : "Add a title and company to get started."}</small></div><strong>{postProgress}%</strong></div>
                    <div className="admin-job-form__progress-track"><i style={{ width: `${postProgress}%` }} /></div>
                    <div className="admin-job-form__progress-foot"><span>{completedPostingChecks} of {postingChecks.length} content areas completed</span><span>Saved only when you publish</span></div>
                  </div>

                  <div className="admin-form-section"><div className="admin-form-section__title"><b>01</b><span>Role overview</span></div><small>Start with the details candidates scan first.</small></div>
                  <div className="admin-form-grid admin-form-grid--two"><label>Job title <em>Required</em><input name="title" value={form.title} onChange={updateForm} placeholder="e.g. Product Designer" autoComplete="organization-title" aria-required="true" required /></label><label>Company <em>Required</em><input name="company" value={form.company} onChange={updateForm} placeholder="e.g. Northstar Labs" autoComplete="organization" aria-required="true" required /></label></div>
                  <div className="admin-form-grid admin-form-grid--three"><label>Location <span>City, country, or remote</span><input name="location" value={form.location} onChange={updateForm} placeholder="Colombo or Remote" autoComplete="address-level2" /></label><label>Employment type<select name="employmentType" value={form.employmentType} onChange={updateForm}><option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option></select></label><label>Seniority <span>Who is this role for?</span><input name="seniority" value={form.seniority} onChange={updateForm} placeholder="Mid-level" /></label></div>
                  <div className="admin-form-grid admin-form-grid--two"><label>Industry <span>Helps candidates find the role</span><input name="industry" value={form.industry} onChange={updateForm} placeholder="Technology" /></label><label>Must-have skills <span>Separate skills with commas</span><input name="mustHaveSkills" value={form.mustHaveSkills} onChange={updateForm} placeholder="React, Figma, Research" />{splitSkills(form.mustHaveSkills).length > 0 && <span className="admin-skill-preview" aria-label="Must-have skill preview">{splitSkills(form.mustHaveSkills).slice(0, 8).map((skill) => <b key={skill}>{skill}</b>)}</span>}</label></div>
                  <label>Nice-to-have skills <span>Optional · separate skills with commas</span><input name="niceToHaveSkills" value={form.niceToHaveSkills} onChange={updateForm} placeholder="Testing, analytics" />{splitSkills(form.niceToHaveSkills).length > 0 && <span className="admin-skill-preview admin-skill-preview--quiet" aria-label="Nice-to-have skill preview">{splitSkills(form.niceToHaveSkills).slice(0, 8).map((skill) => <b key={skill}>{skill}</b>)}</span>}</label>

                  <div className="admin-form-section"><div className="admin-form-section__title"><b>02</b><span>Role narrative</span></div><small>Make the opportunity clear, useful, and easy to evaluate.</small></div>
                  <label>Job description <em>Recommended</em><textarea name="description" value={form.description} onChange={updateForm} rows="4" maxLength="6000" placeholder="Tell candidates why this role matters, what the team does, and what success looks like." /><small className="admin-field-meta"><span>Write in plain language and keep the first paragraph scannable.</span><b>{form.description.length}/6000</b></small></label>
                  <div className="admin-form-grid admin-form-grid--two"><label>Responsibilities <em>Recommended</em><textarea name="responsibilities" value={form.responsibilities} onChange={updateForm} rows="5" maxLength="6000" placeholder="What will this person own? Add one responsibility per line for easier scanning." /><small className="admin-field-meta"><span>Focus on outcomes and day-to-day ownership.</span><b>{form.responsibilities.length}/6000</b></small></label><label>Requirements <em>Recommended</em><textarea name="requirements" value={form.requirements} onChange={updateForm} rows="5" maxLength="6000" placeholder="What experience, knowledge, or qualifications are essential?" /><small className="admin-field-meta"><span>Separate must-have requirements from nice-to-have skills.</span><b>{form.requirements.length}/6000</b></small></label></div>

                  <section className="admin-job-preview" aria-label="Candidate-facing job preview">
                    <div className="admin-job-preview__heading"><div><span className="admin-overline"><i /> Candidate preview</span><strong>What applicants will see first</strong></div><span>Live</span></div>
                    <div className="admin-job-preview__body"><div><span className="admin-status admin-status--open">Open</span><h3>{form.title.trim() || "Your job title"}</h3><p>{form.company.trim() || "Your company"}{form.location.trim() ? ` · ${form.location.trim()}` : " · Add a location"}</p></div><div className="admin-job-preview__tags"><span>{form.employmentType || "Full-time"}</span>{form.seniority.trim() && <span>{form.seniority.trim()}</span>}{form.industry.trim() && <span>{form.industry.trim()}</span>}</div></div>
                  </section>

                  {error && <p className="admin-message admin-message--error" role="alert"><Icon name="alert" size={15} />{error}</p>}
                  <div className="admin-form-footer"><div className="admin-form-footer__copy"><strong>{coreDetailsReady ? "Ready to publish" : "Complete the required fields"}</strong><small>{coreDetailsReady ? "You can close or reopen this post later." : "Job title and company are required."}</small></div><div className="admin-form-footer__actions"><button className="admin-button admin-button--quiet" type="button" onClick={clearJobForm} disabled={busy}>Clear form</button><button className="admin-button admin-button--primary" type="submit" disabled={busy}>{busy ? "Publishing..." : "Publish job post"}<Icon name="arrowRight" size={16} /></button></div>{status && <span className="admin-message admin-message--success" role="status">{status}</span>}</div>
                </form>
              </section>

              <section className="admin-card admin-jobs-card" id="published-jobs">
                <div className="admin-card__heading"><div><span className="admin-eyebrow">02 · Your posts</span><h2>Published jobs</h2></div><span className="admin-count">{jobQuery ? `${filteredJobs.length}/${jobs.length}` : `${jobs.length} total`}</span></div>
                {!loading && jobs.length > 0 && <label className="admin-job-search"><Icon name="search" size={15} /><span className="sr-only">Search published jobs</span><input value={jobQuery} onChange={(event) => setJobQuery(event.target.value)} placeholder="Search title, company, location or skill" aria-label="Search published jobs" />{jobQuery && <button type="button" onClick={() => setJobQuery("")} aria-label="Clear job search" title="Clear job search"><Icon name="close" size={13} /></button>}</label>}
                {loading ? <div className="admin-empty"><span className="admin-loader" />Loading job posts...</div> : jobs.length === 0 ? <div className="admin-empty"><Icon name="briefcase" size={25} /><strong>No job posts yet</strong><span>Your published opportunities will appear here.</span></div> : filteredJobs.length === 0 ? <div className="admin-job-filter-empty" role="status"><Icon name="search" size={22} /><strong>No matching job posts</strong><span>Try a different title, company, location, or skill.</span><button type="button" onClick={() => setJobQuery("")}>Clear search</button></div> : <div className="admin-job-list" tabIndex="0" aria-label="Published job posts">{filteredJobs.map((job) => <article className="admin-job-item" key={job.id}><div className="admin-job-item__top"><span className={`admin-status admin-status--${job.status}`}>{job.status === "open" ? "Accepting applications" : "Closed"}</span><span>{dateLabel(job.createdAt)}</span></div><h3>{job.title}</h3><p>{job.company}{job.location ? ` · ${job.location}` : ""}</p><div className="admin-job-item__meta"><span>{job.employmentType || "Role"}</span><span>{job.seniority || "All levels"}</span><span>{(job.mustHaveSkills || []).length} key skills</span></div><div className="admin-job-item__footer"><span>{job.status === "open" ? "Candidates can apply" : "Applications paused"}</span><button type="button" onClick={() => changeJobStatus(job)}>{job.status === "open" ? "Close post" : "Reopen post"}</button></div></article>)}</div>}
              </section>
            </div>

            <section className="admin-card admin-applications-card" id="applications" tabIndex="-1">
              <div className="admin-card__heading"><div><span className="admin-eyebrow">03 · Candidate pipeline</span><h2>Applications</h2></div><span className="admin-count">{applications.length} received</span></div>
              <p className="admin-card__intro">Review applicant details and move each person through your hiring pipeline. Candidate CV fields are stored against their own account.</p>
              {applications.length > 0 && <div className="admin-list-toolbar"><label className="admin-search-field"><span>Search applications</span><Icon name="search" size={15} /><input value={applicationQuery} onChange={(event) => setApplicationQuery(event.target.value)} placeholder="Name, email, role..." /></label><label className="admin-filter-field"><span>Job post</span><select value={applicationJobFilter} onChange={(event) => setApplicationJobFilter(event.target.value)}><option value="all">All job posts</option>{applicationJobOptions.map((job) => <option value={job.key} key={job.key}>{job.title} ({job.count})</option>)}</select></label><label className="admin-filter-field"><span>Stage</span><select value={applicationStage} onChange={(event) => setApplicationStage(event.target.value)}><option value="all">All stages</option><option value="new">New</option><option value="reviewing">Reviewing</option><option value="shortlisted">Shortlisted</option><option value="rejected">Rejected</option><option value="hired">Hired</option></select></label><label className="admin-filter-field"><span>Sort candidates</span><select value={applicationSort} onChange={(event) => setApplicationSort(event.target.value)}><option value="match">Strongest match</option><option value="recent">Most recent</option><option value="oldest">Oldest first</option></select></label></div>}
              {loading ? <div className="admin-empty"><span className="admin-loader" />Loading applications...</div> : applications.length === 0 ? <div className="admin-empty admin-empty--wide"><Icon name="people" size={29} /><strong>No applications yet</strong><span>When candidates apply to your open jobs, their details will appear in this workspace.</span><button type="button" onClick={() => navigate("/admin/jobs")}>View job posts <Icon name="arrowRight" size={13} /></button></div> : filteredApplications.length === 0 ? <div className="admin-filter-empty"><Icon name="search" size={22} /><strong>No matching applications</strong><span>Try another name, role, job post, or stage.</span><button className="admin-text-button" type="button" onClick={() => { setApplicationQuery(""); setApplicationStage("all"); setApplicationJobFilter("all"); }}>Clear filters</button></div> : <div className="admin-application-list">{sortedApplications.map((application, index) => { const applicant = application.applicant || {}; const candidate = application.candidate || {}; const groupKey = applicationJobKey(application); const isGroupStart = index === 0 || applicationJobKey(sortedApplications[index - 1]) !== groupKey; const match = applicationMatchScore(application); const matchWidth = match >= 0 ? Math.min(100, Math.max(0, match)) : 0; return <Fragment key={application.id}>{isGroupStart && <header className="admin-application-group"><div><span>Job post · {applicationGroupCounts[groupKey]} applicant{applicationGroupCounts[groupKey] === 1 ? "" : "s"}</span><h3>{applicationJobTitle(application)}</h3><p>{applicationJobSubtitle(application)}</p></div><div className="admin-application-group__meta"><small>Sorted by {applicationSort === "match" ? "CV match" : applicationSort === "recent" ? "most recent" : "oldest"}</small><strong>{applicationGroupCounts[groupKey]} candidate{applicationGroupCounts[groupKey] === 1 ? "" : "s"}</strong></div></header>}<article className="admin-application" key={application.id}><div className="admin-application__avatar">{initials(applicant.displayName || applicant.email)}</div><div className="admin-application__main"><div className="admin-application__title"><div><h3>{applicant.displayName || applicant.email || "Candidate"}</h3><p>{applicant.email || "No email provided"}</p></div><span className="admin-application__date">Applied {dateLabel(application.createdAt)}</span></div><div className="admin-application__details"><span><b>Role</b>{candidate.candidateRole || "Not provided"}</span><span><b>Experience</b>{candidate.yearsExperience ? `${candidate.yearsExperience} years` : "Not provided"}</span><span><b>Applied for</b>{application.jobTitle || applicationJobTitle(application)}</span><span className="admin-application__match-score"><b>CV match score</b><strong>{match >= 0 ? `${Math.round(match)}%` : "Pending"}</strong><small>{application.matchScore?.classification || "Awaiting model analysis"}</small>{match >= 0 && <i aria-hidden="true"><em style={{ width: `${matchWidth}%` }} /></i>}</span></div><button className="admin-application__open-analysis" type="button" onClick={() => navigate(`/admin/applications/${application.id}`)}><Icon name="activity" size={14} /> Review this CV with the model <Icon name="arrowRight" size={14} /></button><ApplicationComparison application={application} />{application.coverLetter && <p className="admin-application__letter">{application.coverLetter}</p>}</div><label className="admin-application__status">Stage<select value={application.status} onChange={(event) => changeApplicationStatus(application.id, event.target.value)}><option value="new">New</option><option value="reviewing">Reviewing</option><option value="shortlisted">Shortlisted</option><option value="rejected">Rejected</option><option value="hired">Hired</option></select></label></article></Fragment>; })}</div>}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
