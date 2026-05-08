/**
 * AI Module 3: AI-Based Interview Evaluation
 * Features:
 * - Evaluates candidate responses (text, MCQ, video)
 * - Analyzes communication, confidence, and clarity
 * - Supports multiple interview formats
 * - Generates detailed performance metrics
 */

/**
 * Evaluate interview response and generate score
 */
export const evaluateInterviewResponse = async (interview) => {
  try {
    const evaluation = {
      overall_score: 0,
      communication_score: 0,
      confidence_score: 0,
      clarity_score: 0,
      relevance_score: 0,
      completeness_score: 0,
      interview_type: interview.type || 'text',
      evaluation_details: {},
      feedback: {},
      recommendations: [],
      evaluation_timestamp: new Date(),
    };

    if (interview.type === 'mcq') {
      evaluation.mcq_evaluation = evaluateMCQResponse(interview);
      evaluation.overall_score = evaluation.mcq_evaluation.score;
    } else if (interview.type === 'text') {
      evaluation.text_evaluation = evaluateTextResponse(interview);
      const textEval = evaluation.text_evaluation;
      
      evaluation.communication_score = calculateCommunicationScore(interview.response);
      evaluation.confidence_score = calculateConfidenceScore(interview.response);
      evaluation.clarity_score = calculateClarityScore(interview.response);
      evaluation.relevance_score = calculateRelevanceScore(interview.response, interview.question);
      evaluation.completeness_score = calculateCompletenessScore(interview.response);

      evaluation.overall_score = Math.round(
        (evaluation.communication_score +
          evaluation.confidence_score +
          evaluation.clarity_score +
          evaluation.relevance_score +
          evaluation.completeness_score) / 5
      );

      evaluation.evaluation_details = {
        communication: evaluation.communication_score,
        confidence: evaluation.confidence_score,
        clarity: evaluation.clarity_score,
        relevance: evaluation.relevance_score,
        completeness: evaluation.completeness_score,
      };

      evaluation.feedback = generateTextFeedback(evaluation.evaluation_details);
    } else if (interview.type === 'video') {
      evaluation.video_evaluation = evaluateVideoResponse(interview);
      const videoEval = evaluation.video_evaluation;

      evaluation.overall_score = videoEval.overall_score;
      evaluation.communication_score = videoEval.communication_score;
      evaluation.confidence_score = videoEval.confidence_score;
      evaluation.clarity_score = videoEval.clarity_score;

      evaluation.evaluation_details = videoEval.details;
      evaluation.feedback = videoEval.feedback;
    }

    // Generate recommendations
    evaluation.recommendations = generateRecommendations(evaluation.overall_score, evaluation.evaluation_details);

    // Determine pass/fail
    evaluation.result = evaluation.overall_score >= 60 ? 'pass' : 'fail';

    return evaluation;
  } catch (error) {
    console.error('Interview evaluation error:', error);
    throw error;
  }
};

/**
 * Evaluate MCQ (Multiple Choice Question) response
 */
const evaluateMCQResponse = (interview) => {
  const isCorrect = interview.selectedAnswer === interview.correctAnswer;
  const score = isCorrect ? 100 : 0;

  const difficulty = interview.difficulty || 'medium';
  const difficultyWeights = { easy: 1, medium: 1.5, hard: 2 };
  const weightedScore = (score / 100) * difficultyWeights[difficulty] * 100;

  return {
    question: interview.question,
    selected_answer: interview.selectedAnswer,
    correct_answer: interview.correctAnswer,
    is_correct: isCorrect,
    score: isCorrect ? 100 : 0,
    weighted_score: Math.min(100, weightedScore),
    difficulty,
    explanation: interview.explanation || '',
  };
};


const evaluateTextResponse = (interview) => {
  const response = interview.response || '';
  const question = interview.question || '';

  return {
    question,
    response: response.substring(0, 200) + (response.length > 200 ? '...' : ''),
    word_count: response.split(/\s+/).length,
    sentence_count: response.split(/[.!?]+/).length - 1,
  };
};

/**
 * Evaluate video response
 */
const evaluateVideoResponse = (interview) => {
  const videoMetadata = interview.videoMetadata || {};

  // Simulate video analysis (in production, use computer vision/speech recognition)
  const communicationScore = analyzeVideoCommunication(videoMetadata);
  const confidenceScore = analyzeVideoConfidence(videoMetadata);
  const clarityScore = analyzeVideoClarity(videoMetadata);
  const eyeContactScore = analyzeEyeContact(videoMetadata);
  const gestures = analyzeGestures(videoMetadata);

  const overallScore = Math.round(
    (communicationScore + confidenceScore + clarityScore + eyeContactScore) / 4
  );

  return {
    overall_score: overallScore,
    communication_score: communicationScore,
    confidence_score: confidenceScore,
    clarity_score: clarityScore,
    eye_contact_score: eyeContactScore,
    gestures: gestures,
    duration: videoMetadata.duration || 0,
    details: {
      communication: communicationScore,
      confidence: confidenceScore,
      clarity: clarityScore,
      eye_contact: eyeContactScore,
    },
    feedback: generateVideoFeedback({
      communication: communicationScore,
      confidence: confidenceScore,
      clarity: clarityScore,
      eye_contact: eyeContactScore,
    }),
  };
};

/**
 * Calculate communication score (0-100)
 */
const calculateCommunicationScore = (response) => {
  if (!response) return 0;

  const lowerResponse = response.toLowerCase();
  const communicationIndicators = {
    positive: [
      'we', 'team', 'collaborate', 'communication', 'listening',
      'understood', 'explained', 'discussed', 'feedback', 'engaged'
    ],
    negative: ['uh', 'um', 'like', 'basically', 'actually'],
  };

  const positiveCount = communicationIndicators.positive.filter(
    word => lowerResponse.includes(word)
  ).length;

  const negativeCount = communicationIndicators.negative.filter(
    word => lowerResponse.match(new RegExp(`\\b${word}\\b`, 'g'))
  ).length;

  const score = Math.min(100, (positiveCount * 10) - (negativeCount * 5));
  return Math.max(0, score);
};

/**
 * Calculate confidence score (0-100)
 */
const calculateConfidenceScore = (response) => {
  if (!response) return 0;

  const lowerResponse = response.toLowerCase();
  const confidenceIndicators = {
    high: [
      "i'm confident", "i can", "i will", "i know", "i believe",
      "definitely", "absolutely", "certainly", "clearly", "proven"
    ],
    low: [
      'maybe', 'maybe', 'perhaps', 'probably', 'i think', 'possibly',
      'i guess', 'i suppose', 'might', 'sort of', "i'm not sure"
    ],
  };

  const highConfidenceCount = confidenceIndicators.high.filter(
    phrase => lowerResponse.includes(phrase)
  ).length;

  const lowConfidenceCount = confidenceIndicators.low.filter(
    phrase => lowerResponse.includes(phrase)
  ).length;

  const score = 50 + (highConfidenceCount * 10) - (lowConfidenceCount * 8);
  return Math.max(0, Math.min(100, score));
};

/**
 * Calculate clarity score (0-100)
 */
const calculateClarityScore = (response) => {
  if (!response) return 0;

  const words = response.split(/\s+/).length;
  const sentences = response.split(/[.!?]+/).length - 1;

  // Optimal sentence length is 15-20 words
  const avgWordPerSentence = sentences > 0 ? words / sentences : words;
  const clarityFromLength = Math.max(0, 100 - Math.abs(avgWordPerSentence - 17.5) * 2);

  // Check for clarity phrases
  const clarityPhrases = [
    'to summarize', 'in other words', 'let me explain', 'clearly',
    'for example', 'specifically', 'in detail', 'step by step'
  ];

  const lowerResponse = response.toLowerCase();
  const clarityCount = clarityPhrases.filter(
    phrase => lowerResponse.includes(phrase)
  ).length;

  const clarityFromPhrases = Math.min(30, clarityCount * 10);

  return Math.round((clarityFromLength + clarityFromPhrases) / 2);
};

/**
 * Calculate relevance score (0-100)
 */
const calculateRelevanceScore = (response, question) => {
  if (!response || !question) return 50;

  const lowerResponse = response.toLowerCase();
  const lowerQuestion = question.toLowerCase();

  // Extract key terms from question
  const questionWords = lowerQuestion.split(/\s+/).filter(w => w.length > 4);
  const matchedWords = questionWords.filter(w => lowerResponse.includes(w));
  const relevanceScore = (matchedWords.length / (questionWords.length || 1)) * 100;

  return Math.round(Math.min(100, relevanceScore));
};

/**
 * Calculate completeness score (0-100)
 */
const calculateCompletenessScore = (response) => {
  if (!response) return 0;

  const words = response.split(/\s+/).length;
  const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0).length;

  // Minimum 30 words for a complete answer
  const wordScore = Math.min(100, (words / 30) * 100);
  // Minimum 2 sentences
  const sentenceScore = Math.min(100, (sentences / 2) * 100);

  return Math.round((wordScore + sentenceScore) / 2);
};

/**
 * Analyze video communication (simulated)
 */
const analyzeVideoCommunication = (videoMetadata) => {
  // In production, use speech recognition and NLP
  const speakingRate = videoMetadata.speakingRate || 'moderate'; // slow, moderate, fast
  const pauseDuration = videoMetadata.pauseDuration || 0;
  const fillerWords = videoMetadata.fillerWords || 0;

  let score = 70;
  if (speakingRate === 'moderate') score += 15;
  if (pauseDuration < 5) score += 10;
  if (fillerWords < 5) score += 5;

  return Math.min(100, score);
};

/**
 * Analyze video confidence (simulated)
 */
const analyzeVideoConfidence = (videoMetadata) => {
  // In production, use facial expression and voice analysis
  const voiceTone = videoMetadata.voiceTone || 'neutral';
  const stuttering = videoMetadata.stuttering || false;
  const facialExpressions = videoMetadata.facialExpressions || 'neutral';

  let score = 70;
  if (voiceTone === 'confident') score += 15;
  if (!stuttering) score += 10;
  if (facialExpressions === 'positive') score += 5;

  return Math.min(100, score);
};

/**
 * Analyze video clarity (simulated)
 */
const analyzeVideoClarity = (videoMetadata) => {
  const audioQuality = videoMetadata.audioQuality || 'good'; // poor, good, excellent
  const backgroundNoise = videoMetadata.backgroundNoise || 'some';
  const articulation = videoMetadata.articulation || 'clear';

  let score = 70;
  if (audioQuality === 'excellent') score += 15;
  if (backgroundNoise === 'none') score += 10;
  if (articulation === 'clear') score += 5;

  return Math.min(100, score);
};

/**
 * Analyze eye contact (simulated)
 */
const analyzeEyeContact = (videoMetadata) => {
  const eyeContact = videoMetadata.eyeContact || 'moderate'; // poor, moderate, good
  const facingCamera = videoMetadata.facingCamera || true;

  let score = 50;
  if (eyeContact === 'good') score += 30;
  if (eyeContact === 'moderate') score += 15;
  if (facingCamera) score += 20;

  return Math.min(100, score);
};

/**
 * Analyze gestures (simulated)
 */
const analyzeGestures = (videoMetadata) => {
  const gesturing = videoMetadata.gesturing || 'moderate';
  const handMovements = videoMetadata.handMovements || 'natural';

  const analysis = {
    frequency: gesturing,
    naturalness: handMovements,
    score: 0,
  };

  if (gesturing === 'appropriate') analysis.score = 85;
  else if (gesturing === 'moderate') analysis.score = 70;
  else analysis.score = 40;

  if (handMovements === 'natural') analysis.score += 10;

  return analysis;
};

/**
 * Generate feedback for text responses
 */
const generateTextFeedback = (scores) => {
  const feedback = {};

  if (scores.communication < 60) {
    feedback.communication = 'Try using more collaborative language and team-focused terminology.';
  } else if (scores.communication >= 80) {
    feedback.communication = 'Excellent communication style with collaborative approach.';
  } else {
    feedback.communication = 'Good communication. Consider using more specific examples.';
  }

  if (scores.confidence < 60) {
    feedback.confidence = 'Use more assertive language and avoid hedging phrases like "maybe" or "I think".';
  } else if (scores.confidence >= 80) {
    feedback.confidence = 'Strong confidence demonstrated in your response.';
  } else {
    feedback.confidence = 'Decent confidence level. Be more direct in your statements.';
  }

  if (scores.clarity < 60) {
    feedback.clarity = 'Improve clarity by using shorter sentences and examples.';
  } else if (scores.clarity >= 80) {
    feedback.clarity = 'Very clear and well-structured response.';
  } else {
    feedback.clarity = 'Good clarity overall. Consider adding more specific examples.';
  }

  if (scores.relevance < 60) {
    feedback.relevance = 'Your answer deviates from the question. Focus on directly answering what was asked.';
  } else if (scores.relevance >= 80) {
    feedback.relevance = 'Highly relevant and focused response to the question.';
  } else {
    feedback.relevance = 'Mostly relevant answer with some tangential points.';
  }

  if (scores.completeness < 60) {
    feedback.completeness = 'Provide more detailed and complete answers with multiple supporting points.';
  } else if (scores.completeness >= 80) {
    feedback.completeness = 'Comprehensive and complete response with good depth.';
  } else {
    feedback.completeness = 'Adequate answer but could include more supporting details.';
  }

  return feedback;
};

/**
 * Generate feedback for video responses
 */
const generateVideoFeedback = (scores) => {
  const feedback = {};

  if (scores.communication < 60) {
    feedback.communication = 'Work on pacing and clarity of speech. Reduce filler words.';
  } else if (scores.communication >= 80) {
    feedback.communication = 'Excellent communication with clear and confident delivery.';
  } else {
    feedback.communication = 'Good communication. Practice more to improve fluency.';
  }

  if (scores.confidence < 60) {
    feedback.confidence = 'Build confidence by practicing more. Maintain steady voice tone.';
  } else if (scores.confidence >= 80) {
    feedback.confidence = 'You exude confidence. Maintain this in interviews.';
  } else {
    feedback.confidence = 'Good confidence level. Work on consistency throughout responses.';
  }

  if (scores.eye_contact < 60) {
    feedback.eye_contact = 'Improve eye contact by looking directly at the camera more consistently.';
  } else if (scores.eye_contact >= 80) {
    feedback.eye_contact = 'Excellent eye contact and camera presence.';
  } else {
    feedback.eye_contact = 'Good eye contact. Try to maintain it throughout the interview.';
  }

  return feedback;
};

/**
 * Generate recommendations based on evaluation scores
 */
const generateRecommendations = (overallScore, evaluationDetails) => {
  const recommendations = [];

  if (overallScore >= 80) {
    recommendations.push('Strong candidate - Recommended for next round');
  } else if (overallScore >= 60) {
    recommendations.push('Candidate shows potential - Consider for further assessment');
  } else {
    recommendations.push('Candidate below expectations - May need to reassess fit');
  }

  // Specific recommendations
  if (evaluationDetails.communication && evaluationDetails.communication < 60) {
    recommendations.push('Focus interview preparation on communication skills');
  }

  if (evaluationDetails.confidence && evaluationDetails.confidence < 60) {
    recommendations.push('Consider confidence-building coaching before next interview');
  }

  if (evaluationDetails.relevance && evaluationDetails.relevance < 60) {
    recommendations.push('Work on understanding and directly addressing questions');
  }

  return recommendations;
};

export default {
  evaluateInterviewResponse,
};
