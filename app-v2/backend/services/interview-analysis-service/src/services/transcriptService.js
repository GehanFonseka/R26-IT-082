import { normalizeText } from "../utils/text.js";

const isQuestion = (text) => /\?|^(what|why|how|when|where|which|who|tell me|describe|explain|walk me|can you|could you|would you|have you|do you|are you)\b/i.test(text.trim());
const roleOf = (entry) => entry.role === "admin" ? "interviewer" : "candidate";

export const normalizeTranscript = (entries = []) => entries
  .filter((entry) => normalizeText(entry.text))
  .sort((left, right) => new Date(left.createdAt || 0) - new Date(right.createdAt || 0))
  .map((entry) => ({
    id: entry.id,
    role: roleOf(entry),
    speakerName: entry.speakerName || "Participant",
    text: normalizeText(entry.text),
    createdAt: entry.createdAt,
  }));

export const pairTranscript = (entries) => {
  const turns = normalizeTranscript(entries); const pairs = [];
  turns.forEach((turn, index) => {
    if (turn.role !== "interviewer" || !isQuestion(turn.text)) return;
    const answers = []; let cursor = index + 1;
    while (cursor < turns.length && turns[cursor].role !== "interviewer") {
      if (turns[cursor].role === "candidate") answers.push(turns[cursor]);
      cursor += 1;
    }
    pairs.push({
      questionId: `question-${pairs.length + 1}-${turn.id || index}`,
      question: turn.text,
      questionAt: turn.createdAt || null,
      answerEntries: answers,
      answer: answers.map((item) => item.text).join(" "),
      answerStartedAt: answers[0]?.createdAt || null,
      answerEndedAt: answers.at(-1)?.createdAt || null,
    });
  });
  return pairs;
};
