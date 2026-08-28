import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Icon from "../../components/common/Icon";
import CvNavigation from "../../components/layout/CvNavigation";
import CvTopbar from "../../components/layout/CvTopbar";
import ResumeStrengthSummary from "../../components/resume/ResumeStrengthSummary";
import { useAuth } from "../../context/AuthContext";
import { analyzeCvProfile, getMyProfile } from "../../services/apiClient";
import "./SkillAnalysisPage.css";

function SkillAnalysisPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Reading your saved CV profile.");
  const [error, setError] = useState("");
  const [navigationOpen, setNavigationOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      try {
        const response = await getMyProfile();
        let nextProfile = response.data || null;
        const cv = nextProfile?.cv;
        const explanationMissing = cv?.rawText && cv?.profileAnalysis?.explainability?.status !== "live";
        const modelOutputMissing = cv?.rawText && cv?.profileAnalysis?.model?.status === "live"
          && cv.profileAnalysis.skills?.some((skill) => skill.modelAlignmentLevel == null || skill.modelVersion == null);

        if (explanationMissing || modelOutputMissing) {
          setLoadingMessage("Generating CV-grounded explanations with Gemini.");
          try {
            const analysisResponse = await analyzeCvProfile(cv.rawText, cv.candidate || {});
            nextProfile = { ...nextProfile, cv: { ...cv, profileAnalysis: analysisResponse.data } };
          } catch {
            // Keep the saved model result visible if Gemini is temporarily unavailable.
          }
        }

        if (mounted) setProfile(nextProfile);
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
              : <ResumeStrengthSummary analysis={profile.cv.profileAnalysis || null} fallbackProjects={savedProjects} variant="skill-analysis" />}
      </div></main>
    </div>
  </div>;
}

export default SkillAnalysisPage;
