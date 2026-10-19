import RiskMeter from "../attrition/RiskMeter";
import Icon from "../common/Icon";
import { attritionModels, attritionScore as scoreFor } from "../../utils/attritionResults";
import "./ApplicantAttritionMeters.css";

const labelFor = (model) => model?.riskLabel || model?.risk_label
  || `${model?.riskLevel || model?.risk_level || "Current"} risk`;
const toneFor = (model, score) => {
  if (score === null) return "neutral";
  const level = String(model?.riskLevel || model?.risk_level || "").toLowerCase();
  if (["low", "medium", "high"].includes(level)) return level;
  return level === "moderate" ? "medium" : score >= 70 ? "high" : score >= 30 ? "medium" : "low";
};

function ApplicantAttritionMeters({ result, loading, error, retry }) {
  const outputs = attritionModels(result);
  const models = [
    ["Attrition Risk", outputs.attrition, "shield", "Overall retention outlook"],
  ];
  const incomplete = scoreFor(outputs.attrition) === null;
  return <section className="applicant-attrition" aria-label="Job attrition risk" aria-busy={loading}>
    <header><div><span className="applicant-attrition__eyebrow"><Icon name="activity" size={13} />Retention insights</span><h2>Job attrition risk</h2><p>Current retention outlook for this applicant and job.</p></div>
      {!loading && incomplete && <button type="button" onClick={retry}><Icon name="refresh" size={14} />Retry analysis</button>}
    </header>
    <div className="applicant-attrition__meters" aria-live="polite">
      {models.map(([title, model, icon, subtitle]) => {
        const score = scoreFor(model);
        const tone = loading ? "neutral" : toneFor(model, score);
        const status = loading ? "Calculating" : score === null ? "Unavailable" : labelFor(model);
        return <article className={`applicant-attrition__card applicant-attrition__card--${tone}`} key={title}>
          <header className="applicant-attrition__card-heading"><span className="applicant-attrition__icon"><Icon name={icon} size={22} /></span><div><h3>{title}</h3><p>{subtitle}</p></div></header>
          <div className="applicant-attrition__card-body">
            <div className="applicant-attrition__gauge"><RiskMeter value={score} riskLevel={tone} label={loading ? "Calculating" : score === null ? "Unavailable" : "Exit risk"} /><div className="applicant-attrition__scale" aria-hidden="true"><span>0%</span><span>100%</span></div></div>
            <div className="applicant-attrition__summary"><span className="applicant-attrition__badge"><i />{status}</span><p>{loading ? "Preparing the current assessment..." : score === null ? "Try again to load this assessment." : "Estimated likelihood of employee exit."}</p>
              {!loading && model?.method === "rule-based" && <small>Rule-based assessment</small>}
            </div>
          </div>
          <footer><Icon name="info" size={13} />Lower percentages indicate lower risk</footer>
        </article>;
      })}
    </div>
    {error && <p className="applicant-attrition__error" role="alert">{error}</p>}
  </section>;
}

export default ApplicantAttritionMeters;
