import { useEffect, useState } from "react";
import Icon from "../common/Icon";
import { analyzeInterview, getInterviewAnalysis } from "../../services/apiClient";
import "./InterviewAnalysisPanel.css";

const score = (value) => value === null || value === undefined ? "—" : `${Math.round(value)}%`;
const statusClass = (value) => String(value || "").toLowerCase().replace(/\s+/g, "-");
const savedReferences = (data) => Object.fromEntries((data?.questionAnswers || []).filter((item) => item.referenceSource === "provided").map((item) => [item.questionId, item.referenceAnswer]));

function Metric({ label, value, suffix = "%", decimals = 0 }) {
  const display = value === null || value === undefined ? "—" : `${Number(value).toFixed(decimals)}${suffix}`;
  return <div className="answer-analysis-metric"><span>{label}</span><strong>{display}</strong></div>;
}

function InterviewAnalysisPanel({ interviewId, isAdmin }) {
  const [analysis, setAnalysis] = useState(null);
  const [references, setReferences] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAdmin) return undefined;
    let active = true;
    getInterviewAnalysis(interviewId).then((response) => {
      if (active) { setAnalysis(response.data); setReferences(savedReferences(response.data)); }
    }).catch((requestError) => {
      if (requestError.status !== 404 && active) setError(requestError.message);
    }).finally(() => active && setLoadingExisting(false));
    return () => { active = false; };
  }, [interviewId, isAdmin]);

  if (!isAdmin) return null;
  const questions = analysis?.questionAnswers || [];
  const runAnalysis = async () => {
    setLoading(true); setError("");
    try {
      const referenceAnswers = Object.entries(references).filter(([, answer]) => answer.trim()).map(([questionId, answer]) => ({ questionId, answer }));
      const response = await analyzeInterview(interviewId, referenceAnswers);
      setAnalysis(response.data);
      setReferences(savedReferences(response.data));
    } catch (requestError) { setError(requestError.message || "Could not analyze this interview."); } finally { setLoading(false); }
  };

  return <section className="complete-answer-analyzer" aria-labelledby="complete-answer-analyzer-title">
    <header className="complete-answer-analyzer__header">
      <div><span className="complete-answer-analyzer__eyebrow"><i /><Icon name="spark" size={13} /> Complete answer analyzer</span><h2 id="complete-answer-analyzer-title">Question-by-question interview review</h2><p>Compare each answer with the job context, key concepts and optional reference answers.</p></div>
      <button className="complete-answer-analyzer__run" type="button" onClick={runAnalysis} disabled={loading || loadingExisting}>{loading ? "Analyzing..." : analysis ? "Refresh analysis" : "Analyze interview"}<Icon name="arrowRight" size={14} /></button>
    </header>
    {error && <p className="complete-answer-analyzer__error" role="alert"><Icon name="alert" size={14} />{error}</p>}
    {!analysis ? <div className="complete-answer-analyzer__empty"><Icon name="chart" size={25} /><strong>Analysis is ready when the transcript has questions.</strong><span>Run the local NLI analysis after the interviewer and candidate have spoken.</span></div> : <>
      <div className="complete-answer-analyzer__summary"><Metric label="Overall model score" value={analysis.summary?.overallScore} /><Metric label="Question relevance" value={analysis.summary?.questionRelevance} /><div className="answer-analysis-summary-copy"><span>{analysis.summary?.answerCount || 0} answered of {analysis.summary?.questionCount || 0}</span><strong>{analysis.summary?.needsReview || 0} need review</strong><small>{analysis.modelStatus === "used" ? `Scored by ${analysis.model}` : analysis.modelStatus === "partial" ? "Model scored available answers" : analysis.modelStatus === "not-run" ? "Waiting for candidate answers" : "Model unavailable; showing NLI fallback"}</small></div></div>
      <div className="complete-answer-analyzer__list">{questions.map((item) => <article className="answer-analysis-card" key={item.questionId}>
        <div className="answer-analysis-card__top"><div><span className="answer-analysis-card__number">Question</span><h3>{item.question}</h3></div><span className={`answer-analysis-badge answer-analysis-badge--${statusClass(item.classification)}`}>{item.classification}</span></div>
        <div className="answer-analysis-card__grid"><div><span className="answer-analysis-label">Candidate answer</span><p className="answer-analysis-answer">{item.answer || "No candidate answer was detected."}</p></div><div className="answer-analysis-score"><strong>{score(item.answerScore)}</strong><span>{item.modelScore ? "V2 model score" : "NLI fallback score"}</span>{item.modelScore?.rating && <small>{item.modelScore.rating} · {score(item.modelScore.confidence)} confidence</small>}</div></div>
        <div className="answer-analysis-metrics"><Metric label="Question relevance" value={item.questionRelevance?.score} /><Metric label="Reference match" value={item.referenceMatchScore} /><Metric label="Concept coverage" value={item.keyConceptCoverageScore} /><Metric label="Response time" value={item.speechMetrics?.responseTimeSeconds} suffix="s" decimals={1} /></div>
        <label className="answer-analysis-reference"><span>Reference answer <small>optional</small></span><textarea rows="2" value={references[item.questionId] ?? ""} onChange={(event) => setReferences((current) => ({ ...current, [item.questionId]: event.target.value }))} placeholder="Add an expected answer to improve correctness checking." /></label>
        <div className="answer-analysis-concepts"><span className="answer-analysis-label">Key concept coverage</span><div>{(item.concepts || []).map((concept) => <span className={`answer-analysis-concept answer-analysis-concept--${concept.status}`} key={concept.concept}><i />{concept.concept}</span>)}</div></div>
        {item.incorrectConcepts?.length > 0 && <p className="answer-analysis-warning"><Icon name="alert" size={14} />Potentially incorrect concepts: {item.incorrectConcepts.join(", ")}</p>}
        <footer><span><Icon name="activity" size={13} />Analysis confidence {score(item.analysisConfidence)}</span><span><Icon name="message" size={13} />Filler words {item.speechMetrics?.fillerWordCount ?? 0}</span></footer>
      </article>)}</div>
    </>}
  </section>;
}

export default InterviewAnalysisPanel;
