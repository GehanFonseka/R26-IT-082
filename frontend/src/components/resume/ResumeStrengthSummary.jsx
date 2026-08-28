import "./ResumeStrengthSummary.css";
import ModelOutputReview from "./ModelOutputReview";

const score = (value) => Number.isFinite(Number(value)) ? `${Math.round(Number(value))}%` : "-";
const skillScore = (skill) => Math.min(100, Math.max(0, Number(skill.modelSkillEvidenceStrength ?? (skill.level === "Advanced" ? 85 : skill.level === "Intermediate" ? 60 : 30))));
const skillKey = (value) => String(value || "").trim().toLowerCase();

function SkillExplanation({ explanation }) {
  if (!explanation) return null;
  return <details className="resume-strength__explanation"><summary>Why this score?</summary><p>{explanation.explanation}</p>{explanation.scoreReason && <p>{explanation.scoreReason}</p>}{explanation.cvEvidence?.length > 0 && <small>CV evidence: {explanation.cvEvidence.join(" · ")}</small>}{explanation.limitations?.length > 0 && <small>Limitations: {explanation.limitations.join(" · ")}</small>}</details>;
}

function ResumeStrengthSummary({ analysis, fallbackProjects = [], variant = "" }) {
  if (!analysis && !fallbackProjects.length) return null;
  const safeAnalysis = analysis || {};
  const modelLive = safeAnalysis.model?.status === "live";
  const explanationLive = safeAnalysis.explainability?.status === "live";
  const detectedSkills = (safeAnalysis.skills || []).filter((skill) => skill.name);
  const skills = variant === "skill-analysis" ? detectedSkills : detectedSkills.slice(0, 8);
  const skillExplanations = new Map((safeAnalysis.explainability?.skills || []).map((item) => [skillKey(item.name), item]));
  const competencyScore = Math.min(100, Math.max(0, Math.round(Number(safeAnalysis.technicalCompetencyScore) || 0)));
  const levels = ["Expert", "Advanced", "Intermediate", "Beginner"];
  const levelDistribution = levels.map((level) => {
    const count = skills.filter((skill) => (skill.level || "Beginner").toLowerCase() === level.toLowerCase()).length;
    return { level, count, percentage: skills.length ? Math.round((count / skills.length) * 100) : 0 };
  });
  const competencyLabel = competencyScore >= 85 ? "Excellent" : competencyScore >= 70 ? "Strong" : competencyScore >= 50 ? "Developing" : "Building";
  const competencyExplanation = safeAnalysis.explainability?.technicalCompetency;
  const gaugeLength = 188.5;
  const gaugeProgress = (competencyScore / 100) * gaugeLength;

  return <section className={`resume-strength ${variant ? `resume-strength--${variant}` : ""}`} aria-label="Resume strength analysis">
    <div className="resume-strength__header"><div><p className="cv-overline">Resume intelligence</p><h3>Evidence-based profile</h3><p>Scores are calculated by the resume model and explained from this CV by Gemini.</p></div><span className={`resume-strength__status ${modelLive || explanationLive ? "resume-strength__status--live" : ""}`}><i />{modelLive && explanationLive ? "Model enriched" : explanationLive ? "CV explained" : "Review ready"}</span></div>
    <div className="resume-strength__overview"><div><span>Technical competency</span><strong>{score(safeAnalysis.technicalCompetencyScore)}</strong>{competencyExplanation?.summary && <small className="resume-strength__overview-note">{competencyExplanation.summary}</small>}</div><div><span>Top skills</span><strong>{safeAnalysis.topSkills?.length || 0}</strong><small>{(safeAnalysis.topSkills || []).slice(0, 3).join(" · ") || "Not detected yet"}</small></div></div>
    {variant === "skill-analysis" && <div className="resume-strength__visual-summary"><article className="resume-strength__competency-card"><div><span className="resume-strength__eyebrow">Overall competency</span><h4>Technical strength</h4><p>Based on evidence detected in your saved CV.</p>{competencyExplanation?.evidence?.length > 0 && <small className="resume-strength__evidence">CV evidence: {competencyExplanation.evidence.join(" · ")}</small>}</div><div className="resume-strength__gauge" aria-label={`${competencyScore} out of 100, ${competencyLabel}`}><svg viewBox="0 0 160 92" role="img" aria-hidden="true"><path className="resume-strength__gauge-track" d="M 20 80 A 60 60 0 0 1 140 80" /><path className="resume-strength__gauge-value" d="M 20 80 A 60 60 0 0 1 140 80" style={{ strokeDasharray: `${gaugeProgress} ${gaugeLength}` }} /></svg><div className="resume-strength__gauge-label"><strong>{competencyScore}</strong><span>/100</span><small>{competencyLabel}</small></div></div></article><article className="resume-strength__distribution-card"><div className="resume-strength__section-heading"><span>Skill level distribution</span><small>{skills.length} skills</small></div><div className="resume-strength__distribution">{levelDistribution.map(({ level, count, percentage }) => <div className={`resume-strength__distribution-row resume-strength__distribution-row--${level.toLowerCase()}`} key={level}><div><strong>{level}</strong><span>{count} {count === 1 ? "skill" : "skills"}</span><b>{percentage}%</b></div><div className="resume-strength__distribution-track"><i style={{ width: `${percentage}%` }} /></div></div>)}</div></article></div>}
    {skills.length > 0 && <div className="resume-strength__section"><div className="resume-strength__section-heading"><span>Skill proficiency</span><small>{explanationLive ? "Gemini CV explanations" : "Model evidence"}</small></div><div className="resume-strength__skills">{skills.map((skill) => <article key={skill.normalizedName || skill.name}><div><strong>{skill.name}</strong><span>{skill.level || "Review"}</span></div><div className="resume-strength__bar"><i style={{ width: `${skillScore(skill)}%` }} /></div><small>{score(skill.modelSkillEvidenceStrength)} evidence · {skill.relevance || "Additional"}</small>{variant === "skill-analysis" && <ModelOutputReview skill={skill} />}<SkillExplanation explanation={skillExplanations.get(skillKey(skill.name))} /></article>)}</div></div>}
  </section>;
}

export default ResumeStrengthSummary;
