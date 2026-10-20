/**
 * Purpose: Multi-tab candidate evaluation dossier containing overview, skills, CV, certificates, and retention planner.
 * Responsibilities:
 * - Switches between candidate dossier tabs (Overview, Skills, Candidate CV, Certificates, What-If Simulation, Job details).
 * - Integrates useApplicantAttrition and useApplicantAttritionSimulation hooks.
 * - Embeds ResumeStrengthSummary, ApplicantCertificates, ApplicantAttritionMeters, and ApplicantAttritionPlanner.
 * Contents: ApplicantJobResults component, list, percent helpers.
 * Used by: ApplicantJobDashboard.jsx.
 * Dependencies: ResumeStrengthSummary, ApplicantCertificates, ApplicantAttritionMeters, ApplicantAttritionPlanner, useApplicantAttrition, useApplicantAttritionSimulation.
 * Route: N/A (Embedded in /admin/jobs/:jobId/applicants/:applicationId).
 * API integration: Indirect via hooks (POST /api/attrition/predict, GET certificates).
 * Data flow: Receives application and job records; displays tabbed sub-views for deep hiring assessment.
 * Related files: ApplicantJobDashboard.jsx, ApplicantAttritionPlanner.jsx, ResumeStrengthSummary.jsx.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ResumeStrengthSummary from "../resume/ResumeStrengthSummary";
import ApplicantCertificates from "./ApplicantCertificates";
import ApplicantAttritionMeters from "./ApplicantAttritionMeters";
import ApplicantAttritionPlanner from "./ApplicantAttritionPlanner";
import { useApplicantAttrition } from "../../hooks/useApplicantAttrition";
import { useApplicantAttritionSimulation } from "../../hooks/useApplicantAttritionSimulation";
import { descriptionScore, skillScore } from "../../utils/applicantRanking";
import { initials, dateLabel, statusLabels } from "./applicationBoardUtils";
import "./ApplicantJobResults.css";

const list = (value) => (Array.isArray(value) ? value : String(value || "").split(/[,;\n]+/)).map((item) => String(item).trim()).filter(Boolean);
const percent = (value) => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value)) && Number(value) >= 0 ? `${Number(value).toFixed(2)}%` : "Unavailable";

function ApplicantJobResults({ application, job, initialTab = "overview" }) {
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "skills", label: "Skills" },
    { id: "cv", label: "Candidate CV" },
    { id: "certificates", label: "Certificates" },
    { id: "attrition", label: "What-If Simulation" },
    { id: "job", label: "Job details" },
  ];
  const normalizeTab = (t) => (t === "simulation" || t === "what-if" || t === "whatif") ? "attrition" : t;
  const [activeTab, setActiveTab] = useState(() => {
    const norm = normalizeTab(initialTab);
    return tabs.some((t) => t.id === norm) ? norm : "overview";
  });

  useEffect(() => {
    if (initialTab) {
      const norm = normalizeTab(initialTab);
      if (tabs.some((t) => t.id === norm)) {
        setActiveTab(norm);
      }
    }
  }, [initialTab]);

  const attrition = useApplicantAttrition(application, job);
  const planner = useApplicantAttritionSimulation(attrition);
  const handleTabKey = (event, index) => {
    const next = event.key === "ArrowRight" ? index + 1 : event.key === "ArrowLeft" ? index - 1 : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : null;
    if (next === null) return;
    event.preventDefault();
    const tab = tabs[(next + tabs.length) % tabs.length];
    setActiveTab(tab.id);
    event.currentTarget.parentElement.querySelector(`#applicant-tab-${tab.id}`)?.focus();
  };
  const applicant = application.applicant || {};
  const candidate = application.candidate || {};
  const analysis = application.candidateAnalysis || {};
  const name = applicant.displayName || "Candidate";
  const description = descriptionScore(application);
  const relevantSkills = skillScore(application, job);
  const facts = [["Role", candidate.candidateRole || candidate.role], ["Seniority", candidate.candidateSeniority || candidate.seniority], ["Experience", candidate.yearsExperience != null ? `${candidate.yearsExperience} years` : null], ["Industry", candidate.candidateIndustry || candidate.industry], ["Education", candidate.education]];
  return <div className="applicant-results">
    <header className="applicant-results__header"><span className="applicant-results__avatar">{applicant.profilePhoto ? <img src={applicant.profilePhoto} alt="" /> : initials(name)}</span><div><span>Applicant dashboard</span><h1>{name}</h1><p>{applicant.email}</p><strong>{job.title}</strong><p>{[job.company, job.location].filter(Boolean).join(" · ")}</p><small>Applied {dateLabel(application.createdAt)} · {statusLabels[application.status] || application.status || "New"}</small></div></header>
    <div className="applicant-results__tabs" role="tablist" aria-label="Applicant dashboard sections">{tabs.map((tab, index) => <button type="button" role="tab" key={tab.id} id={`applicant-tab-${tab.id}`} aria-selected={activeTab === tab.id} aria-controls={`applicant-panel-${tab.id}`} tabIndex={activeTab === tab.id ? 0 : -1} onClick={() => setActiveTab(tab.id)} onKeyDown={(event) => handleTabKey(event, index)}>{tab.label}</button>)}</div>
    <div className="applicant-results__tab-content" role="tabpanel" id={`applicant-panel-${activeTab}`} aria-labelledby={`applicant-tab-${activeTab}`} tabIndex="0">
    {activeTab === "overview" && <section className="applicant-results__metrics" aria-label="Model scores">
      <article><span>CV–Job Description match</span><strong>{percent(description < 0 ? null : description * 100)}</strong><small>Primary ranking score · {application.matchScore?.classification || "Analysis pending"}</small></article>
      <article><span>Job-relevant skill evidence</span><strong>{percent(relevantSkills)}</strong><small>Secondary ranking score · mean evidence for required skills</small></article>
      <article><span>Technical competency</span><strong>{percent(analysis.model?.status === "live" ? analysis.technicalCompetencyScore : null)}</strong><small>Overall skill model output</small></article>
    </section>}
    {activeTab === "overview" && <ApplicantAttritionMeters {...attrition} />}
    {activeTab === "attrition" && <ApplicantAttritionPlanner planner={planner} retry={attrition.retry} baselineLoading={attrition.loading} baselineError={attrition.error} />}
    {activeTab === "skills" && <div className="applicant-results__skill-summary"><ResumeStrengthSummary analysis={application.candidateAnalysis} variant="skill-analysis" />{!application.candidateAnalysis && <p>Skill model results are unavailable.</p>}</div>}
    {activeTab === "certificates" && <ApplicantCertificates key={application.id} application={application} />}
      {activeTab === "cv" && <section className="applicant-results__panel applicant-results__panel--cv"><h2>Candidate CV</h2><dl>{facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "Not provided"}</dd></div>)}</dl>{candidate.summary && <p>{candidate.summary}</p>}<h3>Experience highlights</h3><ul>{list(candidate.experienceBullets || candidate.experienceHighlights).map((item, index) => <li key={index}>{item}</li>)}</ul>{application.coverLetter && <><h3>Cover letter</h3><p>{application.coverLetter}</p></>}</section>}
      {activeTab === "job" && <section className="applicant-results__panel"><h2>Job details</h2>{[["Description", job.description], ["Responsibilities", job.responsibilities], ["Requirements", job.requirements]].map(([label, value]) => <div key={label}><h3>{label}</h3><p>{value || "Not specified"}</p></div>)}<Link to={`/admin/applications/${encodeURIComponent(application.id)}`}>Open full application review →</Link></section>}
    </div>
  </div>;
}

export default ApplicantJobResults;
