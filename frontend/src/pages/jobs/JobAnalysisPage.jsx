import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import CvNavigation from "../../components/layout/CvNavigation";
import CvTopbar from "../../components/layout/CvTopbar";
import Icon from "../../components/common/Icon";
import { useAuth } from "../../context/AuthContext";
import { getMyProfile, getOpenJobs } from "../../services/apiClient";
import { explainMatch, scoreMatch } from "../../services/matchingService";
import { toMatcherCandidate } from "../../utils/candidateProfile";
import { generateMatchAnalysis } from "../../utils/matchingAnalysis";
import "./JobAnalysisPage.css";

const normalizeJob = (job) => ({ ...job, jobTitle: job.title || "", jobSeniority: job.seniority || "", jobIndustry: job.industry || "", jobDescription: job.description || "", responsibilities: job.responsibilities || "", requirements: job.requirements || "" });
const hasEvidence = (candidate) => Object.values(candidate).some(Boolean);

function JobAnalysisPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [job, setJob] = useState(null);
  const [candidate, setCandidate] = useState(toMatcherCandidate());
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || "");
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [explanationError, setExplanationError] = useState("");
  const [stage, setStage] = useState("Comparing the job requirements with your saved CV.");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const analysis = useMemo(() => job ? generateMatchAnalysis(job, candidate, result) : { gaps: [], strengths: [], actions: [] }, [job, candidate, result]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [jobsResponse, profileResponse] = await Promise.all([getOpenJobs(), getMyProfile()]);
        const foundJob = (jobsResponse.data || []).find((item) => String(item.id) === String(jobId));
        if (!foundJob) throw new Error("This job could not be found.");
        const profile = profileResponse.data || {};
        const nextCandidate = toMatcherCandidate(profile.cv?.candidate);
        if (!hasEvidence(nextCandidate)) throw new Error("Save your CV profile before analyzing a job.");
        const nextJob = normalizeJob(foundJob);
        const nextPhoto = profile.profilePhoto || "";
        if (!mounted) return;
        setJob(nextJob);
        setCandidate(nextCandidate);
        setFileName(profile.cv?.fileName || "Saved CV");
        setProfilePhoto(nextPhoto);
        updateUser({ profilePhoto: nextPhoto });
        const matchResult = await scoreMatch(nextJob, nextCandidate);
        if (!mounted) return;
        setResult(matchResult);
        setStage("Generating a CV-grounded explanation with Gemini.");
        try {
          setExplanation(await explainMatch(profile.cv?.rawText || "", nextCandidate, nextJob, matchResult));
        } catch (explanationRequestError) {
          setExplanationError(explanationRequestError.message || "Gemini explanation is temporarily unavailable.");
        }
      } catch (requestError) {
        if (mounted) setError(requestError.message || "Could not analyze this job.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [jobId]);

  const navigateFromSidebar = (view) => navigate(view === "jobs" ? "/jobs" : view === "interviews" ? "/interviews" : view === "profile" ? "/profile" : view === "skill-analysis" ? "/skill-analysis" : "/jobs");
  if (user?.role === "admin") return <Navigate to="/admin" replace />;

  return <div className="cv-app-shell job-analysis-shell">
    <CvNavigation isOpen={navigationOpen} activeView="jobs" onNavigate={navigateFromSidebar} onClose={() => setNavigationOpen(false)} />
    <div className="cv-app-shell__main job-analysis-shell__main">
      <CvTopbar activeView="jobs" profilePhoto={profilePhoto} monochrome onMenuToggle={() => setNavigationOpen(true)} />
      <main className="job-analysis-page"><div className="job-analysis-page__container">
        <button className="job-analysis-page__back" type="button" onClick={() => navigate("/jobs")}><Icon name="arrowLeft" size={15} /> Back to open jobs</button>
        {loading ? <div className="job-analysis-state"><span className="jobs-loader" /><strong>Analyzing this job...</strong><span>{stage}</span></div> : error ? <div className="job-analysis-state job-analysis-state--error"><Icon name="alert" size={24} /><strong>{error}</strong><button type="button" onClick={() => navigate("/profile")}>Review my CV profile</button></div> : <>
          <header className="job-analysis-page__header"><div><span className="jobs-eyebrow"><i /> Job analysis</span><h1>{job.title}</h1><p>{job.company}{job.location ? ` · ${job.location}` : ""} · {fileName}</p></div><span className="job-analysis-page__model"><Icon name="activity" size={14} />{explanation ? "Gemini explanation generated" : "Matching model analyzed"}</span></header>
          <section className="job-analysis-summary"><div className="job-analysis-summary__score"><span>CV match score</span><strong>{Number(result.percentage).toFixed(1)}%</strong><b>{result.classification || result.verdict}</b></div><div><span className="job-analysis-summary__label">Model result</span><h2>How your CV fits this role</h2><p>This score is an assistive comparison of the saved CV profile and this job description.</p></div></section>
          {explanation && <section className="job-analysis-explanation"><div className="job-analysis-explanation__heading"><div><span>Gemini explainable AI</span><h2>Why this result?</h2></div><small>Grounded in the current CV and job offer</small></div><p className="job-analysis-explanation__summary">{explanation.summary}</p><p className="job-analysis-explanation__score">{explanation.scoreExplanation}</p><div className="job-analysis-explanation__grid"><article><h3>What the CV supports</h3>{explanation.matchingEvidence.length ? explanation.matchingEvidence.map((item, index) => <div className="job-analysis-explanation__item" key={`${item.area}-${index}`}><strong>{item.area}</strong><p>{item.reason}</p><small>Job: {item.jobRequirement}</small><small>CV: {item.cvEvidence}</small></div>) : <p className="job-analysis-explanation__empty">No strong matching evidence was identified in the supplied CV.</p>}</article><article><h3>Why gaps appear</h3>{explanation.gaps.length ? explanation.gaps.map((item, index) => <div className="job-analysis-explanation__item job-analysis-explanation__item--gap" key={`${item.skill}-${index}`}><strong>{item.skill} <em>{item.severity}</em></strong><p>{item.reason}</p><small>Required: {item.jobRequirement}</small><small>CV evidence: {item.cvEvidence}</small></div>) : <p className="job-analysis-explanation__empty">No grounded skill gap was found against the listed requirements.</p>}</article></div>{explanation.missingEvidence.length > 0 && <div className="job-analysis-explanation__notice"><strong>Evidence not visible in the CV</strong>{explanation.missingEvidence.map((item) => <span key={item.area}><b>{item.area}:</b> {item.reason}</span>)}</div>}{explanation.recommendations.length > 0 && <div className="job-analysis-explanation__recommendations"><h3>What would improve the fit signal?</h3>{explanation.recommendations.map((item) => <div key={item.action}><strong>{item.action}</strong><span>{item.reason}</span></div>)}</div>}{explanation.limitations.length > 0 && <p className="job-analysis-explanation__limitations"><b>Limitations:</b> {explanation.limitations.join(" · ")}</p>}</section>}
          {!explanation && explanationError && <p className="job-analysis-explanation__fallback"><Icon name="info" size={15} />Match score is available, but Gemini explanation is temporarily unavailable.</p>}
          <div className="job-analysis-grid"><section className="job-analysis-card"><div className="job-analysis-card__heading"><div><span className="jobs-eyebrow">Positive signals</span><h2>What matches</h2></div><span>{analysis.strengths.length} signals</span></div>{analysis.strengths.length ? analysis.strengths.map((item) => <div className="job-analysis-signal job-analysis-signal--positive" key={item.title}><Icon name="check" size={16} /><div><strong>{item.title}</strong><p>{item.detail}</p></div></div>) : <p className="job-analysis-empty">No strong signal was detected yet.</p>}</section>
            <section className="job-analysis-card"><div className="job-analysis-card__heading"><div><span className="jobs-eyebrow">CV comparison</span><h2>Skill gaps to review</h2></div><span>{analysis.gaps.length} gaps</span></div>{analysis.gaps.length ? <div className="job-analysis-chips">{analysis.gaps.map((gap) => <span key={gap}>{gap}</span>)}</div> : <p className="job-analysis-empty">No must-have skill gaps detected.</p>}<p className="job-analysis-card__note">The model score should be reviewed together with the original CV and the full job requirements.</p></section></div>
          <section className="job-analysis-card job-analysis-card--details"><div className="job-analysis-card__heading"><div><span className="jobs-eyebrow">Role context</span><h2>{job.title} requirements</h2></div><button type="button" onClick={() => navigate(`/jobs/apply/${job.id}`)}>View & apply <Icon name="arrowRight" size={14} /></button></div><p>{job.description || "No additional job description was provided."}</p><div className="job-analysis-details"><div><strong>Must-have skills</strong><span>{job.mustHaveSkills?.join(", ") || "Not specified"}</span></div><div><strong>Candidate CV</strong><span>{fileName}</span></div><div><strong>Model version</strong><span>{result.inputVersion || result.model || "Matching model"}</span></div></div></section>
          <p className="job-analysis-page__disclaimer">This is a decision-support signal, not an automatic hiring decision.</p>
        </>}
      </div></main>
    </div>
  </div>;
}

export default JobAnalysisPage;
