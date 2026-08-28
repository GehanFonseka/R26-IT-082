import axios from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function CandidateList() {
  const [candidates, setCandidates] = useState<any[]>([]);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/candidates")
      .then((res) => setCandidates(res.data));
  }, []);

  return (
    <div>
      <h2>Candidate List</h2>

      {candidates.map((c) => (
        <div key={c._id} className="card">
          <h3>{c.file_name}</h3>

          {c.skills.map((skill: string, i: number) => (
            <span key={i} className="skill-badge">
              {skill}
            </span>
          ))}

          <br />
          <Link to={`/candidates/${c._id}`}>
            <button>View Profile</button>
          </Link>
        </div>
      ))}
    </div>
  );
}