/**
 * Evaluate interview answers and generate scores
 * @param {Array<Object>} answers - Array of interview answers
 * @param {Array<Object>} questions - Array of interview questions
 * @returns {Object} Scores object with technical, communication, confidence, and overall scores
 */
export const evaluateAnswers = async (answers, questions) => {
  try {
    const scores = {
      technical: 0,
      communication: 0,
      confidence: 0,
      overall: 0,
    };

    if (!answers || answers.length === 0) {
      return scores;
    }

    // Evaluate each answer
    let totalTechnical = 0;
    let totalCommunication = 0;
    let totalConfidence = 0;

    answers.forEach((answer) => {
      // Technical evaluation (based on answer length and complexity indicators)
      const answerLength = answer.answer ? answer.answer.split(' ').length : 0;
      const technicalScore = Math.min((answerLength / 50) * 100, 100);
      totalTechnical += technicalScore;

      // Communication evaluation (clarity indicators)
      const communicationScore = evaluateCommunication(answer.answer || '');
      totalCommunication += communicationScore;

      // Confidence evaluation (based on provided confidence level if available)
      const confidenceScore = answer.confidence || 50;
      totalConfidence += confidenceScore;
    });

    scores.technical = Math.round(totalTechnical / answers.length);
    scores.communication = Math.round(totalCommunication / answers.length);
    scores.confidence = Math.round(totalConfidence / answers.length);
    scores.overall = Math.round(
      (scores.technical + scores.communication + scores.confidence) / 3
    );

    return scores;
  } catch (error) {
    console.error('Interview answer evaluation error:', error.message);
    return {
      technical: 0,
      communication: 0,
      confidence: 0,
      overall: 0,
    };
  }
};

/**
 * Evaluate communication quality in answer text
 * @param {string} answer - Candidate's answer text
 * @returns {number} Communication score (0-100)
 */
const evaluateCommunication = (answer) => {
  if (!answer) return 20;

  let score = 50; // Base score

  // Check for clarity
  const sentences = answer.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  if (sentences.length > 2) score += 15;

  // Check for examples
  if (/example|instance|like|such as/i.test(answer)) score += 15;

  // Check for structure
  if (/however|therefore|additionally|furthermore|in conclusion/i.test(answer)) score += 10;

  // Check for technical terminology
  if (/technical|implementation|architecture|design|algorithm/i.test(answer)) score += 10;

  return Math.min(score, 100);
};

/**
 * Generate feedback based on interview scores
 * @param {Object} scores - Interview scores object
 * @param {Array<Object>} answers - Interview answers
 * @returns {string} Feedback message
 */
export const generateFeedback = (scores, answers) => {
  let feedback = '';

  if (scores.technical >= 75) {
    feedback += 'Strong technical knowledge demonstrated. ';
  } else if (scores.technical >= 50) {
    feedback += 'Adequate technical understanding. ';
  } else {
    feedback += 'Consider strengthening technical skills. ';
  }

  if (scores.communication >= 75) {
    feedback += 'Excellent communication skills. ';
  } else if (scores.communication >= 50) {
    feedback += 'Good communication overall. ';
  } else {
    feedback += 'Focus on improving communication clarity. ';
  }

  if (scores.overall >= 75) {
    feedback += 'Overall, this is a strong candidate.';
  } else if (scores.overall >= 50) {
    feedback += 'Overall, a promising candidate with room for growth.';
  } else {
    feedback += 'Overall, additional preparation may be beneficial.';
  }

  return feedback;
};
