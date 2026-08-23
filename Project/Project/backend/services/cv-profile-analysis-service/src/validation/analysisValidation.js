import { clean } from "../utils/text.js";

export const validateInput = (body = {}) => {
  const rawText = clean(body.rawText, 100000);
  if (rawText.length < 20) throw Object.assign(new Error("CV text is required before profile analysis"), { statusCode: 422 });
  if (!body.candidate || typeof body.candidate !== "object") throw Object.assign(new Error("Candidate CV fields are required"), { statusCode: 400 });
  if (body.job !== undefined && body.job !== null && typeof body.job !== "object") throw Object.assign(new Error("Job context must be an object"), { statusCode: 400 });
  return { rawText, candidate: body.candidate, job: body.job || null };
};
