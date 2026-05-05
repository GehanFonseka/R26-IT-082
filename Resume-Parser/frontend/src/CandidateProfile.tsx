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
      .then((res) => setCandidate(res.data));
  }, [id]);

  if (!candidate) return <p>Loading candidate profile...</p>;

  return (
    <div className="card">
      <h2>{candidate.file_name}</h2>

      <h3>Education</h3>
      <ul>
        {candidate.education?.map((edu: string, index: number) => (
          <li key={index}>{edu}</li>
        ))}
      </ul>

      <h3>Skills</h3>
      {candidate.skills?.map((skill: string, index: number) => (
        <span key={index} className="skill-badge">
          {skill}
        </span>
      ))}

      <SkillProficiencyDashboard skills={candidate.skill_profile || []} />
    </div>
  );
}