import Icon from "../common/Icon";
import { useNavigate } from "react-router-dom";
import "./CandidateSkillsToggle.css";

const displayList = (value) => (Array.isArray(value) ? value : String(value || "").split(/[|,;\n]+/))
  .map((item) => String(item).trim())
  .filter(Boolean);

function CandidateSkillsToggle({ applicationId, candidate = {} }) {
  const navigate = useNavigate();
  const skills = displayList(candidate.candidateSkills || candidate.skills);

  return (
    <button
      className="candidate-skills-toggle"
      type="button"
      onClick={() => navigate(`/admin/applications/${applicationId}/skills`)}
      aria-label="Open candidate skill analysis"
    >
      <span>
        <span><Icon name="layers" size={14} /> Skills</span>
        <Icon className="candidate-skills-toggle__chevron" name="arrowDown" size={13} />
      </span>
    </button>
  );
}

export default CandidateSkillsToggle;
