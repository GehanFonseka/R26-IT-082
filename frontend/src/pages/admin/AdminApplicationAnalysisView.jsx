import ApplicationComparison from "../../components/admin/ApplicationComparison";
import WhatIfSimulation from "../../components/attrition/WhatIfSimulation";
import Icon from "../../components/common/Icon";
import { MODEL_ID } from "../../services/matchingService";
import "./AdminApplicationAnalysisView.css";

const displayList = (value) => (Array.isArray(value) ? value : String(value || "").split(/[|,;\n]+/)).map((item) => String(item).trim()).filter(Boolean);
const initials = (value) => String(value || "Candidate").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
const text = (value, fallback) => value || fallback;

function ProfileCard({ applicant, candidate, job, score }) {
  const name = text(applicant.displayName || applicant.email, "Candidate");
  const role = text(candidate.candidateRole || candidate.role, "Candidate profile");
  const location = text(candidate.location || candidate.currentLocation || applicant.location || job.location, "Location not provided");
  const experience = candidate.yearsExperience ? `${candidate.yearsExperience} years experience` : "Experience not provided";
  const photo = applicant.profilePhoto || "";
  const match = Number(score?.percentage);
  return <aside className="analysis-reference-profile"><div className="analysis-reference-profile__art"><div className="analysis-reference-profile__glow" />{photo ? <img src={photo} alt={`${name} profile`} /> : <span>{initials(name)}</span>}<i><Icon name="check" size={13} /></i></div><h1>{name}</h1><p>{role}</p><span className="analysis-reference-profile__match">{Number.isFinite(match) ? `${match}% model match` : "Model review ready"}</span><div className="analysis-reference-profile__meta"><span><Icon name="compass" size={13} />{location}</span><span><Icon name="briefcase" size={13} />{experience}</span></div><div className="analysis-reference-profile__facts"><article><span>Current role</span><strong>{role}</strong><small>{text(job.company, "Hiring team")}</small></article><article><span>Education</span><strong>{text(candidate.education, "Not provided")}</strong></article></div><a href="#candidate-evidence" className="analysis-reference-profile__button">View full profile <Icon name="arrowRight" size={14} /></a></aside>;
}

function EvidenceCard({ candidate, job, application, kind }) {
  const isCandidate = kind === "candidate";
  const fields = isCandidate ? [["Role", candidate.candidateRole || candidate.role], ["Seniority", candidate.candidateSeniority || candidate.seniority], ["Experience", candidate.yearsExperience ? `${candidate.yearsExperience} years` : ""], ["Industry", candidate.candidateIndustry || candidate.industry], ["Education", candidate.education]] : [["Title", job.title || application.jobTitle], ["Seniority", job.seniority], ["Industry", job.industry], ["Company", job.company], ["Location", job.location]];
  const skills = displayList(isCandidate ? candidate.candidateSkills || candidate.skills : job.mustHaveSkills);
  return <section className="analysis-reference-card" id={isCandidate ? "candidate-evidence" : undefined}><div className="analysis-reference-card__heading"><div><span>{isCandidate ? "Candidate evidence" : "Role evidence"}</span><h2>{isCandidate ? "CV profile snapshot" : "Job requirements"}</h2></div><span className="analysis-reference-card__tag"><Icon name={isCandidate ? "check" : "briefcase"} size={12} />{isCandidate ? "Reviewed" : "Target role"}</span></div><dl>{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{text(value, isCandidate ? "Not provided" : "Not specified")}</dd></div>)}</dl><span className="analysis-reference-card__label">{isCandidate ? "Skills" : "Must-have skills"}</span><div className="analysis-reference-card__chips">{skills.length ? skills.map((skill) => <span key={skill}>{skill}</span>) : <small>{isCandidate ? "Not provided" : "Not specified"}</small>}</div>{isCandidate && candidate.summary && <div className="analysis-reference-card__copy"><span>Professional summary</span><p>{candidate.summary}</p></div>}{!isCandidate && job.requirements && <div className="analysis-reference-card__copy"><span>Requirements</span><p>{job.requirements}</p></div>}</section>;
}

function ReviewCard({ eyebrow, title, items, positive = false }) {
  return <section className="analysis-reference-card"><div className="analysis-reference-card__heading"><div><span>{eyebrow}</span><h2>{title}</h2></div><span>{items.length} {positive ? "found" : "items"}</span></div>{items.length ? <div className="analysis-reference-review-list">{items.map((item) => <div key={item.title}><b className={positive ? "is-positive" : `is-${item.priority}`} >{positive ? <Icon name="check" size={13} /> : item.priority}</b><span><strong>{item.title}</strong><small>{item.detail}</small></span></div>)}</div> : <p className="analysis-reference-empty">No additional signals available for this review.</p>}</section>;
}

function AdminApplicationAnalysisView({ application, applicant, candidate, job, analysis, score, retentionCandidate, retentionSimulation, retentionRisk, baselineRetentionRisk, retentionLoading, retentionError, onSimulationChange, onReset }) {
  return <div className="analysis-reference-layout"><ProfileCard applicant={applicant} candidate={candidate} job={job} score={score} /><div className="analysis-reference-main"><section className="analysis-reference-retention-hero"><div><span><Icon name="spark" size={12} /> Separate attrition model analysis</span><h1>Retention planning</h1><p>This is a separate retention service. It explores practical interventions without changing the CV match score or deciding whether this applicant should be hired.</p></div><b><i /> Separate service</b></section><section className="analysis-reference-planner"><WhatIfSimulation candidate={retentionCandidate} simulation={retentionSimulation} features={retentionRisk} baselineFeatures={baselineRetentionRisk} loading={retentionLoading} error={retentionError} onSimulationChange={onSimulationChange} onReset={onReset} /></section><div className="analysis-reference-evidence-grid"><EvidenceCard candidate={candidate} job={job} application={application} kind="candidate" /><EvidenceCard candidate={candidate} job={job} application={application} kind="role" /></div><div className="analysis-reference-review-grid"><ReviewCard eyebrow="Explainable review" title="Positive signals" items={analysis.strengths} positive /><ReviewCard eyebrow="Human review queue" title="Points to verify" items={analysis.actions} /></div><ApplicationComparison application={application} /><p className="admin-analysis-disclaimer">This is an assistive ranking signal from {MODEL_ID}, not an automatic hiring decision. Review the original CV, interview evidence, and job requirements before making a decision.</p></div></div>;
}

export default AdminApplicationAnalysisView;
