import React from "react";

const CandidateList = ({ onSelect }: any) => {
  return (
    <div>
      <h3>Candidate List</h3>
      <button onClick={() => onSelect({ name: "John", score: 85 })}>
        Select John
      </button>
    </div>
  );
};

export default CandidateList;