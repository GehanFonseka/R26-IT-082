/**
 * Interview answer scoring and generated feedback text.
 * Mirrors: Backend/services/interviewService.js
 */

export const evaluateAnswers = async (answers, _questions) => {
  const scores = {
    technical: 0,
    communication: 0,
    confidence: 0,
    overall: 0,
  };

  if (!answers?.length) return scores;

  let totalTechnical = 0;
  let totalCommunication = 0;
  let totalConfidence = 0;

  answers.forEach(answer => {
    const words = answer.answer ? answer.answer.split(' ').length : 0;
    totalTechnical += Math.min((words / 50) * 100, 100);
    totalCommunication += evaluateCommunication(answer.answer || '');
    totalConfidence += answer.confidence ?? 50;
  });

  const n = answers.length;
  scores.technical = Math.round(totalTechnical / n);
  scores.communication = Math.round(totalCommunication / n);
  scores.confidence = Math.round(totalConfidence / n);
  scores.overall = Math.round(
    (scores.technical + scores.communication + scores.confidence) / 3
  );

  return scores;
};

const evaluateCommunication = (answer) => {
  if (!answer) return 20;
  let score = 50;
  const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length > 2) score += 15;
  if (/example|instance|like|such as/i.test(answer)) score += 15;
  if (/however|therefore|additionally|furthermore|in conclusion/i.test(answer)) score += 10;
  if (/technical|implementation|architecture|design|algorithm/i.test(answer)) score += 10;
  return Math.min(score, 100);
};

export const generateFeedback = (scores) => {
  let feedback = '';
  if (scores.technical >= 75) feedback += 'Strong technical knowledge demonstrated. ';
  else if (scores.technical >= 50) feedback += 'Adequate technical understanding. ';
  else feedback += 'Consider strengthening technical skills. ';

  if (scores.communication >= 75) feedback += 'Excellent communication skills. ';
  else if (scores.communication >= 50) feedback += 'Good communication overall. ';
  else feedback += 'Focus on improving communication clarity. ';

  if (scores.overall >= 75) feedback += 'Overall, this is a strong candidate.';
  else if (scores.overall >= 50) feedback += 'Overall, a promising candidate with room for growth.';
  else feedback += 'Overall, additional preparation may be beneficial.';

  return feedback;
};
