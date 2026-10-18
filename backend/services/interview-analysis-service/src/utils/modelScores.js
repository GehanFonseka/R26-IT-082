export const averageModelScore = (questions) => {
  const scores = questions.map((item) => item.modelScore?.score).filter((value) => Number.isFinite(value));
  return scores.length ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length) : null;
};
