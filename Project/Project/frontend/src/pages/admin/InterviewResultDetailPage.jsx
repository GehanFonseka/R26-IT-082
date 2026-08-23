import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import CvNavigation from "../../components/layout/CvNavigation";
import CvTopbar from "../../components/layout/CvTopbar";
import Icon from "../../components/common/Icon";
import { useAuth } from "../../context/AuthContext";
import { getAdminInterviews, getInterviewAnalysis } from "../../services/apiClient";
import "./InterviewResultDetailPage.css";

const score = (value) => Number.isFinite(Number(value)) ? `${Math.round(Number(value))}%` : "—";
const dateLabel = (value) => value ? new Date(value).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "Date unavailable";
const initials = (value) => String(value || "Candidate").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
const badgeClass = (value) => String(value || "").toLowerCase().replace(/\s+/g, "-");

function Metric({ label, value, suffix = "%" }) {
  return <div className="interview-detail-metric"><span>{label}</span><strong>{value === null || value === undefined ? "—" : `${value}${suffix}`}</strong></div>;
}

function InterviewResultDetailPage() {
  const { user } = useAuth();
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [interview, setInterview] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([getAdminInterviews(), getInterviewAnalysis(interviewId)]).then(([interviewsResponse, analysisResponse]) => {
      if (!active) return;
      setInterview((interviewsResponse.data || []).find((item) => item.id === interviewId) || null);
      setAnalysis(analysisResponse.data || null);
    }).catch((requestError) => active && setError(requestError.message || "Could not load this interview result."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [interviewId]);

  const navigateFromSidebar = (view) => {
    const destinations = { admin: "/admin", "admin-jobs": "/admin/jobs", "admin-applications": "/admin/applications", "admin-interviews": "/admin/interviews", "admin-interview-results": "/admin/interview-results" };
    navigate(destinations[view] || "/admin");
  };
  if (user?.role !== "admin") return <Navigate to="/matching" replace />;
  const applicant = interview?.application?.applicant || {};
  const summary = analysis?.summary || {};
  return <div className="cv-app-shell admin-app-shell">
    <CvNavigation isOpen={navigationOpen} activeView="admin-interview-results" onNavigate={navigateFromSidebar} onClose={() => setNavigationOpen(false)} />
    <div className="cv-app-shell__main admin-app-shell__main"><CvTopbar activeView="admin-interview-results" onMenuToggle={() => setNavigationOpen(true)} />
      <main className="interview-detail-page"><div className="interview-detail-page__container">
        <button className="interview-detail-back" type="button" onClick={() => navigate("/admin/interview-results")}><Icon name="arrowLeft" size={15} />Back to interview results</button>
        {loading ? <div className="interview-detail-state"><span className="interview-detail-loader" />Loading result...</div> : error ? <div className="interview-detail-state interview-detail-state--error"><Icon name="alert" size={26} /><strong>Could not open this result</strong><span>{error}</span><button type="button" onClick={() => navigate("/admin/interview-results")}>Return to results</button></div> : !analysis ? <div className="interview-detail-state"><Icon name="chart" size={27} /><strong>No analysis result yet</strong><span>Open the interview room and run the Complete Answer Analyzer first.</span><button type="button" onClick={() => navigate(`/interviews/${interviewId}`)}>Open interview analyzer<Icon name="arrowRight" size={14} /></button></div> : <>
          <header className="interview-detail-hero"><div className="interview-detail-identity"><div className="interview-detail-avatar">{initials(applicant.displayName || applicant.email)}</div><div><span className="interview-detail-eyebrow"><i /><Icon name="chart" size={13} /> Interview result</span><h1>{applicant.displayName || applicant.email || "Candidate"}</h1><p>{applicant.email || "No email provided"} · {interview?.job?.title || "Interview"}</p></div></div><div className="interview-detail-hero-score"><span>Overall answer score</span><strong>{score(summary.overallScore)}</strong><small>{summary.needsReview || 0} answers need review</small></div></header>
          <section className="interview-detail-meta"><div><span>Job opportunity</span><strong>{interview?.job?.title || "Interview"}</strong></div><div><span>Interview date</span><strong>{dateLabel(interview?.scheduledAt)}</strong></div><div><span>Questions answered</span><strong>{summary.answerCount || 0} of {summary.questionCount || 0}</strong></div><div><span>Analysis model</span><strong>{analysis.model || "Local NLI fallback"}</strong><small>{analysis.modelStatus || "available"}</small></div></section>
          <section className="interview-detail-card"><div className="interview-detail-card__heading"><div><span className="interview-detail-overline">Complete answer analyzer</span><h2>Question-by-question result</h2><p>Each answer is evaluated by the supplied V2 model against the question and reference answer.</p></div><button type="button" onClick={() => navigate(`/interviews/${interviewId}`)}>Open interview room<Icon name="arrowRight" size={14} /></button></div><div className="interview-detail-summary"><Metric label="Overall model score" value={score(summary.overallScore)} suffix="" /><Metric label="Question relevance" value={score(summary.questionRelevance)} suffix="" /><Metric label="Strong answers" value={summary.strongAnswers || 0} suffix="" /><Metric label="Needs review" value={summary.needsReview || 0} suffix="" /></div><div className="interview-detail-questions">{(analysis.questionAnswers || []).map((item, index) => <article className="interview-detail-question" key={item.questionId}><div className="interview-detail-question__top"><div><span>Question {String(index + 1).padStart(2, "0")}</span><h3>{item.question}</h3></div><div className={`interview-detail-badge interview-detail-badge--${badgeClass(item.classification)}`}><i />{item.classification}</div></div><div className="interview-detail-answer"><span>Candidate answer</span><p>{item.answer || "No candidate answer was detected."}</p></div><div className="interview-detail-metrics"><Metric label="Model score" value={score(item.answerScore)} suffix="" /><Metric label="Model confidence" value={score(item.modelScore?.confidence ?? item.analysisConfidence)} suffix="" /><Metric label="Relevance" value={score(item.questionRelevance?.score)} suffix="" /><Metric label="Concept coverage" value={score(item.keyConceptCoverageScore)} suffix="" /><Metric label="Response time" value={item.speechMetrics?.responseTimeSeconds === null || item.speechMetrics?.responseTimeSeconds === undefined ? "—" : Number(item.speechMetrics.responseTimeSeconds).toFixed(1)} suffix="s" /><Metric label="Filler words" value={item.speechMetrics?.fillerWordCount || 0} suffix="" /></div><div className="interview-detail-concepts"><span>Key concept coverage</span><div>{(item.concepts || []).map((concept) => <b className={`interview-detail-concept interview-detail-concept--${concept.status}`} key={concept.concept}><i />{concept.concept}</b>)}</div></div>{item.incorrectConcepts?.length > 0 && <p className="interview-detail-warning"><Icon name="alert" size={14} />Potentially incorrect concepts: {item.incorrectConcepts.join(", ")}</p>}</article>)}</div></section>
          <p className="interview-detail-footnote"><Icon name="info" size={14} />This saved result uses {analysis.model || "the local NLI fallback"}. It supports review and does not make an automatic hiring decision.</p>
        </>}
      </div></main>
    </div>
  </div>;
}

export default InterviewResultDetailPage;
