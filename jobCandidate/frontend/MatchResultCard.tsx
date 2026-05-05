import React from "react";

const MatchResultCard = ({ candidate }: any) => {
  return (
    <div>
      <h2>Match Result</h2>
      <p>{candidate.name} - {candidate.score}%</p>
    </div>
  );
};

export default MatchResultCard;