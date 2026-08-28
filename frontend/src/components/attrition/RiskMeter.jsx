import "./RiskMeter.css";

const clamp = (value) => Math.min(100, Math.max(0, Number(value) || 0));

function RiskMeter({ value, label = "Risk", compact = false }) {
  const hasValue = Number.isFinite(Number(value));
  const score = clamp(value);
  const length = 188.5;
  const progress = (score / 100) * length;
  const band = score >= 70 ? "high" : score >= 30 ? "medium" : "low";
  return (
    <div className={`risk-meter ${compact ? "risk-meter--compact" : ""} risk-meter--${band}`} aria-label={hasValue ? `${Math.round(score)}% ${label}` : "Risk result pending"}>
      <svg viewBox="0 0 160 92" role="img" aria-hidden="true">
        <defs><linearGradient id="attrition-risk-gradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#d9363e" /><stop offset="42%" stopColor="#f59e0b" /><stop offset="68%" stopColor="#facc15" /><stop offset="100%" stopColor="#21a36b" /></linearGradient></defs>
        <path className="risk-meter__track" d="M 20 80 A 60 60 0 0 1 140 80" />
        <path className="risk-meter__value" d="M 20 80 A 60 60 0 0 1 140 80" style={{ strokeDasharray: `${progress} ${length}` }} />
      </svg>
      <div className="risk-meter__label"><strong>{hasValue ? `${Math.round(score)}%` : "--"}</strong><span>{label}</span></div>
    </div>
  );
}

export default RiskMeter;
