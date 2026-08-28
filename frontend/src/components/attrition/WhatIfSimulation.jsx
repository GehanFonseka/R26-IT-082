import Icon from "../common/Icon";
import { formatCurrency } from "../../utils/formatters";
import RiskMeter from "./RiskMeter";
import AttritionExplainability from "./AttritionExplainability";
import "./WhatIfSimulation.css";

const resultScore = (result) => {
  const value = result?.riskScore ?? result?.risk_score;
  return Number.isFinite(Number(value)) ? Number(value) : null;
};

const resultLabel = (result) => result?.riskLabel || result?.risk_label || result?.riskLevel || result?.risk_level || "Risk result";
const displayRiskLabel = (result, fallback) => {
  const label = resultLabel(result);
  const level = result?.riskLevel || result?.risk_level;
  return level && label === level ? `${level[0].toUpperCase()}${level.slice(1)} ${fallback}` : label;
};
const resultDrivers = (result) => (Array.isArray(result?.topRiskDrivers) ? result.topRiskDrivers : Array.isArray(result?.top_risk_drivers) ? result.top_risk_drivers : []);
const formatModelNumber = (value, digits = 2) => Number.isFinite(Number(value)) ? Number(value).toFixed(digits) : "—";

function WhatIfSimulation({ candidate, simulation = {}, features, baselineFeatures, loading = false, error = "", onSimulationChange, onReset }) {
  const simulationCandidate = candidate || {
    compensation: { current: 104000, market: 118000 },
    engagement: { remotePreference: "hybrid" },
  };
  const safeSimulation = { salaryAdjustment: 0, roleChange: false, managerChange: false, remoteWork: false, ...simulation };
  const compensation = simulationCandidate.compensation || {};
  const currency = compensation.currency || "USD";
  const currentSalary = Number(compensation.current) || 0;
  const marketSalary = Number(compensation.market) || 0;
  const salaryAdjustment = Number(safeSimulation.salaryAdjustment) || 0;
  const projectedSalary = currentSalary > 0 ? currentSalary * (1 + salaryAdjustment / 100) : 0;
  const formatSalary = (value, suffix = "") => value > 0 ? `${formatCurrency(value, currency)}${suffix}` : "Not provided";
  const candidateName = simulationCandidate.displayName || simulationCandidate.name || simulationCandidate.candidateRole || "this candidate";
  const hasChanges = salaryAdjustment > 0 || safeSimulation.roleChange || safeSimulation.managerChange || safeSimulation.remoteWork;
  const currentResultScore = resultScore(features);
  const baselineResultScore = resultScore(baselineFeatures);
  const hasResult = currentResultScore !== null;
  const isLocalModel = features?.method === "local-catboost-v7";
  const hasBaseline = baselineResultScore !== null;
  const change = hasResult && hasBaseline ? currentResultScore - baselineResultScore : 0;
  const riskScore = hasResult ? Math.min(100, Math.max(0, currentResultScore)) : 0;
  const earlyModel = features?.models?.earlyAttrition;
  const earlyScore = resultScore(earlyModel);
  const riskLabel = displayRiskLabel(features, "attrition risk");
  const earlyRiskLabel = displayRiskLabel(earlyModel, "early attrition risk");
  const drivers = resultDrivers(features).length > 0 ? resultDrivers(features) : resultDrivers(earlyModel);
  const riskBand = riskScore >= 70 ? "high" : riskScore >= 30 ? "medium" : "low";
  const statusText = error ? "Live update failed" : loading ? "Updating live" : hasResult ? "Live result" : "Connecting";
  const inputSummary = [`Salary +${salaryAdjustment}%`, safeSimulation.roleChange && "Role changed", safeSimulation.managerChange && "Manager changed", safeSimulation.remoteWork && "Remote work"].filter(Boolean).join(" · ");

  return (
    <section className="what-if-simulation">
      <div className="what-if-simulation__header">
        <div>
          <span className="what-if-simulation__eyebrow"><Icon name="spark" size={13} />Scenario planner</span>
          <h2>What if we change something?</h2>
        </div>
        <div className="what-if-simulation__header-status"><span className="what-if-simulation__status" data-state={error ? "error" : loading ? "loading" : hasResult ? "ready" : "idle"}><i />{statusText}</span><span className="what-if-simulation__beta">Beta</span></div>
      </div>
      <p className="what-if-simulation__intro">Explore how practical interventions could change {candidateName}&apos;s retention outlook. Every adjustment runs the configured local attrition models with the new scenario.</p>

      <div className="what-if-simulation__result" aria-live="polite">
        <div className={`what-if-simulation__result-score ${hasResult ? `what-if-simulation__result-score--${riskBand}` : ""}`}>
          <div className="what-if-simulation__meter-group">
            <div className="what-if-simulation__meter-tile"><span className="what-if-simulation__meter-title">Attrition</span><RiskMeter value={hasResult ? riskScore : null} label={hasResult ? riskLabel : loading ? "Calculating" : "Waiting for service"} /></div>
            {earlyModel && <div className="what-if-simulation__meter-tile"><span className="what-if-simulation__meter-title">EarlyAttrition</span><RiskMeter value={earlyScore} label={earlyRiskLabel} /></div>}
          </div>
        </div>
        <div className="what-if-simulation__result-copy">
          <span>{hasChanges ? "Projected retention outlook" : "Current retention outlook"}</span>
          {hasChanges && hasBaseline ? <strong className={change < 0 ? "what-if-simulation__improvement" : "what-if-simulation__worsening"}>{Math.abs(change)} points {change < 0 ? "lower risk" : "higher risk"}</strong> : <strong>{loading ? "Refreshing the live result" : "Try a scenario below"}</strong>}
          <small>{loading ? "Sending CV data and updated scenario..." : `Inputs applied: ${inputSummary}`}</small>
        </div>
        {hasResult && <div className="what-if-simulation__result-details">
           {drivers.length > 0 && <div className="what-if-simulation__drivers">
            <div className="what-if-simulation__drivers-heading"><span>Top risk drivers</span></div>
            {drivers.slice(0, 3).map((driver, index) => {
              const protective = String(driver.direction || "").toLowerCase().includes("reduces");
              return <article className={`what-if-simulation__driver ${protective ? "what-if-simulation__driver--protective" : ""}`} key={`${driver.feature || "driver"}-${index}`}><div><strong>{driver.feature || "Risk factor"}</strong><span>{formatModelNumber(driver.contribution)}</span></div></article>;
            })}
          </div>}
        </div>}
      </div>

      {hasResult && <AttritionExplainability result={features} />}

      <div className="what-if-simulation__controls">
        <div className="what-if-simulation__control what-if-simulation__control--slider">
          <div className="what-if-simulation__control-head"><label htmlFor="salary-adjustment">Salary adjustment</label><strong>+{salaryAdjustment}%</strong></div>
          <input id="salary-adjustment" type="range" min="0" max="15" step="1" value={salaryAdjustment} style={{ "--salary-progress": `${(salaryAdjustment / 15) * 100}%` }} onChange={(event) => onSimulationChange({ ...safeSimulation, salaryAdjustment: Number(event.target.value) })} />
          <div className="what-if-simulation__range-labels"><span>{formatSalary(currentSalary)}</span><span>{formatSalary(marketSalary, " midpoint")}</span></div>
          <p className="what-if-simulation__salary-preview">{projectedSalary > 0 ? `Projected salary: ${formatCurrency(projectedSalary, currency)}` : "Current salary is not in this CV record; the percentage adjustment is still sent to the live service."}</p>
        </div>
        <div className="what-if-simulation__control what-if-simulation__control--toggles">
          <label className="what-if-simulation__toggle-row">
            <span className="what-if-simulation__toggle-copy"><i><Icon name="briefcase" size={13} /></i><span>Change role</span></span>
            <input type="checkbox" checked={safeSimulation.roleChange} onChange={(event) => onSimulationChange({ ...safeSimulation, roleChange: event.target.checked })} />
            <i className="what-if-simulation__toggle" />
          </label>
          <label className="what-if-simulation__toggle-row">
            <span className="what-if-simulation__toggle-copy"><i><Icon name="people" size={13} /></i><span>Change manager</span></span>
            <input type="checkbox" checked={safeSimulation.managerChange} onChange={(event) => onSimulationChange({ ...safeSimulation, managerChange: event.target.checked })} />
            <i className="what-if-simulation__toggle" />
          </label>
          <label className="what-if-simulation__toggle-row">
            <span className="what-if-simulation__toggle-copy"><i><Icon name="compass" size={13} /></i><span>Flexible work</span></span>
            <input type="checkbox" checked={safeSimulation.remoteWork} onChange={(event) => onSimulationChange({ ...safeSimulation, remoteWork: event.target.checked })} />
            <i className="what-if-simulation__toggle" />
          </label>
        </div>
      </div>

      {error && <p className="what-if-simulation__error"><Icon name="alert" size={13} />{error} The controls remain active and will retry on the next change.</p>}
      {!error && !hasResult && !loading && <p className="what-if-simulation__waiting">Waiting for the local attrition model to return the first result.</p>}

      <div className="what-if-simulation__footer">
         <span><Icon name="info" size={13} />{features?.models?.attrition && features?.models?.earlyAttrition ? "Live Attrition and EarlyAttrition model outputs; CV match scoring remains separate." : isLocalModel ? "Live local CatBoost output; CV match scoring remains separate." : features?.modelId ? `Live ${features.modelId} output; CV match scoring remains separate.` : "Live rule-based fallback output; configure the local model service for model predictions."}</span>
        <button type="button" onClick={onReset} disabled={!hasChanges}>Reset <Icon name="close" size={12} /></button>
      </div>
    </section>
  );
}

export default WhatIfSimulation;
