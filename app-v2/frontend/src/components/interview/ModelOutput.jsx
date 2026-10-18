import Icon from "../common/Icon";
import "./ModelOutput.css";

const clamp = (value) => Math.min(100, Math.max(0, Number(value) || 0));
const percent = (value) => Number.isFinite(Number(value)) ? `${Math.round(Number(value))}%` : "N/A";
const tone = (value) => String(value || "unknown").toLowerCase().replace(/\s+/g, "-");

function ModelOutput({ modelScore }) {
  if (!modelScore) {
    return <div className="model-output model-output--empty">
      <span className="model-output__empty-icon"><Icon name="close" size={21} /></span>
      <div><strong>Model output unavailable</strong><small>A candidate answer is required before the model can score this question.</small></div>
    </div>;
  }
  const probabilities = Object.entries(modelScore.probabilities || {});
  const score = clamp(modelScore.score);
  const ratingTone = tone(modelScore.rating);
  const positive = ["good", "excellent"].includes(ratingTone);
  return <section className={`model-output model-output--${positive ? "positive" : "negative"}`} aria-label="Interview answer model output">
    <div className="model-output__score"><span>Model score</span><strong>{percent(modelScore.score)}</strong><div className="model-output__track" role="progressbar" aria-label="Model score" aria-valuenow={score} aria-valuemin="0" aria-valuemax="100"><i style={{ width: `${score}%` }} /></div></div>
    <div className={`model-output__rating model-output__rating--${ratingTone}`}><span>Prediction</span><strong>{modelScore.rating || "Unknown"}</strong><small>{percent(modelScore.confidence)} confidence</small><b><Icon name={positive ? "check" : "close"} size={16} /></b></div>
    {probabilities.length > 0 && <div className="model-output__probabilities"><div className="model-output__section-label">Class probabilities</div>{probabilities.map(([label, value]) => <div className="model-output__probability" key={label}><div><span>{label}</span><b>{percent(value)}</b></div><div className="model-output__track"><i style={{ width: `${clamp(value)}%` }} /></div></div>)}</div>}
    <footer className="model-output__meta"><span>Inference model</span><b>{modelScore.modelId || "Interview answer model"}</b></footer>
  </section>;
}

export default ModelOutput;
