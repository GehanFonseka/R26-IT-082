import { createHash } from "node:crypto";
import { analysisRepository } from "../repositories/analysisRepository.js";
import { getInterviewContext } from "./contextClient.js";
import { calculateSpeechMetrics } from "./metricsService.js";
import { scoreInterviewAnswer } from "./answerModelClient.js";
import { analyzeAnswer, analyzeQuestionRelevance } from "./scoringService.js";
import { pairTranscript } from "./transcriptService.js";

const hash = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const average = (values) => values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;

const analyzePair = async (pair, context, references, req) => {
  const questionRelevance = await analyzeQuestionRelevance(pair.question, context.job || {});
  const answer = await analyzeAnswer(pair, context.job || {}, references);
  let modelScore = null;
  let modelError = "";
  if (pair.answer) {
    try {
      modelScore = await scoreInterviewAnswer(pair.question, answer.plan.referenceAnswer, pair.answer, req);
    } catch (error) {
      modelError = error.message || "Interview answer model was unavailable";
    }
  }
  const answerScore = modelScore?.score ?? answer.answerScore ?? 0;
  const classification = modelScore?.rating ?? answer.classification;
  const modelNeedsReview = modelScore ? ["Wrong", "Poor", "Average"].includes(modelScore.rating) : answer.needsReview;
  return {
    questionId: pair.questionId,
    question: pair.question,
    answer: pair.answer,
    questionRelevance,
    referenceAnswer: answer.plan.referenceAnswer,
    referenceSource: answer.plan.referenceSource,
    answerRelevanceScore: answer.answerRelevanceScore,
    referenceMatchScore: answer.referenceMatchScore,
    keyConceptCoverageScore: answer.keyConceptCoverageScore,
    concepts: answer.concepts,
    incorrectConcepts: answer.incorrectConcepts,
    speechMetrics: calculateSpeechMetrics(pair),
    analysisConfidence: modelScore?.confidence ?? answer.confidence,
    answerScore,
    classification,
    needsReview: classification === "Unanswered" || modelNeedsReview || classification === "Needs review",
    scoringModel: modelScore?.modelId || "local-nli-fallback",
    modelScore,
    ...(modelError ? { modelError } : {}),
    ruleBasedAnalysis: {
      answerScore: answer.answerScore ?? 0,
      classification: answer.classification,
      confidence: answer.confidence,
    },
  };
};

export const runInterviewAnalysis = async (interviewId, req, references = []) => {
  const context = await getInterviewContext(interviewId, req);
  const pairs = pairTranscript(context.transcript || []);
  if (!pairs.length) throw Object.assign(new Error("At least one interviewer question is required"), { statusCode: 422 });
  const questionAnswers = [];
  for (const pair of pairs) questionAnswers.push(await analyzePair(pair, context, references, req));
  const answered = questionAnswers.filter((item) => item.answer);
  const summary = {
    overallScore: average(answered.map((item) => item.answerScore)),
    questionRelevance: average(questionAnswers.map((item) => item.questionRelevance.score)),
    answerCount: answered.length,
    questionCount: questionAnswers.length,
    strongAnswers: answered.filter((item) => ["Good", "Excellent", "Strong answer"].includes(item.classification)).length,
    needsReview: questionAnswers.filter((item) => item.needsReview).length,
    unanswered: questionAnswers.length - answered.length,
    modelScoredCount: answered.filter((item) => item.modelScore).length,
    modelUnavailableCount: answered.filter((item) => !item.modelScore).length,
  };
  const modelScored = questionAnswers.filter((item) => item.modelScore);
  const modelStatus = !answered.length ? "not-run" : modelScored.length === answered.length ? "used" : modelScored.length ? "partial" : "unavailable";
  const result = {
    interviewId,
    status: "completed",
    sourceTranscriptHash: hash(context.transcript || []),
    model: modelScored.length ? modelScored[0].modelScore.modelId : "local-nli-fallback",
    modelStatus,
    summary,
    questionAnswers,
    generatedAt: new Date().toISOString(),
  };
  return analysisRepository.save(result);
};

export const getInterviewAnalysis = (interviewId) => analysisRepository.get(interviewId);
