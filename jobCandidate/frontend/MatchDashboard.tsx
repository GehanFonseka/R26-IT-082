import React, { useState } from "react";
import CandidateList from "./CandidateList";
import MatchResultCard from "./MatchResultCard";
import ExplanationPanel from "./ExplanationPanel";

const MatchDashboard = () => {
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);

  return (
    <div style={{ padding: "20px" }}>
      <h1>AI Job Candidate Matching System</h1>

      <div style={{ display: "flex", gap: "20px" }}>
        <div style={{ flex: 1 }}>
          <CandidateList onSelect={setSelectedCandidate} />
        </div>

        <div style={{ flex: 2 }}>
          {selectedCandidate ? (
            <>
              <MatchResultCard candidate={selectedCandidate} />
              <ExplanationPanel candidate={selectedCandidate} />
            </>
          ) : (
            <p>Select a candidate to view results</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchDashboard;