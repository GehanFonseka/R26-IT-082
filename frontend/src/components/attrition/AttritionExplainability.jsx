import Icon from "../common/Icon";
import "./AttritionExplainability.css";

const entries = (result) => [
  ["attrition", "Attrition", result?.models?.attrition],
].filter(([, , model]) => model);

const percent = (value) => Number.isFinite(Number(value)) ? `${(Number(value) * 100).toFixed(1)}%` : "—";
const score = (model) => Number.isFinite(Number(model?.riskScore)) ? `${Number(model.riskScore).toFixed(1)}%` : "—";
const contribution = (value) => Number.isFinite(Number(value)) ? `${Number(value) >= 0 ? "+" : ""}${Number(value).toFixed(2)}` : "—";

function ModelExplanation({ modelKey, target, model, explanation }) {
  const drivers = explanation?.drivers?.length ? explanation.drivers : model.topRiskDrivers || [];
  const decision = typeof model.predictedAttrition === "boolean"
    ? model.predictedAttrition ? "Predicted attrition" : "Likely to stay"
    : "Prediction unavailable";
  return (
    <article className="attrition-explainability__model">
      <header><div><span>{target}</span><strong>{model.modelId || "Local model"}</strong></div><b>{score(model)}</b></header>
      <div className="attrition-explainability__facts"><span>Probability <b>{percent(model.probability)}</b></span><span>Level <b>{model.riskLevel || "—"}</b></span><span>Decision <b>{decision}</b></span></div>
      <p className="attrition-explainability__summary">{explanation?.summary || "The local model returned a result; Gemini narrative is not available for this run."}</p>
      {(explanation?.cvEvidence?.length > 0 || explanation?.jobComparison || explanation?.gaps?.length > 0) && <div className="attrition-explainability__comparison"><div><span>CV evidence</span><p>{explanation.cvEvidence?.[0] || "No matching evidence was found in the supplied CV."}</p></div><div><span>Job comparison</span><p>{explanation.jobComparison || "The supplied job requirements could not be compared for this run."}</p></div>{explanation.gaps?.length > 0 && <div className="is-gap"><span>Evidence gap</span><p>{explanation.gaps[0]}</p></div>}</div>}
      {drivers.length > 0 && <div className="attrition-explainability__drivers"><span className="attrition-explainability__label">Drivers from {target} input</span>{drivers.slice(0, 3).map((driver) => <div className="attrition-explainability__driver" key={`${modelKey}-${driver.feature}`}><div><strong>{driver.feature}</strong><b className={Number(driver.contribution) < 0 ? "is-protective" : ""}>{contribution(driver.contribution)}</b></div><small>{driver.explanation || driver.direction || "Local contribution"}</small></div>)}</div>}
      {explanation?.limitations?.length > 0 && <p className="attrition-explainability__limitations"><Icon name="info" size={12} />{explanation.limitations[0]}</p>}
    </article>
  );
}

function AttritionExplainability({ result }) {
  const models = entries(result);
  if (!models.length) return null;
  const explanation = result?.explainability;
  const byKey = new Map((explanation?.models || []).map((item) => [item.modelKey, item]));
  const live = explanation?.status === "live";
  return (
    <section className="attrition-explainability" aria-label="Explainable AI model review">
      <header className="attrition-explainability__heading"><div><span><Icon name="spark" size={12} />Explainable AI</span><h3>CV + job reasons behind each local model</h3><p>Gemini compares the supplied CV evidence and job requirements with each model&apos;s exact inputs and outputs.</p></div><b className={live ? "is-live" : ""}><i />{live ? "CV + job grounded" : "Local evidence"}</b></header>
      {explanation?.overview && <p className="attrition-explainability__overview">{explanation.overview}</p>}
      {explanation?.context && <div className="attrition-explainability__source"><span className={explanation.context.cvAvailable ? "is-ready" : ""}>CV {explanation.context.cvAvailable ? "included" : "not available"}</span><span className={explanation.context.jobAvailable ? "is-ready" : ""}>Job {explanation.context.jobAvailable ? "included" : "not available"}</span></div>}
      <div className="attrition-explainability__grid">{models.map(([modelKey, target, model]) => <ModelExplanation key={modelKey} modelKey={modelKey} target={target} model={model} explanation={byKey.get(modelKey)} />)}</div>
    </section>
  );
}

export default AttritionExplainability;
