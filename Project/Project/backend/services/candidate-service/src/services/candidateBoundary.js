export const candidateBoundary = (req, res) => res.status(501).json({
  success: false,
  message: "Candidate persistence is not configured; connect a candidate-owned repository",
  requestId: req.requestId,
});
