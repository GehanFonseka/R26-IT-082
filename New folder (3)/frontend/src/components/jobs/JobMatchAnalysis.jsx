import { useNavigate } from "react-router-dom";
import Icon from "../common/Icon";
import "./JobMatchAnalysis.css";

function JobMatchAnalysis({ job }) {
  const navigate = useNavigate();

  return <div className="job-match-analysis">
    <button className="job-match-analysis__button" type="button" onClick={() => navigate(`/jobs/analyze/${job.id}`)}>
      <Icon name="activity" size={14} />Analyze
    </button>
  </div>;
}

export default JobMatchAnalysis;
