import { descriptionScore, skillScore } from "../../utils/applicantRanking";
import { attritionModels, attritionScore } from "../../utils/attritionResults";
import "./ApplicantRowMetrics.css";

const percentage = (value) => value !== null && value !== undefined && value !== ""
  && Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 100
  ? `${Number(value).toFixed(2)}%` : "—";

function ApplicantRowMetrics({ application, job, assessment }) {
  const analysis = application.candidateAnalysis;
  const models = attritionModels(assessment?.result);
  const pending = !assessment || assessment.loading;
  const metrics = [
    ["CV–Job match", descriptionScore(application) * 100, "CV–Job Description match"],
    ["Skill evidence", skillScore(application, job), "Job-relevant skill evidence"],
    ["Technical", analysis?.model?.status === "live" ? analysis.technicalCompetencyScore : null, "Technical competency"],
    ["Attrition risk", attritionScore(models.attrition), "Attrition risk", true],
    ["Early attrition", attritionScore(models.earlyAttrition), "Early Attrition risk", true],
  ];
  return <span className="applicant-row-metrics" role="group" aria-label="Applicant scores">
    {metrics.map(([label, value, description, risk]) => {
      const formatted = percentage(value);
      const status = risk && pending ? "Calculating" : formatted === "—" ? "Unavailable" : formatted;
      return <span className={`applicant-row-metrics__item${risk ? " applicant-row-metrics__item--risk" : ""}`} key={label} title={`${description}: ${status}`} aria-label={`${description}: ${status}`}>
        <span className="applicant-row-metrics__label">{label}</span>
        <strong className={formatted === "—" ? "applicant-row-metrics__unavailable" : ""}>{risk && pending ? "..." : formatted}</strong>
      </span>;
    })}
  </span>;
}

export default ApplicantRowMetrics;
