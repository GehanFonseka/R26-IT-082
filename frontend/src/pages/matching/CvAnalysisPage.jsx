import { DECISION_THRESHOLD, MODEL_ID } from "../../services/matchingService";
import { generateMatchAnalysis } from "../../utils/matchingAnalysis";
import WhatIfSimulation from "../../components/attrition/WhatIfSimulation";
import "./CvAnalysisPage.css";

function getRisk(result) {
  if (!result) return { label: "Not scored", tone: "neutral" };
  if (result.probability >= 0.7) return { label: "Low Match Risk", tone: "low" };
  if (result.probability >= DECISION_THRESHOLD) return { label: "Medium Match Risk", tone: "medium" };
  return { label: "High Match Risk", tone: "high" };
}

function getBucket(value) {
  return Math.min(10, Math.max(0, Math.round(value * 10)));
}

function CvAnalysisPage({ job, candidate, result, selectedFile, retentionCandidate, retentionSimulation, retentionRisk, baselineRetentionRisk, retentionLoading, onRetentionSimulationChange, onResetRetentionSimulation, onGoToMatcher }) {
  const analysis = generateMatchAnalysis(job, candidate, result);
  const risk = getRisk(result);
  const jobCoverage = Object.values(job).filter((value) => String(value).trim()).length / 8;
  const candidateCoverage = Object.values(candidate).filter((value) => String(value).trim()).length / 8;
  const scoreCoverage = result?.probability || 0;

  return (
    <main className="cv-analysis-page" id="analysis">
      <header className="cv-analysis-page__header">
        <div><p className="cv-overline">Analysis workspace</p><h1>Reduce match risk before shortlisting</h1><p>Use the model score as a starting point, then work through the practical gaps that could improve this candidate’s fit signal.</p></div>
        <button className="cv-button cv-button--secondary cv-analysis-page__back" type="button" onClick={onGoToMatcher}>← Back to matcher</button>
      </header>

      <section className="cv-analysis-page__summary">
        <div className="cv-analysis-page__score"><span>Current match score</span><strong>{result ? `${result.percentage}%` : "—"}</strong><b className={`cv-analysis-page__risk cv-analysis-page__risk--${risk.tone}`}>{risk.label}</b></div>
          <div className="cv-analysis-page__summary-copy"><span>{selectedFile ? selectedFile.name : "No CV uploaded yet"}</span><strong>{result ? (result.classification || result.verdict) : "Complete the matcher to generate an analysis"}</strong><p>{result ? "The actions below are intended to improve the quality of the match signal and guide human review." : "Upload a CV, review the extracted fields, and run Score match first."}</p></div>
      </section>

      <section className="cv-analysis-page__retention">
        <div className="cv-analysis-page__retention-heading"><p className="cv-overline">Retention planning</p><h2>What if we reduce employee exit risk?</h2><p>This is a separate attrition model service. It receives the current CV candidate data and each scenario change; its output is not the CV match score.</p></div>
        <WhatIfSimulation candidate={retentionCandidate} simulation={retentionSimulation} features={retentionRisk} baselineFeatures={baselineRetentionRisk} loading={retentionLoading} onSimulationChange={onRetentionSimulationChange} onReset={onResetRetentionSimulation} />
      </section>

      <div className="cv-analysis-page__grid">
        <section className="cv-analysis-page__actions cv-analysis-card"><div className="cv-analysis-card__heading"><div><p className="cv-overline">Priority plan</p><h2>What to improve next</h2></div><span>{analysis.actions.length} actions</span></div><div className="cv-analysis-page__action-list">{analysis.actions.map((item, index) => <article className="cv-analysis-action" key={item.title}><div className={`cv-analysis-action__number cv-analysis-action__number--${item.priority}`}>{String(index + 1).padStart(2, "0")}</div><div className="cv-analysis-action__copy"><span className={`cv-analysis-action__priority cv-analysis-action__priority--${item.priority}`}>{item.priority} priority</span><strong>{item.title}</strong><p>{item.detail}</p></div><button type="button" onClick={onGoToMatcher}>{item.action} →</button></article>)}</div></section>

        <section className="cv-analysis-page__signals cv-analysis-card"><div className="cv-analysis-card__heading"><div><p className="cv-overline">Signal health</p><h2>Analysis coverage</h2></div><span>Live inputs</span></div><div className="cv-analysis-signal"><div><span>Job context</span><strong>{Math.round(jobCoverage * 100)}%</strong></div><i className={`cv-analysis-signal__bar cv-analysis-signal__bar--${getBucket(jobCoverage)} cv-analysis-signal__bar--job`} /></div><div className="cv-analysis-signal"><div><span>Candidate evidence</span><strong>{Math.round(candidateCoverage * 100)}%</strong></div><i className={`cv-analysis-signal__bar cv-analysis-signal__bar--${getBucket(candidateCoverage)} cv-analysis-signal__bar--candidate`} /></div><div className="cv-analysis-signal"><div><span>Model relevance</span><strong>{result ? `${Math.round(scoreCoverage * 100)}%` : "—"}</strong></div><i className={`cv-analysis-signal__bar cv-analysis-signal__bar--${getBucket(scoreCoverage)} cv-analysis-signal__bar--score`} /></div><div className="cv-analysis-page__model-note"><span>Model</span><strong>{MODEL_ID}</strong><small>Semantic relevance probability · threshold {(DECISION_THRESHOLD * 100).toFixed(1)}%</small></div></section>
      </div>

      <section className="cv-analysis-page__strengths cv-analysis-card"><div className="cv-analysis-card__heading"><div><p className="cv-overline">Positive signals</p><h2>What is already working</h2></div><span>{analysis.strengths.length} signals</span></div>{analysis.strengths.length ? <div className="cv-analysis-page__strength-list">{analysis.strengths.map((item) => <div className="cv-analysis-strength" key={item.title}><span>✓</span><div><strong>{item.title}</strong><p>{item.detail}</p></div></div>)}</div> : <p className="cv-analysis-page__empty">Complete the matcher fields to see positive signals.</p>}</section>
      <p className="cv-analysis-page__disclaimer">This analysis suggests areas to review; it does not make a hiring decision. Always review the original CV and job requirements.</p>
    </main>
  );
}

export default CvAnalysisPage;
