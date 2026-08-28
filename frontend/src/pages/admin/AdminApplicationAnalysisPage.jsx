import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import AdminApplicationAnalysisView from "./AdminApplicationAnalysisView";
import CvNavigation from "../../components/layout/CvNavigation";
import CvTopbar from "../../components/layout/CvTopbar";
import Icon from "../../components/common/Icon";
import { useAuth } from "../../context/AuthContext";
import { defaultSimulation } from "../../data/demoCandidate";
import { getAttritionAssessment } from "../../services/attritionService";
import { getAdminApplicationCvContext, getAdminApplications, updateAdminApplicationScore } from "../../services/apiClient";
import { scoreMatch } from "../../services/matchingService";
import { generateMatchAnalysis } from "../../utils/matchingAnalysis";
import "./AdminApplicationAnalysisPage.css";

const asText = (value) => Array.isArray(value) ? value.join(", ") : String(value || "");
const toAnalysisJob = (job = {}, application = {}) => ({
  jobTitle: job.title || application.jobTitle || "",
  jobSeniority: job.seniority || "",
  jobIndustry: job.industry || "",
  mustHaveSkills: asText(job.mustHaveSkills),
  niceToHaveSkills: asText(job.niceToHaveSkills),
  jobDescription: job.description || "",
  responsibilities: job.responsibilities || "",
  requirements: job.requirements || "",
});

const toAnalysisCandidate = (candidate = {}) => ({
  candidateRole: candidate.candidateRole || candidate.role || "",
  candidateSeniority: candidate.candidateSeniority || candidate.seniority || "",
  yearsExperience: candidate.yearsExperience ? String(candidate.yearsExperience) : "",
  candidateIndustry: candidate.candidateIndustry || candidate.industry || "",
  education: candidate.education || "",
  candidateSkills: asText(candidate.candidateSkills || candidate.skills),
  summary: candidate.summary || "",
  experienceBullets: asText(candidate.experienceBullets || candidate.experienceHighlights),
  compensation: candidate.compensation,
  engagement: candidate.engagement,
  history: candidate.history,
});

const initials = (value) => String(value || "Candidate").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

function AdminApplicationAnalysisPage() {
  const { user } = useAuth();
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [application, setApplication] = useState(null);
  const [analysisJob, setAnalysisJob] = useState(null);
  const [analysisCandidate, setAnalysisCandidate] = useState(null);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retentionSimulation, setRetentionSimulation] = useState(defaultSimulation);
  const [retentionRisk, setRetentionRisk] = useState(null);
  const [baselineRetentionRisk, setBaselineRetentionRisk] = useState(null);
  const [retentionError, setRetentionError] = useState("");
  const [retentionLoading, setRetentionLoading] = useState(false);
  const [retentionCvText, setRetentionCvText] = useState("");
  const retentionRequestRef = useRef(0);

  useEffect(() => {
    let mounted = true;
    const loadApplication = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await getAdminApplications();
        const selected = (response.data || []).find((item) => item.id === applicationId);
        if (!selected) throw new Error("Application not found.");
        const nextJob = toAnalysisJob(selected.job, selected);
        const nextCandidate = toAnalysisCandidate(selected.candidate);
        if (!mounted) return;
        setApplication(selected);
        setAnalysisJob(nextJob);
        setAnalysisCandidate(nextCandidate);
        setScore(selected.matchScore || null);
        getAdminApplicationCvContext(selected.id).then((contextResponse) => {
          if (mounted) setRetentionCvText(contextResponse.data?.rawText || "");
        }).catch(() => {});
        try {
          const nextScore = await scoreMatch(nextJob, nextCandidate);
          if (!mounted) return;
          setScore(nextScore);
          try {
            const saved = await updateAdminApplicationScore(selected.id, nextScore);
            if (mounted && saved.data) setApplication(saved.data);
          } catch {
          }
        } catch (scoreError) {
          if (mounted) {
            setScore(selected.matchScore || null);
          }
        }
      } catch (requestError) {
        if (mounted) setError(requestError.message || "Could not load this application.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadApplication();
    return () => { mounted = false; };
  }, [applicationId]);

  const analysis = useMemo(() => analysisJob && analysisCandidate ? generateMatchAnalysis(analysisJob, analysisCandidate, score) : { strengths: [], actions: [], gaps: [] }, [analysisJob, analysisCandidate, score]);
  const applicant = application?.applicant || {};
  const job = application?.job || {};
  const candidate = application?.candidate || {};
  const retentionContext = useMemo(() => ({ cvText: retentionCvText, job: analysisJob || job }), [retentionCvText, analysisJob, job]);
  const retentionCandidate = useMemo(() => {
    if (!analysisCandidate) return null;
    return {
      ...analysisCandidate,
      displayName: applicant.displayName || applicant.email || "this candidate",
      compensation: analysisCandidate.compensation || { current: 0, market: 0, currency: "USD" },
      engagement: analysisCandidate.engagement || { remotePreference: "hybrid", currentWorkModel: "hybrid" },
      ...(score?.probability !== undefined ? { matchProbability: score.probability } : {}),
    };
  }, [analysisCandidate, applicant.displayName, applicant.email, score]);

  useEffect(() => {
    if (!retentionCandidate) return undefined;
    let mounted = true;
    const requestNumber = retentionRequestRef.current + 1;
    retentionRequestRef.current = requestNumber;
    const timer = window.setTimeout(() => {
      if (!mounted) return;
      setRetentionLoading(true);
      setRetentionError("");
      getAttritionAssessment(retentionCandidate, retentionSimulation, retentionContext)
        .then((response) => {
          if (mounted && requestNumber === retentionRequestRef.current) {
            setRetentionRisk(response);
            setRetentionLoading(false);
          }
        })
        .catch((requestError) => {
          if (mounted && requestNumber === retentionRequestRef.current) {
            setRetentionLoading(false);
            setRetentionError(requestError.message || "Live retention analysis is unavailable.");
          }
        });
    }, 220);
    return () => { mounted = false; window.clearTimeout(timer); };
  }, [retentionCandidate, retentionSimulation, retentionContext]);

  useEffect(() => {
    if (!retentionCandidate) return undefined;
    let mounted = true;
    getAttritionAssessment(retentionCandidate, defaultSimulation, retentionContext)
      .then((response) => mounted && setBaselineRetentionRisk(response))
      .catch(() => mounted && setBaselineRetentionRisk(null));
    return () => { mounted = false; };
  }, [retentionCandidate, retentionContext]);

  if (user?.role !== "admin") return <Navigate to="/matching" replace />;

  const navigateFromSidebar = (view) => {
    if (view === "matcher") return navigate("/matching");
    if (view === "admin-jobs") return navigate("/admin/jobs");
    if (view === "admin") return navigate("/admin");
    if (view === "admin-interviews") return navigate("/admin/interviews");
    if (view === "admin-interview-results") return navigate("/admin/interview-results");
    navigate("/admin/applications");
  };

  return (
    <div className="cv-app-shell admin-app-shell">
      <CvNavigation isOpen={navigationOpen} activeView="admin-applications" onNavigate={navigateFromSidebar} onClose={() => setNavigationOpen(false)} />
      <div className="cv-app-shell__main admin-app-shell__main admin-app-shell__main--analysis">
        <CvTopbar activeView="admin-applications" onMenuToggle={() => setNavigationOpen(true)} />
        <main className="admin-analysis-page">
          <div className="admin-analysis-page__container">
            <button className="admin-analysis-page__back" type="button" onClick={() => navigate("/admin/applications")}><Icon name="arrowLeft" size={15} /> Back to applications</button>
            {loading && <div className="admin-analysis-state"><span className="admin-analysis-loader" /><strong>Loading application...</strong><span>Preparing the candidate retention analysis.</span></div>}
            {!loading && error && <div className="admin-analysis-state admin-analysis-state--error"><Icon name="alert" size={24} /><strong>Could not open this application</strong><span>{error}</span><button type="button" onClick={() => navigate("/admin/applications")}>Return to applications</button></div>}
             {!loading && application && analysisJob && analysisCandidate && <AdminApplicationAnalysisView application={application} applicant={applicant} candidate={candidate} job={job} analysis={analysis} score={score} retentionCandidate={retentionCandidate} retentionSimulation={retentionSimulation} retentionRisk={retentionRisk} baselineRetentionRisk={baselineRetentionRisk} retentionLoading={retentionLoading} retentionError={retentionError} onSimulationChange={setRetentionSimulation} onReset={() => setRetentionSimulation(defaultSimulation)} />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminApplicationAnalysisPage;
