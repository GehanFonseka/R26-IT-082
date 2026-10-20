import "./ModelOutputReview.css";

const value = (number) => Number.isFinite(Number(number)) ? `${Math.round(Number(number))}%` : "-";
const confidence = (number) => Number.isFinite(Number(number)) ? `${Math.round(Number(number) * 100)}%` : "-";
const text = (item) => item || "-";

function Score({ label, score, level, confidenceValue }) {
  return <div className="resume-model-output__score">
    <span>{label}</span>
    <strong>{value(score)}</strong>
    <small>{text(level)} - confidence {confidence(confidenceValue)}</small>
  </div>;
}

function ModelOutputReview({ skill }) {
  return <section className="resume-model-output" aria-label={`${skill.name} model output review`}>
    <div className="resume-model-output__heading"><strong>Model output review</strong><small>{text(skill.modelVersion)} - {text(skill.modelScoreType)}</small></div>
    <div className="resume-model-output__scores">
      <Score label="Project strength" score={skill.modelProjectStrength} level={skill.modelProjectStrengthLevel || skill.modelProjectLevel} confidenceValue={skill.modelProjectStrengthConfidence} />
      <Score label="Skill evidence" score={skill.modelSkillEvidenceStrength} level={skill.modelSkillStrengthLevel || skill.modelSkillProficiency || (skill.modelSkillEvidenceStrength != null ? skill.level : "")} confidenceValue={skill.modelSkillStrengthConfidence} />
      <Score label="Experience-project alignment" score={skill.modelExperienceProjectAlignment} level={skill.modelAlignmentLevel} confidenceValue={skill.modelAlignmentConfidence} />
    </div>
    <div className="resume-model-output__meta"><span>Estimated skill experience <b>{Number.isFinite(Number(skill.modelExperienceYears)) ? `${skill.modelExperienceYears} years` : "-"}</b></span><span>Evidence contexts <b>{text(skill.modelEvidenceCount)}</b></span></div>
  </section>;
}

export default ModelOutputReview;
