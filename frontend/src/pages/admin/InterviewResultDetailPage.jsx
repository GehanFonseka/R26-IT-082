import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import CvNavigation from "../../components/layout/CvNavigation";
import CvTopbar from "../../components/layout/CvTopbar";
import Icon from "../../components/common/Icon";
import ModelOutput from "../../components/interview/ModelOutput";
import { useAuth } from "../../context/AuthContext";
import { getAdminInterviews, getInterviewAnalysis } from "../../services/apiClient";
import "./InterviewResultDetailPage.css";

const score = (value) => Number.isFinite(Number(value)) ? `${Math.round(Number(value))}%` : "N/A";
const dateLabel = (value) => value ? new Date(value).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "Date unavailable";
const initials = (value) => String(value || "Candidate").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

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
  return <div className="cv-app-shell admin-app-shell"><CvNavigation isOpen={navigationOpen} activeView="admin-interview-results" onNavigate={navigateFromSidebar} onClose={() => setNavigationOpen(false)} /><div className="cv-app-shell__main admin-app-shell__main"><CvTopbar activeView="admin-interview-results" onMenuToggle={() => setNavigationOpen(true)} /><main className="interview-detail-page"><div className="interview-detail-page__container">
    <button className="interview-detail-back" type="button" onClick={() => navigate("/admin/interview-results")}><Icon name="arrowLeft" size={15} />Back to interview results</button>
    {loading ? <div className="interview-detail-state"><span className="interview-detail-loader" />Loading result...</div> : error ? <div className="interview-detail-state interview-detail-state--error"><Icon name="alert" size={26} /><strong>Could not open this result</strong><span>{error}</span><button type="button" onClick={() => navigate("/admin/interview-results")}>Return to results</button></div> : !analysis ? <div className="interview-detail-state"><Icon name="chart" size={27} /><strong>No model output yet</strong><span>Open the interview room and run the answer model first.</span><button type="button" onClick={() => navigate(`/interviews/${interviewId}`)}>Open interview analyzer<Icon name="arrowRight" size={14} /></button></div> : <>
      <header className="interview-detail-hero"><div className="interview-detail-identity"><div className="interview-detail-avatar">{initials(applicant.displayName || applicant.email)}</div><div><span className="interview-detail-eyebrow"><i /><Icon name="chart" size={13} /> Interview result</span><h1>{applicant.displayName || applicant.email || "Candidate"}</h1><p>{applicant.email || "No email provided"} · {interview?.job?.title || "Interview"}</p></div></div><div className="interview-detail-hero-score"><span>Overall model score</span><strong>{score(summary.overallScore)}</strong><small>{analysis.model || "Interview answer model"}</small></div></header>
      <section className="interview-detail-meta"><div><span>Job opportunity</span><strong>{interview?.job?.title || "Interview"}</strong></div><div><span>Interview date</span><strong>{dateLabel(interview?.scheduledAt)}</strong></div><div><span>Inference model</span><strong>{analysis.model || "Interview answer model"}</strong><small>{analysis.modelStatus || "available"}</small></div></section>
      <section className="interview-detail-card"><div className="interview-detail-card__heading"><div><span className="interview-detail-overline">Model output</span><h2>Question-by-question results</h2><p>Only the score, prediction, confidence and class probabilities returned by the model are shown.</p></div><button type="button" onClick={() => navigate(`/interviews/${interviewId}`)}>Open interview room<Icon name="arrowRight" size={14} /></button></div><div className="interview-detail-questions">{(analysis.questionAnswers || []).map((item, index) => <article className="interview-detail-question" key={item.questionId}><div className="interview-detail-question__top"><div><span>Question {String(index + 1).padStart(2, "0")}</span><h3>{item.question}</h3></div></div><div className="interview-detail-answer"><span>Candidate answer</span><p>{item.answer || "No candidate answer was detected."}</p></div><ModelOutput modelScore={item.modelScore} /></article>)}</div></section>
      <p className="interview-detail-footnote"><Icon name="info" size={14} />This view presents the saved output from {analysis.model || "the interview answer model"}. It supports human review and does not make an automatic hiring decision.</p>
    </>}
  </div></main></div></div>;
}

export default InterviewResultDetailPage;
