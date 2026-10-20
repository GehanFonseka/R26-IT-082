/**
 * Purpose: Technical tabular overview of attrition machine learning model outputs and metadata.
 * Responsibilities:
 * - Displays model probability, decision threshold, calibrated risk score, and top risk drivers.
 * Contents: ModelResults component, modelEntries, numberValue, probabilityValue, scoreValue, thresholdValue helpers.
 * Used by: WhatIfSimulation.jsx, candidate evaluation views.
 * Dependencies: N/A.
 * Route: N/A (Subcomponent).
 * API integration: N/A.
 * Data flow: Parses model output dictionary and renders tabular technical indicators.
 * Related files: WhatIfSimulation.jsx, RiskMeter.jsx.
 */
import "./ModelResults.css";

const modelEntries = (result) => [
  ["Attrition", result?.models?.attrition || (result?.target === "EarlyAttrition" ? null : result)],
].filter(([, model]) => model);

const numberValue = (value) => Number.isFinite(Number(value)) ? Number(value) : null;
const probabilityValue = (model) => {
  const probability = numberValue(model?.probability ?? model?.attrition_probability);
  if (probability !== null) return probability;
  const score = numberValue(model?.riskScore ?? model?.risk_score);
  return score === null ? null : score / 100;
};
const scoreValue = (model, probability) => {
  const score = numberValue(model?.riskScore ?? model?.risk_score);
  return score === null && probability !== null ? probability * 100 : score;
};
const thresholdValue = (model) => numberValue(model?.threshold);
const driversValue = (model) => Array.isArray(model?.topRiskDrivers) ? model.topRiskDrivers : [];
const percent = (value) => value === null ? "—" : `${(value * 100).toFixed(2)}%`;
const score = (value) => value === null ? "—" : `${value.toFixed(2)}%`;
const threshold = (value) => value === null ? "—" : `${(value * 100).toFixed(2)}%`;
const title = (target) => target;

function ModelResults({ result }) {
  const entries = modelEntries(result);
  if (!entries.length) return null;

  return (
    <div className="model-results">
      <div className="model-results__heading">
        <span>Attrition model output</span>
      </div>
      <div className="model-results__grid">
        {entries.map(([target, model]) => {
          const probability = probabilityValue(model);
          const riskScore = scoreValue(model, probability);
          const drivers = driversValue(model);
          const predicted = typeof model.predictedAttrition === "boolean"
            ? model.predictedAttrition ? "Positive — attrition risk" : "Negative — likely to stay"
            : "Not available";
          return (
            <article className="model-results__card" key={target}>
              <header>
                <div><span>Target</span><strong>{title(target)}</strong></div>
                <small>{model.modelId || model.modelVersion || "Model"}</small>
              </header>
              <dl>
                <div><dt>Probability</dt><dd>{percent(probability)} <small>{probability === null ? "" : `(${probability.toFixed(4)})`}</small></dd></div>
                <div><dt>Risk score</dt><dd>{score(riskScore)}</dd></div>
                <div><dt>Threshold</dt><dd>{threshold(thresholdValue(model))}</dd></div>
                <div><dt>Risk level</dt><dd>{model.riskLevel || model.riskLabel || "—"}</dd></div>
                <div className="model-results__prediction"><dt>Prediction</dt><dd>{predicted}</dd></div>
              </dl>
              {drivers.length > 0 && <div className="model-results__drivers"><span>Top risk drivers</span>{drivers.slice(0, 3).map((driver, index) => <p key={`${driver.feature || "driver"}-${index}`}><strong>{driver.feature || "Risk factor"}</strong><em>{numberValue(driver.contribution)?.toFixed(2) || "—"}</em></p>)}</div>}
            </article>
          );
        })}
      </div>
    </div>
  );
}

export default ModelResults;
