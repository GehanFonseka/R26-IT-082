import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import Icon from "../../components/common/Icon";
import CvNavigation from "../../components/layout/CvNavigation";
import CvTopbar from "../../components/layout/CvTopbar";
import ResumeStrengthSummary from "../../components/resume/ResumeStrengthSummary";
import { useAuth } from "../../context/AuthContext";
import { getAdminApplicationCvAnalysis, getAdminApplications } from "../../services/apiClient";
import "./AdminApplicationSkillsPage.css";

function AdminApplicationSkillsPage() {
  const { user } = useAuth();
  const { applicationId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [navigationOpen, setNavigationOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadAnalysis = async () => {
      try {
        const applicationsResponse = await getAdminApplications();
        const application = (applicationsResponse.data || []).find((item) => item.id === applicationId);
        if (!application) throw new Error("Application not found.");
        if (application.candidateAnalysis) {
          if (mounted) setAnalysis(application.candidateAnalysis);
          return;
        }
        const response = await getAdminApplicationCvAnalysis(applicationId);
        if (mounted) setAnalysis(response.data || null);
      } catch (requestError) {
        if (mounted) setError(requestError.message || "Could not load this candidate's skill analysis.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadAnalysis();
    return () => { mounted = false; };
  }, [applicationId]);

  const navigateFromSidebar = (view) => {
    if (view === "admin-jobs") return navigate("/admin/jobs");
    if (view === "admin") return navigate("/admin");
    if (view === "admin-interviews") return navigate("/admin/interviews");
    if (view === "admin-interview-results") return navigate("/admin/interview-results");
    navigate("/admin/applications");
  };

  const goBackToApplication = () => {
    if (location.key !== "default") return navigate(-1);
    navigate(applicationId ? `/admin/applications/${applicationId}` : "/admin/applications");
  };

  if (user?.role !== "admin") return <Navigate to="/matching" replace />;

  return <div className="cv-app-shell admin-skill-analysis-shell">
    <CvNavigation isOpen={navigationOpen} activeView="admin-applications" onNavigate={navigateFromSidebar} onClose={() => setNavigationOpen(false)} />
    <div className="cv-app-shell__main admin-skill-analysis-shell__main">
      <CvTopbar activeView="admin-applications" onMenuToggle={() => setNavigationOpen(true)} />
      <main className="admin-skill-analysis-page">
        <button className="admin-skill-analysis-page__back" type="button" onClick={goBackToApplication}><Icon name="arrowLeft" size={15} /> Back to application</button>
        {loading && <div className="admin-skill-analysis-state"><span className="admin-skill-analysis-loader" /><strong>Loading skill analysis...</strong><span>Reading the candidate CV evidence.</span></div>}
        {!loading && error && <div className="admin-skill-analysis-state admin-skill-analysis-state--error"><Icon name="alert" size={24} /><strong>Could not load skill analysis</strong><span>{error}</span><button type="button" onClick={() => navigate(`/admin/applications/${applicationId}`)}>Back to application</button></div>}
        {!loading && !error && analysis && <ResumeStrengthSummary analysis={analysis} variant="skill-analysis" />}
      </main>
    </div>
  </div>;
}

export default AdminApplicationSkillsPage;
