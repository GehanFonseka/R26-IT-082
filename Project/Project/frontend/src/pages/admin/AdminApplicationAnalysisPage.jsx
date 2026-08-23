import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import ApplicationComparison from "../../components/admin/ApplicationComparison";
import WhatIfSimulation from "../../components/attrition/WhatIfSimulation";
import CvNavigation from "../../components/layout/CvNavigation";
import CvTopbar from "../../components/layout/CvTopbar";
import Icon from "../../components/common/Icon";
import { useAuth } from "../../context/AuthContext";
import { defaultSimulation } from "../../data/demoCandidate";
import { getAttritionAssessment } from "../../services/attritionService";
import { getAdminApplications, updateAdminApplicationScore } from "../../services/apiClient";
import { MODEL_ID, scoreMatch } from "../../services/matchingService";
import { generateMatchAnalysis } from "../../utils/matchingAnalysis";
import "./AdminApplicationAnalysisPage.css";

const asText = (value) => Array.isArray(value) ? value.join(", ") : String(value || "");
const displayList = (value) => (Array.isArray(value) ? value : String(value || "").split(/[|,;\n]+/)).map((item) => String(item).trim()).filter(Boolean);
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
      getAttritionAssessment(retentionCandidate, retentionSimulation)
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
  }, [retentionCandidate, retentionSimulation]);

  useEffect(() => {
    if (!retentionCandidate) return undefined;
    let mounted = true;
    getAttritionAssessment(retentionCandidate, defaultSimulation)
      .then((response) => mounted && setBaselineRetentionRisk(response))
      .catch(() => mounted && setBaselineRetentionRisk(null));
    return () => { mounted = false; };
  }, [retentionCandidate]);

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
      <div className="cv-app-shell__main admin-app-shell__main">
        <CvTopbar activeView="admin-applications" onMenuToggle={() => setNavigationOpen(true)} />
        <main className="admin-analysis-page">
          <div className="admin-analysis-page__container">
            <button className="admin-analysis-page__back" type="button" onClick={() => navigate("/admin/applications")}><Icon name="arrowLeft" size={15} /> Back to applications</button>
            {loading && <div className="admin-analysis-state"><span className="admin-analysis-loader" /><strong>Loading application...</strong><span>Preparing the candidate retention analysis.</span></div>}
            {!loading && error && <div className="admin-analysis-state admin-analysis-state--error"><Icon name="alert" size={24} /><strong>Could not open this application</strong><span>{error}</span><button type="button" onClick={() => navigate("/admin/applications")}>Return to applications</button></div>}
            {!loading && application && analysisJob && analysisCandidate && <>
               <section className="admin-analysis-retention" aria-labelledby="retention-planning-title">
                 <div className="admin-analysis-retention__heading"><span>Separate attrition model analysis</span><h2 id="retention-planning-title">Retention planning</h2><p>This is a separate attrition scenario service. It does not change the CV match score or decide whether this applicant should be hired.</p></div>
                 <WhatIfSimulation candidate={retentionCandidate} simulation={retentionSimulation} features={retentionRisk} baselineFeatures={baselineRetentionRisk} loading={retentionLoading} error={retentionError} onSimulationChange={setRetentionSimulation} onReset={() => setRetentionSimulation(defaultSimulation)} />
               </section>
               <div className="admin-analysis-grid">
                <section className="admin-analysis-card"><div className="admin-analysis-card__heading"><div><span>Candidate evidence</span><h2>CV profile snapshot</h2></div><span className="admin-analysis-card__badge"><Icon name="check" size={13} /> Reviewed</span></div><dl className="admin-analysis-fields"><div><dt>Role</dt><dd>{candidate.candidateRole || candidate.role || "Not provided"}</dd></div><div><dt>Seniority</dt><dd>{candidate.candidateSeniority || candidate.seniority || "Not provided"}</dd></div><div><dt>Experience</dt><dd>{candidate.yearsExperience ? `${candidate.yearsExperience} years` : "Not provided"}</dd></div><div><dt>Industry</dt><dd>{candidate.candidateIndustry || candidate.industry || "Not provided"}</dd></div><div><dt>Education</dt><dd>{candidate.education || "Not provided"}</dd></div></dl><span className="admin-analysis-label">Skills</span><div className="admin-analysis-chips">{displayList(candidate.candidateSkills || candidate.skills).length ? displayList(candidate.candidateSkills || candidate.skills).map((skill) => <span key={skill}>{skill}</span>) : <small>Not provided</small>}</div>{candidate.summary && <div className="admin-analysis-copy"><span>Professional summary</span><p>{candidate.summary}</p></div>}{(candidate.experienceBullets || candidate.experienceHighlights) && <div className="admin-analysis-copy"><span>Experience highlights</span><p>{asText(candidate.experienceBullets || candidate.experienceHighlights)}</p></div>}</section>
                <section className="admin-analysis-card"><div className="admin-analysis-card__heading"><div><span>Role evidence</span><h2>Job requirements</h2></div><span className="admin-analysis-card__badge"><Icon name="briefcase" size={13} /> Target role</span></div><dl className="admin-analysis-fields"><div><dt>Title</dt><dd>{job.title || application.jobTitle || "Not provided"}</dd></div><div><dt>Seniority</dt><dd>{job.seniority || "Not specified"}</dd></div><div><dt>Industry</dt><dd>{job.industry || "Not specified"}</dd></div><div><dt>Company</dt><dd>{job.company || "Not provided"}</dd></div><div><dt>Location</dt><dd>{job.location || "Not specified"}</dd></div></dl><span className="admin-analysis-label">Must-have skills</span><div className="admin-analysis-chips">{displayList(job.mustHaveSkills).length ? displayList(job.mustHaveSkills).map((skill) => <span key={skill}>{skill}</span>) : <small>Not specified</small>}</div>{job.description && <div className="admin-analysis-copy"><span>Job description</span><p>{job.description}</p></div>}{job.requirements && <div className="admin-analysis-copy"><span>Requirements</span><p>{job.requirements}</p></div>}</section>
              </div>
              <div className="admin-analysis-review-grid"><section className="admin-analysis-card"><div className="admin-analysis-card__heading"><div><span>Explainable review</span><h2>Positive signals</h2></div><span>{analysis.strengths.length} found</span></div>{analysis.strengths.length ? <div className="admin-analysis-list">{analysis.strengths.map((item) => <div key={item.title}><Icon name="check" size={15} /><div><strong>{item.title}</strong><p>{item.detail}</p></div></div>)}</div> : <p className="admin-analysis-empty">The model score is available, but there are no additional positive evidence signals to display.</p>}</section><section className="admin-analysis-card"><div className="admin-analysis-card__heading"><div><span>Human review queue</span><h2>Points to verify</h2></div><span>{analysis.actions.length} items</span></div><div className="admin-analysis-list admin-analysis-list--actions">{analysis.actions.map((item) => <div key={item.title}><span className={`admin-analysis-priority admin-analysis-priority--${item.priority}`}>{item.priority}</span><div><strong>{item.title}</strong><p>{item.detail}</p></div></div>)}</div></section></div>
              <ApplicationComparison application={application} />
              <p className="admin-analysis-disclaimer">This is an assistive ranking signal from {MODEL_ID}, not an automatic hiring decision. Review the original CV, interview evidence, and job requirements before making a decision.</p>
            </>}
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminApplicationAnalysisPage;
