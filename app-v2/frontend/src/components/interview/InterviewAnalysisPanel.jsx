import { useEffect, useState } from "react";
import Icon from "../common/Icon";
import { getInterviewAnalysis } from "../../services/apiClient";
import ModelOutput from "./ModelOutput";
import ReferenceAnswerEditor from "./ReferenceAnswerEditor";
import { referenceDraft } from "../../utils/interviewReferences";
import useInterviewComparison from "../../hooks/useInterviewComparison";
import "./InterviewAnalysisPanel.css";

const score = (value) => value === null || value === undefined ? "N/A" : `${Math.round(value)}%`;
const statusLabel = { used: "Model output available", partial: "Partial model output", unavailable: "Model output unavailable", "not-run": "Waiting for candidate answers" };

function Metric({ value }) {
  const width = Math.min(100, Math.max(0, Number(value) || 0));
  return <div className="answer-analysis-metric"><span>Overall model score</span><strong>{score(value)}</strong><div className="answer-analysis-spark" aria-hidden="true"><i /></div><div className="answer-analysis-track"><i style={{ width: `${width}%` }} /></div></div>;
}

function QuestionRow({ item, index, reference, onReferenceChange, onCompare, disabled }) {
  const [collapsed, setCollapsed] = useState(false);
  return <article className={`answer-analysis-card${collapsed ? " answer-analysis-card--collapsed" : ""}`}>
    <span className="answer-analysis-card__number">{index + 1}</span>
    <div className="answer-analysis-card__question"><h3>{item.question}</h3></div>
    <div className="answer-analysis-answer"><span>Candidate answer</span><p>{item.answer || "No candidate answer was detected."}</p></div>
    <div className="answer-analysis-card__model"><ModelOutput modelScore={item.modelScore} /></div>
    <button className="answer-analysis-card__toggle" type="button" aria-label={`${collapsed ? "Expand" : "Collapse"} question ${index + 1}`} aria-expanded={!collapsed} onClick={() => setCollapsed((value) => !value)}><Icon name={collapsed ? "chevronRight" : "arrowDown"} size={17} /></button>
    <ReferenceAnswerEditor item={item} value={reference} onChange={onReferenceChange} onCompare={onCompare} disabled={disabled} />
  </article>;
}

function InterviewAnalysisPanel({ interviewId, isAdmin }) {
  const [analysis, setAnalysis] = useState(null);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [error, setError] = useState("");
  const { references, comparing: loading, comparisonError, compare: runAnalysis, updateReference } = useInterviewComparison(interviewId, analysis, setAnalysis);

  useEffect(() => {
    if (!isAdmin) return undefined;
    let active = true;
    setAnalysis(null); setLoadingExisting(true); setError("");
    getInterviewAnalysis(interviewId).then((response) => active && setAnalysis(response.data)).catch((requestError) => {
      if (requestError.status !== 404 && active) setError(requestError.message);
    }).finally(() => active && setLoadingExisting(false));
    return () => { active = false; };
  }, [interviewId, isAdmin]);

  if (!isAdmin) return null;
  const questions = analysis?.questionAnswers || [];

  return <section className="complete-answer-analyzer" aria-labelledby="complete-answer-analyzer-title">
    <header className="complete-answer-analyzer__header"><div><span className="complete-answer-analyzer__eyebrow"><Icon name="spark" size={13} /> Complete answer analyzer</span><h2 id="complete-answer-analyzer-title">Question-by-question model output</h2><p>Review the score, prediction, confidence and class probabilities returned by the interview model.</p></div><button className="complete-answer-analyzer__run" type="button" onClick={runAnalysis} disabled={loading || loadingExisting}><Icon name="refresh" size={15} />{loading ? "Analyzing..." : analysis ? "Refresh analysis" : "Analyze interview"}</button></header>
    {(comparisonError || error) && <p className="complete-answer-analyzer__error" role="alert"><Icon name="alert" size={14} />{comparisonError || error}</p>}
    {!analysis ? <div className="complete-answer-analyzer__empty"><Icon name="chart" size={25} /><strong>Model output is ready when the transcript has questions.</strong><span>Run the answer model after the interviewer and candidate have spoken.</span></div> : <>
      <div className="complete-answer-analyzer__summary"><Metric value={analysis.summary?.overallScore} /><div className="answer-analysis-summary-copy"><span>Aggregate of available model scores</span><strong><Icon name="check" size={15} />{statusLabel[analysis.modelStatus] || "Model result saved"}</strong><b>{analysis.model || "Interview answer model"}</b></div></div>
      <div className="complete-answer-analyzer__list">{questions.map((item, index) => <QuestionRow item={item} index={index} key={item.questionId} reference={referenceDraft(item, references)} onReferenceChange={(value) => updateReference(item.questionId, value)} onCompare={runAnalysis} disabled={loading || loadingExisting} />)}</div>
    </>}
  </section>;
}

export default InterviewAnalysisPanel;
