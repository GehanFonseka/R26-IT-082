import { meaningfulWords, normalizeText, percent, words } from "../utils/text.js";

const definitions = [
  ["you know", /\byou know\b/gi], ["I mean", /\bi mean\b/gi], ["kind of", /\bkind of\b/gi], ["sort of", /\bsort of\b/gi],
  ["um", /\bum\b/gi], ["uh", /\buh\b/gi], ["erm", /\berm\b/gi], ["hmm", /\bhmm\b/gi],
  ["basically", /\bbasically\b/gi], ["actually", /\bactually\b/gi], ["like", /,\s*like\b|\blike\s*,/gi],
];

export const calculateSpeechMetrics = (pair) => {
  const text = normalizeText(pair.answer); const totalWords = words(text).length; const breakdown = {};
  definitions.forEach(([name, pattern]) => { const count = text.match(pattern)?.length || 0; if (count) breakdown[name] = count; });
  const fillerWordCount = Object.values(breakdown).reduce((sum, count) => sum + count, 0);
  const start = new Date(pair.answerStartedAt || 0).getTime(); const questionEnd = new Date(pair.questionAt || 0).getTime();
  const responseTimeSeconds = start && questionEnd && start >= questionEnd ? Number(((start - questionEnd) / 1000).toFixed(1)) : null;
  const end = new Date(pair.answerEndedAt || 0).getTime();
  const answerDurationSeconds = start && end && end >= start ? Number(((end - start) / 1000).toFixed(1)) : null;
  const rate = totalWords ? percent(fillerWordCount / totalWords) : 0;
  return { totalWords, meaningfulWords: meaningfulWords(text).length, fillerWordCount, fillerPercentage: rate, breakdown, responseTimeSeconds, answerDurationSeconds };
};
