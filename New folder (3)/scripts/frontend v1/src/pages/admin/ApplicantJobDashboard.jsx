import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import CvNavigation from "../../components/layout/CvNavigation";
import CvTopbar from "../../components/layout/CvTopbar";
import ApplicantInterviewStatus from "../../components/admin/ApplicantInterviewStatus";
import ApplicantJobResults from "../../components/admin/ApplicantJobResults";
import { getAdminApplications, getAdminJobs } from "../../services/apiClient";
import { loadRankedApplicants } from "../../services/applicantRankingService";
import { jobKey } from "../../components/admin/applicationBoardUtils";
import "./AdminDashboardPage.css";
import "./ApplicantJobDashboard.css";

const destinations = { admin: "/admin", "admin-jobs": "/admin/jobs", "admin-applications": "/admin/applications", "admin-interviews": "/admin/interviews", "admin-interview-results": "/admin/interview-results" };

function ApplicantJobDashboard() {
  const { user } = useAuth();
  const { jobId, applicationId } = useParams();
  const navigate = useNavigate();
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [application, setApplication] = useState(null);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.role !== "admin") return;
    let mounted = true;
    setLoading(true); setError(""); setApplication(null); setJob(null);
    async function load() {
      try {
        const [jobs, applications] = await Promise.all([getAdminJobs(), getAdminApplications()]);
        const selectedJob = (jobs.data || []).find((item) => String(item.id) === jobId);
        const selected = (applications.data || []).find((item) => String(item.id) === applicationId && String(jobKey(item)) === jobId);
        if (!selectedJob || !selected) throw new Error("Application not found for this job.");
        const results = await loadRankedApplicants([selected], selectedJob, () => mounted);
        if (!mounted) return;
        setJob(selectedJob); setApplication(results.applications[0]);
        if (results.incomplete) setError("Some model results are unavailable. Available results are shown below.");
      } catch (requestError) {
        if (mounted) setError(requestError.message || "Could not load this applicant dashboard.");
      } finally { if (mounted) setLoading(false); }
    }
    load();
    return () => { mounted = false; };
  }, [jobId, applicationId, user?.role]);

  if (user?.role !== "admin") return <Navigate to="/matching" replace />;
  return <div className="cv-app-shell admin-app-shell">
    <CvNavigation isOpen={navigationOpen} activeView="admin-jobs" onNavigate={(view) => navigate(destinations[view] || "/matching")} onClose={() => setNavigationOpen(false)} />
    <div className="cv-app-shell__main admin-app-shell__main">
      <CvTopbar activeView="admin-jobs" onMenuToggle={() => setNavigationOpen(true)} />
      <main className="admin-page applicant-job-dashboard"><div className="admin-page__container">
        <Link to={`/admin/jobs/${encodeURIComponent(jobId)}`} className="applicant-job-dashboard__back">← Back to job applicants</Link>
        {error && <p className="applicant-job-dashboard__error" role="alert">{error}</p>}
        {loading && <p role="status">Loading CV matching and skill model results...</p>}
        {!loading && application && job && <><ApplicantJobResults application={application} job={job} /><ApplicantInterviewStatus application={application} job={job} /></>}
      </div></main>
    </div>
  </div>;
}

export default ApplicantJobDashboard;
