import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Icon from "../../components/common/Icon";
import CvNavigation from "../../components/layout/CvNavigation";
import CvTopbar from "../../components/layout/CvTopbar";
import ResumeStrengthSummary from "../../components/resume/ResumeStrengthSummary";
import { useAuth } from "../../context/AuthContext";
import { loadSkillAnalysis } from "../../services/skillAnalysisService";
import "./SkillAnalysisPage.css";

function SkillAnalysisPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Reading your saved CV profile.");
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [navigationOpen, setNavigationOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      try {
        const result = await loadSkillAnalysis((message) => { if (mounted) setLoadingMessage(message); });
        if (mounted) { setProfile(result.profile); setWarning(result.warning); }
      } catch (requestError) {
        if (mounted) setError(requestError.message || "Could not load your skill analysis.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProfile();
    return () => { mounted = false; };
  }, []);

  const navigateFromSidebar = (view) => navigate(
    view === "jobs" ? "/jobs"
      : view === "interviews" ? "/interviews"
        : view === "profile" ? "/profile"
          : view === "skill-analysis" ? "/skill-analysis"
            : "/jobs",
  );

  const savedProjects = Array.isArray(profile?.cv?.candidate?.projects) ? profile.cv.candidate.projects : [];
  const profilePhoto = profile?.profilePhoto || "";

  if (user?.role === "admin") return <Navigate to="/admin" replace />;

  return <div className="cv-app-shell skill-analysis-shell">
    <CvNavigation isOpen={navigationOpen} activeView="skill-analysis" onNavigate={navigateFromSidebar} onClose={() => setNavigationOpen(false)} />
    <div className="cv-app-shell__main skill-analysis-shell__main">
      <CvTopbar activeView="skill-analysis" profilePhoto={profilePhoto} onMenuToggle={() => setNavigationOpen(true)} />
      <main className="skill-analysis-page"><div className="skill-analysis-page__container">
        {loading ? <div className="skill-analysis-state"><span className="skill-analysis-loader" /><strong>Loading your skill analysis...</strong><span>{loadingMessage}</span></div>
          : error ? <div className="skill-analysis-state skill-analysis-state--error"><Icon name="alert" size={25} /><strong>Could not load skill analysis</strong><span>{error}</span><button type="button" onClick={() => window.location.reload()}>Try again</button></div>
            : !profile?.cv ? <div className="skill-analysis-state"><Icon name="activity" size={28} /><strong>Upload a CV to unlock skill analysis</strong><span>Your evidence-based profile will appear here after you upload and save your CV.</span><button type="button" onClick={() => navigate("/profile")}>Go to my profile <Icon name="arrowRight" size={14} /></button></div>
              : <>{warning && <div className="skill-analysis-state skill-analysis-state--error" role="alert"><span>{warning}</span><button type="button" onClick={() => window.location.reload()}>Try again</button></div>}
                {!profile.cv.rawText?.trim() || !profile.cv.profileAnalysis?.skills?.length
                  ? <div className="skill-analysis-state"><Icon name="activity" size={28} /><strong>No skill analysis is available yet</strong><span>Upload and save a CV with readable skills, projects and experience to generate model scores.</span><button type="button" onClick={() => navigate("/profile")}>Review my CV <Icon name="arrowRight" size={14} /></button></div>
                  : <ResumeStrengthSummary analysis={profile.cv.profileAnalysis} fallbackProjects={savedProjects} variant="skill-analysis" />}</>}
      </div></main>
    </div>
  </div>;
}

export default SkillAnalysisPage;
