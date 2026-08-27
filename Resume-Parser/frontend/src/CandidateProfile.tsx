import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import SkillProficiencyDashboard from "./SkillProficiencyDashboard";

export default function CandidateProfile() {
  const { id } = useParams();
  const [candidate, setCandidate] = useState<any>(null);

  useEffect(() => {
    axios
      .get(`http://127.0.0.1:8000/api/candidates/${id}`)
      .then((res) => setCandidate(res.data))
      .catch((err) => console.error(err));
  }, [id]);

  if (!candidate) return <p>Loading candidate profile...</p>;

  return (
    <div className="card">
      <h2>{candidate.file_name}</h2>

      <h3>Education</h3>
      {candidate.education?.length > 0 ? (
        <ul>
          {candidate.education.map((edu: string, index: number) => (
            <li key={index}>{edu}</li>
          ))}
        </ul>
      ) : (
        <p>No education data found.</p>
      )}

      <h3>Skills</h3>
      {candidate.skills?.length > 0 ? (
        <div>
          {candidate.skills.map((skill: string, index: number) => (
            <span key={index} className="skill-badge">
              {skill}
            </span>
          ))}
        </div>
      ) : (
        <p>No skills found.</p>
      )}

      <h3>ML Skill Explanation</h3>
      {candidate.skill_profile?.map((s: any, i: number) => (
        <div key={i} className="card">
          <strong>
            {s.skill} - {s.level} ({s.score}%)
          </strong>

          <p>
            Frequency: {s.features?.frequency ?? 0} | Experience:{" "}
            {s.features?.experience_months ?? 0} months | Project Context:{" "}
            {s.features?.project_context ? "Yes" : "No"}
          </p>

          <p>Model: {s.model || "DecisionTreeClassifier"}</p>
        </div>
      ))}

      <SkillProficiencyDashboard skills={candidate.skill_profile || []} />
    </div>
  );
}