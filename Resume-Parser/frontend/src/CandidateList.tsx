import axios from "axios";
import { useEffect, useState } from "react";

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
        <div key={c._id}>
          <h3>{c.file_name}</h3>
          <p>Skills: {c.skills.join(", ")}</p>
        </div>
      ))}
    </div>
  );
}