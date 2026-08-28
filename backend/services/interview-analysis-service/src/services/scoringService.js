import { classifyPair } from "../model/nliModel.js";
import { meaningfulWords, overlapScore, percent, sentenceParts, unique } from "../utils/text.js";

const jobText = (job = {}) => [job.title, job.seniority, job.industry, ...(job.mustHaveSkills || []), ...(job.niceToHaveSkills || []), job.description, job.responsibilities, job.requirements].filter(Boolean).join(". ");
const jobSkills = (job = {}) => unique([...(job.mustHaveSkills || []), ...(job.niceToHaveSkills || [])].map((item) => String(item).trim()).filter(Boolean));
const questionKey = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const average = (items) => items.length ? items.reduce((sum, value) => sum + value, 0) / items.length : 0;
const conceptRecall = (answer, concept) => {
  const target = new Set(meaningfulWords(concept)); const source = new Set(meaningfulWords(answer));
  if (!target.size) return 0;
  return [...target].filter((word) => source.has(word)).length / target.size;
};

export const referenceFor = (pair, job, references = []) => {
  const provided = references.find((item) => item.questionId === pair.questionId || questionKey(item.question) === questionKey(pair.question));
  const referenceAnswer = String(provided?.answer || "").trim();
  const matchingSkills = jobSkills(job).filter((skill) => overlapScore(pair.question, skill) > 0 || meaningfulWords(pair.question).some((word) => meaningfulWords(skill).includes(word)));
  const explicitPoints = unique([...(provided?.keyConcepts || []), ...matchingSkills]);
  const points = (explicitPoints.length ? explicitPoints : sentenceParts(referenceAnswer)).slice(0, 8);
  const concepts = points.length ? points : meaningfulWords(pair.question).slice(0, 6);
  return { referenceAnswer: referenceAnswer || `A strong answer should address: ${concepts.join(", ")}.`, referenceSource: referenceAnswer ? "provided" : "job-context", concepts, provided: Boolean(referenceAnswer) };
};

export const analyzeQuestionRelevance = async (question, job) => {
  const context = jobText(job); const lexical = overlapScore(question, context);
  const matchedJobAreas = jobSkills(job).filter((skill) => overlapScore(question, skill) > 0 || meaningfulWords(question).some((word) => meaningfulWords(skill).includes(word)));
  const nli = await classifyPair(context, `This interview question evaluates a requirement for this job: ${question}`);
  const entailment = nli.probabilities.entailment || 0;
  const score = Math.max(Math.round(entailment * 70 + lexical * 30), matchedJobAreas.length ? 78 : 0);
  return { score, classification: score >= 60 ? "Relevant" : "Needs review", matchedJobAreas, nliConfidence: nli.confidence };
};

export const analyzeAnswer = async (pair, job, references) => {
  const plan = referenceFor(pair, job, references); const answer = pair.answer;
  if (!answer) return { plan, answerRelevanceScore: 0, referenceMatchScore: 0, keyConceptCoverageScore: 0, concepts: [], incorrectConcepts: [], confidence: 0, classification: "Unanswered" };
  const answerNli = await classifyPair(answer, `This answer directly addresses the interview question: ${pair.question}`);
  const answerOverlap = conceptRecall(answer, pair.question);
  const relevance = Math.max(Math.round((answerNli.probabilities.entailment || 0) * 70 + overlapScore(answer, pair.question) * 30), Math.round(answerOverlap * 100));
  const concepts = [];
  for (const concept of plan.concepts) {
    const result = await classifyPair(answer, `The candidate answer demonstrates this concept: ${concept}.`);
    const label = result.label.includes("entail") ? "covered" : result.label.includes("contrad") ? "contradicted" : "not_mentioned";
    const lexicalSupport = conceptRecall(answer, concept);
    const contradiction = result.probabilities.contradiction || 0;
    const supported = label === "covered" || lexicalSupport >= 0.5;
    const status = result.label.includes("contrad") && contradiction >= 0.6 ? "contradicted" : supported ? "covered" : "not_mentioned";
    const supportScore = Math.round(Math.max(result.probabilities.entailment || 0, lexicalSupport) * 100);
    concepts.push({ concept, status, confidence: result.confidence, supportScore, lexicalSupport, probabilities: result.probabilities });
  }
  const coverage = concepts.length ? Math.round(average(concepts.map((item) => item.status === "covered" ? 100 : 0))) : relevance;
  const referenceMatch = plan.provided ? Math.round(average(concepts.map((item) => item.supportScore)) || 0) : null;
  const answerScore = Math.round(relevance * 0.4 + coverage * 0.4 + (referenceMatch ?? coverage) * 0.2);
  const incorrectConcepts = concepts.filter((item) => item.status === "contradicted").map((item) => item.concept);
  const confidence = Math.round(average([answerNli.confidence, ...concepts.map((item) => item.confidence)] || [0]) * 100);
  return { plan, answerRelevanceScore: relevance, referenceMatchScore: referenceMatch, keyConceptCoverageScore: coverage, concepts, incorrectConcepts, confidence, answerScore, classification: incorrectConcepts.length ? "Needs review" : answerScore >= 80 ? "Strong answer" : answerScore >= 60 ? "Acceptable answer" : "Needs review" };
};

export { questionKey };
