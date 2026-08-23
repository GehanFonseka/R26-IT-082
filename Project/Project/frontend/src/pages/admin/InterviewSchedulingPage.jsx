import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import CvNavigation from "../../components/layout/CvNavigation";
import CvTopbar from "../../components/layout/CvTopbar";
import Icon from "../../components/common/Icon";
import { useAuth } from "../../context/AuthContext";
import { createAdminInterview, getAdminApplications, getAdminInterviews, getAdminJobs, updateAdminInterview } from "../../services/apiClient";
import "./InterviewSchedulingPage.css";

const emptySchedule = { applicationId: "", scheduledAt: "", durationMinutes: "45", notes: "" };
const dateLabel = (value) => value ? new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "Date unavailable";
const dateTimeLabel = (value) => value ? new Date(value).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "Time unavailable";
const initials = (value) => String(value || "Candidate").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
const scoreLabel = (application) => application.matchScore ? `${Number(application.matchScore.percentage).toFixed(2)}% match` : "Pending score";

function ScheduledInterviewItem({ interview, navigate, cancelInterview }) {
  const applicant = interview.application?.applicant || {};
  return <article className="interview-upcoming-item" key={interview.id}><div className="interview-upcoming-item__date"><strong>{new Date(interview.scheduledAt).toLocaleDateString(undefined, { day: "2-digit" })}</strong><span>{new Date(interview.scheduledAt).toLocaleDateString(undefined, { month: "short" })}</span></div><div className="interview-upcoming-item__copy"><strong>{applicant.displayName || applicant.email || "Candidate"}</strong><span>{dateTimeLabel(interview.scheduledAt)} Â· {interview.durationMinutes} min</span></div><div className="interview-upcoming-item__actions"><button type="button" onClick={() => navigate(`/interviews/${interview.id}`)}>Open interview room</button><button type="button" onClick={() => cancelInterview(interview.id)}>Cancel</button></div></article>;
}

function ScheduledInterviewGroups({ groups, navigate, cancelInterview }) {
  return <div className="interview-upcoming-groups">{groups.map((group) => <section className="interview-upcoming-group" key={group.key}><header className="interview-upcoming-group__header"><div><span>Job vacancy schedule</span><h3>{group.title}</h3><p>{group.company}{group.location ? ` Â· ${group.location}` : ""}</p></div><strong>{group.interviews.length} planned</strong></header><div className="interview-upcoming-list">{group.interviews.map((interview) => <ScheduledInterviewItem key={interview.id} interview={interview} navigate={navigate} cancelInterview={cancelInterview} />)}</div></section>)}</div>;
}

function InterviewSchedulingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [form, setForm] = useState(emptySchedule);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([getAdminJobs(), getAdminApplications(), getAdminInterviews()])
      .then(([jobsResult, applicationsResult, interviewsResult]) => {
        if (!mounted) return;

        if (jobsResult.status === "fulfilled") {
          setJobs(Array.isArray(jobsResult.value.data) ? jobsResult.value.data : []);
        }
        if (applicationsResult.status === "fulfilled") {
          setApplications(Array.isArray(applicationsResult.value.data) ? applicationsResult.value.data : []);
        }
        if (interviewsResult.status === "fulfilled") {
          setInterviews(Array.isArray(interviewsResult.value.data) ? interviewsResult.value.data : []);
        }

        const coreFailure = [jobsResult, applicationsResult].find((result) => result.status === "rejected");
        if (coreFailure) {
          setError(coreFailure.reason?.message || "Could not load job opportunities.");
        } else if (interviewsResult.status === "rejected") {
          setError("Interview records are temporarily unavailable. Restart the gateway and job service to enable saved schedules.");
        }
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const jobRows = useMemo(() => {
    const byJob = applications.reduce((groups, application) => {
      const list = groups.get(application.jobId) || [];
      list.push(application);
      groups.set(application.jobId, list);
      return groups;
    }, new Map());
    return [...jobs].map((job) => {
      const jobApplications = (byJob.get(job.id) || []).filter((application) => application.status !== "rejected");
      const scheduled = interviews.filter((interview) => interview.jobId === job.id && interview.status === "scheduled");
      return { ...job, applications: jobApplications, scheduled };
    }).sort((first, second) => (second.applications.length - first.applications.length) || (second.status === "open" ? 1 : 0) - (first.status === "open" ? 1 : 0) || new Date(second.createdAt || 0) - new Date(first.createdAt || 0));
  }, [applications, interviews, jobs]);

  const selectedJob = jobRows.find((job) => job.id === selectedJobId) || null;
  const selectedApplication = selectedJob?.applications.find((application) => application.id === form.applicationId) || null;
  const scheduledInterviews = useMemo(() => interviews.filter((interview) => interview.status === "scheduled").sort((first, second) => new Date(first.scheduledAt) - new Date(second.scheduledAt)), [interviews]);
  const scheduledGroups = useMemo(() => {
    const groups = new Map();
    scheduledInterviews.forEach((interview) => {
      const key = interview.job?.id || interview.jobId || interview.job?.title || "unknown-job";
      const group = groups.get(key) || { key, title: interview.job?.title || "Unassigned job vacancy", company: interview.job?.company || "Hiring team", location: interview.job?.location || "", interviews: [] };
      group.interviews.push(interview);
      groups.set(key, group);
    });
    return [...groups.values()];
  }, [scheduledInterviews]);

  const openJob = (job) => {
    setSelectedJobId(job.id);
    setForm({ ...emptySchedule, applicationId: "" });
    setMessage("");
    setError("");
    window.requestAnimationFrame(() => document.getElementById("interview-schedule-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const updateForm = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submitSchedule = async (event) => {
    event.preventDefault();
    if (!selectedJob || !form.applicationId || !form.scheduledAt) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await createAdminInterview({
        jobId: selectedJob.id,
        applicationId: form.applicationId,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        durationMinutes: Number(form.durationMinutes),
        notes: form.notes,
      });
      setInterviews((current) => [response.data, ...current]);
      setForm((current) => ({ ...current, scheduledAt: "", notes: "" }));
      setMessage("Interview scheduled and saved successfully.");
    } catch (requestError) {
      setError(requestError.message || "Could not schedule this interview.");
    } finally {
      setSaving(false);
    }
  };

  const cancelInterview = async (interviewId) => {
    setError("");
    try {
      const response = await updateAdminInterview(interviewId, { status: "cancelled" });
      setInterviews((current) => current.map((interview) => interview.id === interviewId ? response.data : interview));
    } catch (requestError) {
      setError(requestError.message || "Could not cancel this interview.");
    }
  };

  if (user?.role !== "admin") return <Navigate to="/matching" replace />;

  const navigateFromSidebar = (view) => {
    if (view === "admin") return navigate("/admin");
    if (view === "admin-jobs") return navigate("/admin/jobs");
    if (view === "admin-applications") return navigate("/admin/applications");
    if (view === "admin-interview-results") return navigate("/admin/interview-results");
    if (view === "matcher") return navigate("/matching");
    navigate("/admin/interviews");
  };

  return (
    <div className="cv-app-shell admin-app-shell">
      <CvNavigation isOpen={navigationOpen} activeView="admin-interviews" onNavigate={navigateFromSidebar} onClose={() => setNavigationOpen(false)} />
      <div className="cv-app-shell__main admin-app-shell__main">
        <CvTopbar activeView="admin-interviews" onMenuToggle={() => setNavigationOpen(true)} />
        <main className="interview-scheduling-page">
          <div className="interview-scheduling-page__container">
            <header className="interview-scheduling-hero">
              <div><span className="interview-eyebrow"><i /><Icon name="calendar" size={13} /> Hiring coordination</span><h1>Interview scheduling</h1><p>Choose a job opportunity first, then schedule the right candidates into a clear interview plan.</p></div>
              <div className="interview-hero-stat"><strong>{scheduledInterviews.length}</strong><span>Upcoming interviews</span></div>
            </header>

            {error && <p className="interview-message interview-message--error" role="alert"><Icon name="alert" size={15} />{error}</p>}
            {message && <p className="interview-message interview-message--success" role="status"><Icon name="check" size={15} />{message}</p>}

            <section className="interview-opportunities" aria-labelledby="interview-opportunities-title">
              <div className="interview-section-heading"><div><span className="interview-overline">01 Â· Start with a role</span><h2 id="interview-opportunities-title">Job opportunities</h2><p>Open a job to see its applicants and schedule interviews.</p></div><span className="interview-count">{jobRows.length} roles</span></div>
              {loading ? <div className="interview-empty"><span className="interview-loader" />Loading job opportunities...</div> : jobRows.length === 0 ? <div className="interview-empty"><Icon name="briefcase" size={26} /><strong>No job opportunities yet</strong><span>Publish a job post before planning interviews.</span></div> : <div className="interview-job-grid">{jobRows.map((job) => <article className={`interview-job-card ${selectedJobId === job.id ? "interview-job-card--selected" : ""}`} key={job.id}><div className="interview-job-card__top"><span className={`interview-job-status interview-job-status--${job.status}`}>{job.status === "open" ? "Accepting applications" : "Closed"}</span><span>{dateLabel(job.createdAt)}</span></div><h3>{job.title}</h3><p>{job.company}{job.location ? ` Â· ${job.location}` : ""}</p><div className="interview-job-card__meta"><span><Icon name="people" size={13} />{job.applications.length} candidate{job.applications.length === 1 ? "" : "s"}</span><span><Icon name="calendar" size={13} />{job.scheduled.length} scheduled</span></div><button className="interview-job-card__action" type="button" onClick={() => openJob(job)} disabled={!job.applications.length}>{job.applications.length ? "Schedule interviews" : "No applicants yet"}<Icon name="arrowRight" size={15} /></button></article>)}</div>}
            </section>

            {selectedJob && <section className="interview-schedule-layout" id="interview-schedule-panel" aria-labelledby="schedule-panel-title">
              <div className="interview-candidate-panel">
                <div className="interview-section-heading"><div><span className="interview-overline">02 Â· Applications for this job</span><h2 id="schedule-panel-title">{selectedJob.title}</h2><p>{selectedJob.company}{selectedJob.location ? ` Â· ${selectedJob.location}` : ""} Â· {selectedJob.applications.length} application{selectedJob.applications.length === 1 ? "" : "s"}</p></div><button className="interview-close-button" type="button" onClick={() => setSelectedJobId("")} aria-label="Close scheduling panel"><Icon name="close" size={16} /></button></div>
                {selectedJob.applications.map((application) => { const applicant = application.applicant || {}; const hasScheduled = interviews.some((interview) => interview.applicationId === application.id && interview.status === "scheduled"); return <button className={`interview-candidate ${form.applicationId === application.id ? "interview-candidate--selected" : ""}`} type="button" key={application.id} onClick={() => setForm((current) => ({ ...current, applicationId: application.id }))}><span className="interview-candidate__avatar">{initials(applicant.displayName || applicant.email)}</span><span className="interview-candidate__copy"><strong>{applicant.displayName || applicant.email || "Candidate"}</strong><small>{applicant.email || "No email provided"}</small></span><span className="interview-candidate__fit">{scoreLabel(application)}{hasScheduled && <b>Scheduled</b>}</span></button>; })}
              </div>
              <form className="interview-form-card" onSubmit={submitSchedule}>
                <div className="interview-form-card__heading"><span className="interview-overline">03 Â· Plan the conversation</span><h2>Schedule interview</h2><p>{selectedApplication ? `For ${selectedApplication.applicant?.displayName || selectedApplication.applicant?.email || "selected candidate"}` : "Select a candidate to continue."}</p></div>
                <div className="interview-form-grid"><label>Date and time<input name="scheduledAt" type="datetime-local" value={form.scheduledAt} onChange={updateForm} required disabled={!selectedApplication} /></label><label>Duration<select name="durationMinutes" value={form.durationMinutes} onChange={updateForm} disabled={!selectedApplication}><option value="30">30 minutes</option><option value="45">45 minutes</option><option value="60">60 minutes</option><option value="90">90 minutes</option></select></label></div>
                <div className="interview-internal-room-note"><Icon name="shield" size={16} /><span><strong>Private MatchOS room</strong><small>Both people join from their own workspace. No external meeting account or link is required.</small></span></div>
                <label>Interview notes <span>optional</span><textarea name="notes" value={form.notes} onChange={updateForm} rows="4" placeholder="Add interview focus areas or preparation notes." disabled={!selectedApplication} /></label>
                <button className="interview-primary-button" type="submit" disabled={saving || !selectedApplication}>{saving ? "Saving interview..." : "Save interview schedule"}<Icon name="arrowRight" size={15} /></button>
              </form>
            </section>}

            <section className="interview-upcoming" aria-labelledby="upcoming-interviews-title"><div className="interview-section-heading"><div><span className="interview-overline">04 - Keep the plan visible</span><h2 id="upcoming-interviews-title">Upcoming interviews</h2><p>Scheduled conversations grouped by job vacancy.</p></div><span className="interview-count">{scheduledInterviews.length} planned</span></div>{scheduledInterviews.length === 0 ? <div className="interview-empty interview-empty--compact"><Icon name="clock" size={23} /><strong>No interviews scheduled</strong><span>Select a job opportunity above to create the first interview slot.</span></div> : <ScheduledInterviewGroups groups={scheduledGroups} navigate={navigate} cancelInterview={cancelInterview} />}<p className="interview-audio-note"><Icon name="info" size={14} />For clear audio, use separate devices or headphones. On one device, only one interview tab should use the microphone.</p></section>
          </div>
        </main>
      </div>
    </div>
  );
}

export default InterviewSchedulingPage;
