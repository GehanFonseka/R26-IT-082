import "./ResumeStrengthSummary.css";

const score = (value) => Number.isFinite(Number(value)) ? `${Math.round(Number(value))}%` : "-";
const skillScore = (skill) => Math.min(100, Math.max(0, Number(skill.modelSkillEvidenceStrength ?? (skill.level === "Advanced" ? 85 : skill.level === "Intermediate" ? 60 : 30))));

function ResumeStrengthSummary({ analysis, fallbackProjects = [], variant = "" }) {
  if (!analysis && !fallbackProjects.length) return null;
  const safeAnalysis = analysis || {};
  const modelLive = safeAnalysis.model?.status === "live";
  const skills = (safeAnalysis.skills || []).filter((skill) => skill.name).slice(0, 8);
  const analyzedProjects = (safeAnalysis.projects || []).filter((project) => project.name);
  const savedProjects = fallbackProjects.map((description, index) => ({
    name: String(description).split(/\s+(?:[-–—|:]|Feb|Jan|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/i)[0].trim().slice(0, 100) || `Project ${index + 1}`,
    description: String(description),
    complexity: "Saved CV project",
  }));
  const projectNames = new Set(analyzedProjects.map((project) => project.name.toLowerCase()));
  const projectRecords = [...analyzedProjects, ...savedProjects.filter((project) => !projectNames.has(project.name.toLowerCase()))];
  const projects = projectRecords.slice(0, 4);
  const projectCount = Math.max(analyzedProjects.length, fallbackProjects.length);
  const competencyScore = Math.min(100, Math.max(0, Math.round(Number(safeAnalysis.technicalCompetencyScore) || 0)));
  const levels = ["Expert", "Advanced", "Intermediate", "Beginner"];
  const levelDistribution = levels.map((level) => {
    const count = skills.filter((skill) => (skill.level || "Beginner").toLowerCase() === level.toLowerCase()).length;
    return {
      level,
      count,
      percentage: skills.length ? Math.round((count / skills.length) * 100) : 0,
    };
  });
  const competencyLabel = competencyScore >= 85 ? "Excellent" : competencyScore >= 70 ? "Strong" : competencyScore >= 50 ? "Developing" : "Building";
  const gaugeLength = 188.5;
  const gaugeProgress = (competencyScore / 100) * gaugeLength;

  return <section className={`resume-strength ${variant ? `resume-strength--${variant}` : ""}`} aria-label="Resume strength analysis">
    <div className="resume-strength__header">
      <div>
        <p className="cv-overline">Resume intelligence</p>
        <h3>Evidence-based profile</h3>
        <p>Skills and projects are enriched from the uploaded CV and kept with this account.</p>
      </div>
      <span className={`resume-strength__status ${modelLive ? "resume-strength__status--live" : ""}`}><i />{modelLive ? "Model enriched" : "Review ready"}</span>
    </div>
    <div className="resume-strength__overview">
      <div><span>Technical competency</span><strong>{score(safeAnalysis.technicalCompetencyScore)}</strong></div>
      <div><span>Top skills</span><strong>{safeAnalysis.topSkills?.length || 0}</strong><small>{(safeAnalysis.topSkills || []).slice(0, 3).join(" · ") || "Not detected yet"}</small></div>
      <div><span>Projects</span><strong>{projectCount}</strong><small>{safeAnalysis.recommendedJobCategories?.join(" · ") || "General roles"}</small></div>
    </div>
    {variant === "skill-analysis" && <div className="resume-strength__visual-summary">
      <article className="resume-strength__competency-card">
        <div>
          <span className="resume-strength__eyebrow">Overall competency</span>
          <h4>Technical strength</h4>
          <p>Based on the evidence detected in your saved CV.</p>
        </div>
        <div className="resume-strength__gauge" aria-label={`${competencyScore} out of 100, ${competencyLabel}`}>
          <svg viewBox="0 0 160 92" role="img" aria-hidden="true">
            <path className="resume-strength__gauge-track" d="M 20 80 A 60 60 0 0 1 140 80" />
            <path className="resume-strength__gauge-value" d="M 20 80 A 60 60 0 0 1 140 80" style={{ strokeDasharray: `${gaugeProgress} ${gaugeLength}` }} />
          </svg>
          <div className="resume-strength__gauge-label"><strong>{competencyScore}</strong><span>/100</span><small>{competencyLabel}</small></div>
        </div>
      </article>
      <article className="resume-strength__distribution-card">
        <div className="resume-strength__section-heading"><span>Skill level distribution</span><small>{skills.length} skills</small></div>
        <div className="resume-strength__distribution">{levelDistribution.map(({ level, count, percentage }) => <div className={`resume-strength__distribution-row resume-strength__distribution-row--${level.toLowerCase()}`} key={level}><div><strong>{level}</strong><span>{count} {count === 1 ? "skill" : "skills"}</span><b>{percentage}%</b></div><div className="resume-strength__distribution-track"><i style={{ width: `${percentage}%` }} /></div></div>)}</div>
      </article>
    </div>}
    {skills.length > 0 && <div className="resume-strength__section"><div className="resume-strength__section-heading"><span>Skill proficiency</span><small>Model evidence</small></div><div className="resume-strength__skills">{skills.map((skill) => <article key={skill.normalizedName || skill.name}><div><strong>{skill.name}</strong><span>{skill.level || "Review"}</span></div><div className="resume-strength__bar"><i style={{ width: `${skillScore(skill)}%` }} /></div><small>{score(skill.modelSkillEvidenceStrength)} evidence · {skill.relevance || "Additional"}</small></article>)}</div></div>}
    {projects.length > 0 && <div className="resume-strength__section"><div className="resume-strength__section-heading"><span>Project evidence</span><small>Skill usage and alignment</small></div><div className="resume-strength__projects">{projects.map((project, index) => <article key={`${project.name}-${index}`}><div><strong>{project.name}</strong><span>{project.complexity || "Evidence"}</span></div><p>{project.description}</p><small>{project.modelProjectStrength !== undefined ? `Project strength ${score(project.modelProjectStrength)} · alignment ${score(project.modelExperienceProjectAlignment)}` : "Project evidence detected"}</small></article>)}</div></div>}
  </section>;
}

export default ResumeStrengthSummary;
