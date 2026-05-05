import React, { useState } from "react";
import CandidateList from "../frontend/CandidateList";
import MatchResultCard from "../frontend/MatchResultCard";
import ExplanationPanel from "../frontend/ExplanationPanel";

const MatchDashboard = () => {
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  return (
    <div>
      <h1>Job Candidate Matching Dashboard</h1>

      <CandidateList onSelect={setSelectedCandidate} />

      {selectedCandidate && (
        <>
          <MatchResultCard candidate={selectedCandidate} />
          <ExplanationPanel candidate={selectedCandidate} />
        </>
      )}
    </div>
  );
};

export default MatchDashboard;
