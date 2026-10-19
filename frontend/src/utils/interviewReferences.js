export const referenceDraft = (item, drafts = {}) => drafts[item.questionId]
  ?? (item.referenceSource === "provided" ? item.referenceAnswer || "" : "");

export const buildInterviewReferences = (questions, drafts = {}) => questions.map((item) => ({
  questionId: item.questionId,
  question: item.question,
  answer: referenceDraft(item, drafts).trim(),
})).filter((item) => item.answer);
