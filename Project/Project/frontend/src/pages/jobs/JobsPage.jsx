import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import CvNavigation from "../../components/layout/CvNavigation";
import CvTopbar from "../../components/layout/CvTopbar";
import Icon from "../../components/common/Icon";
import { useAuth } from "../../context/AuthContext";
import { getMyApplications, getMyInterviews, getMyProfile, getOpenJobs } from "../../services/apiClient";
import { toMatcherCandidate } from "../../utils/candidateProfile";
import "./JobsPage.css";

const dateLabel = (value) => value ? new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "";
const dateTimeLabel = (value) => value ? new Date(value).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "Time unavailable";

function JobsPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [candidate, setCandidate] = useState(toMatcherCandidate());
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || "");
  const [profileReady, setProfileReady] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([getOpenJobs(), getMyApplications(), getMyProfile(), getMyInterviews()])
      .then(([jobsResult, applicationsResult, profileResult, interviewsResult]) => {
        if (!mounted) return;
        if (jobsResult.status === "fulfilled") setJobs(Array.isArray(jobsResult.value.data) ? jobsResult.value.data : []);
        if (applicationsResult.status === "fulfilled") setApplications(Array.isArray(applicationsResult.value.data) ? applicationsResult.value.data : []);
        if (profileResult.status === "fulfilled") {
          const savedPhoto = profileResult.value.data?.profilePhoto || "";
          setProfilePhoto(savedPhoto);
          updateUser({ profilePhoto: savedPhoto });
          setCandidate(toMatcherCandidate(profileResult.value.data?.cv?.candidate));
          setProfileReady(true);
        }
        if (interviewsResult.status === "fulfilled") setInterviews(Array.isArray(interviewsResult.value.data) ? interviewsResult.value.data : []);
        const failedResult = [jobsResult, applicationsResult, profileResult].find((result) => result.status === "rejected");
        if (failedResult) setError(failedResult.reason?.message || "Could not load open jobs.");
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const filteredJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return jobs;
    return jobs.filter((job) => [job.title, job.company, job.location, job.industry, ...(job.mustHaveSkills || [])].join(" ").toLowerCase().includes(normalizedQuery));
  }, [jobs, query]);

  const appliedJobIds = new Set(applications.map((application) => application.jobId));
  const upcomingInterviews = useMemo(() => interviews.filter((interview) => interview.status === "scheduled" && new Date(interview.scheduledAt).getTime() >= Date.now()).sort((first, second) => new Date(first.scheduledAt) - new Date(second.scheduledAt)), [interviews]);
  const candidateHasProfile = Object.values(candidate).some(Boolean);
  const navigateFromSidebar = (view) => navigate(view === "jobs" ? "/jobs" : view === "interviews" ? "/interviews" : view === "profile" ? "/profile" : view === "skill-analysis" ? "/skill-analysis" : "/jobs");

  if (user?.role === "admin") return <Navigate to="/admin" replace />;

  return <div className="cv-app-shell jobs-app-shell">
    <CvNavigation isOpen={navigationOpen} activeView="jobs" onNavigate={navigateFromSidebar} onClose={() => setNavigationOpen(false)} />
    <div className="cv-app-shell__main jobs-app-shell__main">
      <CvTopbar activeView="jobs" profilePhoto={profilePhoto} monochrome onMenuToggle={() => setNavigationOpen(true)} />
      <main className="jobs-page"><div className="jobs-page__container">
        <header className="jobs-hero"><div><span className="jobs-eyebrow"><i /> Opportunities</span><h1>Find a role that fits your next chapter.</h1><p>Explore jobs published by the hiring team. Your saved CV profile is ready to use when you find the right opportunity.</p></div><div className="jobs-hero__profile"><span className={profilePhoto ? "jobs-hero__profile-avatar jobs-hero__profile-avatar--photo" : "jobs-hero__profile-avatar"}>{profilePhoto ? <img src={profilePhoto} alt="Your profile" /> : (user?.displayName || "User").slice(0, 1).toUpperCase()}</span><div><small>Signed in as</small><strong>{user?.displayName}</strong></div></div></header>
        <section className="jobs-overview" aria-label="Jobs overview"><div><strong>{jobs.length}</strong><span>Open roles</span></div><div><strong>{applications.length}</strong><span>My applications</span></div><div><strong>{profileReady ? (candidateHasProfile ? "Ready" : "Missing") : "Loading"}</strong><span>CV profile</span></div></section>
        {upcomingInterviews.length > 0 && <section className="jobs-interviews-panel" aria-labelledby="my-interviews-title"><div className="jobs-interviews-panel__heading"><div><span className="jobs-eyebrow"><i /> Your interview plan</span><h2 id="my-interviews-title">Upcoming interviews</h2><p>Join your scheduled conversation from the same secure room as the hiring team.</p></div><span className="jobs-interviews-panel__count">{upcomingInterviews.length} planned</span></div><div className="jobs-interviews-list">{upcomingInterviews.map((interview) => <article className="jobs-interview-card" key={interview.id}><div className="jobs-interview-card__date"><strong>{new Date(interview.scheduledAt).toLocaleDateString(undefined, { day: "2-digit" })}</strong><span>{new Date(interview.scheduledAt).toLocaleDateString(undefined, { month: "short" })}</span></div><div className="jobs-interview-card__copy"><strong>{interview.job?.title || "Interview"}</strong><span>{interview.job?.company || "Hiring team"} · {dateTimeLabel(interview.scheduledAt)} · {interview.durationMinutes} min</span>{interview.notes && <small>{interview.notes}</small>}</div><button className="jobs-interview-card__join" type="button" onClick={() => navigate(`/interviews/${interview.id}`)}><Icon name="arrowRight" size={14} />Open interview room</button></article>)}</div><p className="jobs-interviews-panel__note"><Icon name="info" size={14} />For clear audio, join from separate devices or use headphones. If both participants are on one device, only one browser tab should use the microphone.</p></section>}
        <div className="jobs-toolbar"><div><span className="jobs-eyebrow">Open positions</span><h2>Roles for you</h2></div><label className="jobs-search"><Icon name="search" size={16} /><span className="sr-only">Search open jobs</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by title, company or skill" /></label></div>
        {error && <p className="jobs-message jobs-message--error" role="alert">{error}</p>}
        {loading ? <div className="jobs-empty"><span className="jobs-loader" />Loading open roles...</div> : filteredJobs.length === 0 ? <div className="jobs-empty"><Icon name="briefcase" size={27} /><strong>{query ? "No roles match your search" : "No open jobs yet"}</strong><span>{query ? "Try a different title, company, or skill." : "New opportunities posted by the hiring team will appear here."}</span>{query && <button type="button" onClick={() => setQuery("")}>Clear search</button>}</div> : <div className="jobs-grid">{filteredJobs.map((job) => { const applied = appliedJobIds.has(job.id); return <article className="job-card" key={job.id}><div className="job-card__top"><span className="job-card__status"><i />Open</span><span>{dateLabel(job.createdAt)}</span></div><h3>{job.title}</h3><p className="job-card__company">{job.company}{job.location ? ` · ${job.location}` : ""}</p><div className="job-card__tags"><span>{job.employmentType || "Full-time"}</span>{job.seniority && <span>{job.seniority}</span>}{job.industry && <span>{job.industry}</span>}</div>{job.description && <p className="job-card__description">{job.description}</p>}{job.mustHaveSkills?.length > 0 && <div className="job-card__skills">{job.mustHaveSkills.slice(0, 4).map((skill) => <span key={skill}>{skill}</span>)}{job.mustHaveSkills.length > 4 && <span>+{job.mustHaveSkills.length - 4}</span>}</div>}<div className="job-card__footer"><span>{applied ? "Application sent" : "Ready to apply?"}</span><button className={applied ? "job-card__apply job-card__apply--sent" : "job-card__apply"} type="button" onClick={() => !applied && navigate(`/jobs/apply/${job.id}`)} disabled={applied}>{applied ? "Applied" : "View & apply"}<Icon name="arrowRight" size={15} /></button></div></article>; })}</div>}
      </div></main>
    </div>
  </div>;
}

export default JobsPage;
