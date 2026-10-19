const text = (value, limit) => String(value ?? "").trim().slice(0, limit);

export const validateInterviewId = (value) => {
  const interviewId = text(value, 180);
  if (!interviewId) throw Object.assign(new Error("interviewId is required"), { statusCode: 400 });
  return interviewId;
};

export const validateReferences = (value) => {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw Object.assign(new Error("referenceAnswers must be an array"), { statusCode: 400 });
  return value.slice(0, 30).map((item) => ({
    questionId: text(item?.questionId, 180),
    question: text(item?.question, 1000),
    answer: text(item?.answer, 6000),
    keyConcepts: Array.isArray(item?.keyConcepts) ? item.keyConcepts.map((concept) => text(concept, 160)).filter(Boolean).slice(0, 12) : [],
  })).filter((item) => item.questionId || item.question);
};
