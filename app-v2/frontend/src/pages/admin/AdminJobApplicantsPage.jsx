import JobPublisher from "../../components/jobs/JobPublisher";
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import CvNavigation from "../../components/layout/CvNavigation";
import CvTopbar from "../../components/layout/CvTopbar";
import Icon from "../../components/common/Icon";
import { initials, jobKey } from "../../components/admin/applicationBoardUtils";
import { useAuth } from "../../context/AuthContext";
import { getAdminJobs, getAdminApplications } from "../../services/apiClient";
import { loadRankedApplicants } from "../../services/applicantRankingService";
import "./AdminDashboardPage.css";
import "./AdminJobApplicantsPage.css";

const destinations = { admin: "/admin", "admin-jobs": "/admin/jobs", "admin-applications": "/admin/applications", "admin-interviews": "/admin/interviews", "admin-interview-results": "/admin/interview-results", matcher: "/matching" };

function AdminJobApplicantsPage() {
  const { user } = useAuth();
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.role !== "admin") return;
    let mounted = true;
    setLoading(true); setError(""); setJob(null); setApplications([]);
    Promise.all([getAdminJobs(), getAdminApplications()])
      .then(async ([jobsResponse, applicationsResponse]) => {
        if (!mounted) return;
        const selectedJob = (jobsResponse.data || []).find((item) => String(item.id) === jobId) || null;
        setJob(selectedJob);
        if (!selectedJob) return;
        const applicants = (applicationsResponse.data || []).filter((item) => String(jobKey(item)) === jobId);
        const ranked = await loadRankedApplicants(applicants, selectedJob, () => mounted);
        if (!mounted) return;
        setApplications(ranked.applications);
        if (ranked.incomplete) setError("Some model scores are unavailable. Applicants are ordered by available scores; unscored CVs appear last.");
      })
      .catch((requestError) => mounted && setError(requestError.message || "Could not load applicants for this job."))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [jobId, user?.role]);

  if (user?.role !== "admin") return <Navigate to="/matching" replace />;
  return <div className="cv-app-shell admin-app-shell">
    <CvNavigation isOpen={navigationOpen} activeView="admin-jobs" onNavigate={(view) => navigate(destinations[view] || "/admin")} onClose={() => setNavigationOpen(false)} />
    <div className="cv-app-shell__main admin-app-shell__main">
      <CvTopbar activeView="admin-jobs" onMenuToggle={() => setNavigationOpen(true)} />
      <main className="admin-page admin-job-applicants"><div className="admin-page__container">
        <Link className="admin-job-applicants__back" to="/admin/jobs">← Back to job posts</Link>
        {error && <p role="alert" className="admin-job-applicants__error">{error}</p>}
        {loading ? <p role="status">Ranking applicants by CV match and relevant skill evidence...</p> : job ? <>
          <header className="admin-job-applicants__header"><span>Job applicants</span><h1>{job.title}</h1><JobPublisher job={job} /><p>{[job.company, job.location, job.employmentType].filter(Boolean).join(" · ")}</p><strong>{applications.length} applicant{applications.length === 1 ? "" : "s"}</strong><small>{job.status === "open" ? "Accepting applications" : "Closed"}</small></header>
          <section className="admin-job-applicants__list" aria-label={`Applicants for ${job.title}`}>
            <div className="admin-job-applicants__list-heading"><h2>Applicants</h2><p>Select an applicant to view their CV, skills and job match.</p></div>
            {applications.length ? <ul className="admin-job-applicants__names">{applications.map((application) => {
              const applicant = application.applicant || {};
              const name = applicant.displayName || "Candidate";
              return <li key={application.id}><Link className="admin-job-applicants__person" to={`/admin/jobs/${encodeURIComponent(jobId)}/applicants/${encodeURIComponent(application.id)}`}>
                <span className="admin-job-applicants__photo">{applicant.profilePhoto ? <img src={applicant.profilePhoto} alt="" /> : initials(name)}</span>
                <span className="admin-job-applicants__person-info"><span>{name}</span><small>View applicant dashboard</small></span>
                <span className="admin-job-applicants__open" aria-hidden="true"><span>View profile</span><Icon name="chevronRight" size={18} /></span>
              </Link></li>;
            })}</ul> : <div className="admin-job-applicants__empty"><h2>No applicants yet</h2><p>Candidates who apply for this job will appear here.</p></div>}
          </section>
        </> : !error && <div className="admin-job-applicants__empty"><h1>Job not found</h1><p>This job post is no longer available.</p></div>}
      </div></main>
    </div>
  </div>;
}

export default AdminJobApplicantsPage;
