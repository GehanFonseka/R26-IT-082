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
  const riskValue = attritionScore(models.attrition);

  const metrics = [
    ["CV–Job match", descriptionScore(application) * 100, "CV–Job Description match", false],
    ["Skill evidence", skillScore(application, job), "Job-relevant skill evidence", false],
    ["Technical", analysis?.model?.status === "live" ? analysis.technicalCompetencyScore : null, "Technical competency", false],
    ["Attrition risk", riskValue, "Attrition risk", true],
  ];

  return (
    <span className="applicant-row-metrics" role="group" aria-label="Applicant scores">
      {metrics.map(([label, value, description, isRisk]) => {
        const formatted = percentage(value);
        const status = isRisk && pending ? "Calculating" : formatted === "—" ? "Unavailable" : formatted;

        let riskClass = "";
        if (isRisk && value !== null && !pending && Number.isFinite(Number(value))) {
          riskClass = Number(value) < 35 ? "is-safe" : Number(value) < 65 ? "is-moderate" : "is-flight";
        }

        return (
          <span
            className={`applicant-row-metrics__item ${isRisk ? "applicant-row-metrics__item--risk" : ""} ${riskClass}`}
            key={label}
            title={`${description}: ${status}`}
            aria-label={`${description}: ${status}`}
          >
            <span className="applicant-row-metrics__label">{label}</span>
            <strong className={formatted === "—" ? "applicant-row-metrics__unavailable" : ""}>
              {isRisk && pending ? "..." : formatted}
            </strong>
          </span>
        );
      })}
    </span>
  );
}

export default ApplicantRowMetrics;
