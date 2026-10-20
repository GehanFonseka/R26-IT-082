import { DECISION_THRESHOLD } from "../../services/matchingService";
import "./ScoreMatchSection.css";

function ScoreMatchSection({ result, isScoring, onScore }) {
  const scoreWidth = Math.max(2, result?.probability ? result.probability * 100 : 0);

  return (
    <section className="score-match-section cv-panel">
      <div className="score-match-section__heading">
        <div><p className="cv-overline">Final step</p><h2>Score the match</h2></div>
        <button className="cv-button cv-button--primary" type="button" onClick={onScore} disabled={isScoring}>{isScoring ? "Scoring match..." : <>Score match <span aria-hidden="true">→</span></>}</button>
      </div>
      {result && (
        <div className="score-match-section__result">
          <div className="score-match-section__result-top">
            <div><h3>{result.classification || result.verdict}</h3><p>Model-estimated relevance for this job and candidate profile.</p></div>
            <div className="score-match-section__number">{result.percentage}%</div>
          </div>
          <svg className="score-match-section__bar" viewBox="0 0 100 7" preserveAspectRatio="none" aria-label={`${result.percentage}% match score`}>
            <rect width="100" height="7" rx="3.5" fill="rgba(255,255,255,.09)" />
            <rect width={scoreWidth} height="7" rx="3.5" fill="url(#cv-score-gradient)" />
            <defs><linearGradient id="cv-score-gradient" x1="0" x2="1"><stop stopColor="#5eead4" /><stop offset="1" stopColor="#7c8cff" /></linearGradient></defs>
          </svg>
          <p>Decision threshold: {(DECISION_THRESHOLD * 100).toFixed(1)}%</p>
          <p className="score-match-section__note">This is an assistive ranking signal only. Review the original CV and job requirements before making any hiring decision.</p>
        </div>
      )}
    </section>
  );
}

export default ScoreMatchSection;
