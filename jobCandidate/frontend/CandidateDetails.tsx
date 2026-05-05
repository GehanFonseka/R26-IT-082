const CandidateDetails = ({ candidate }: any) => {
  return (
    <div>
      <h3>Candidate Details</h3>
      <p>Name: {candidate.name}</p>
      <p>Experience: {candidate.experience} years</p>
    </div>
  );
};

export default CandidateDetails;