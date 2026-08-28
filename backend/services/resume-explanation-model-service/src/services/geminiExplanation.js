import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";
import { explanationSchema } from "../utils/explanationSchema.js";
import { matchExplanationSchema } from "../utils/matchExplanationSchema.js";
import { buildPrompt } from "../utils/prompt.js";
import { buildMatchPrompt } from "../utils/matchPrompt.js";
import { normalizeExplanation } from "../utils/normalizeExplanation.js";
import { normalizeMatchExplanation } from "../utils/normalizeMatchExplanation.js";
import { buildAttritionPrompt } from "../utils/attritionPrompt.js";
import { attritionExplanationSchema } from "../utils/attritionExplanationSchema.js";
import { normalizeAttritionExplanation } from "../utils/normalizeAttritionExplanation.js";
import { log } from "../utils/logger.js";

const client = env.apiKey ? new GoogleGenAI({ apiKey: env.apiKey }) : null;

export const explainResume = async ({ rawText, analysis }) => {
  if (!client) throw Object.assign(new Error("GEMINI_API_KEY is not configured"), { statusCode: 503 });
  const prompt = buildPrompt({ rawText, analysis });
  if (prompt.length > env.maxInputChars) throw Object.assign(new Error("CV explanation input is too large"), { statusCode: 413 });
  try {
    const response = await client.models.generateContent({
      model: env.model,
      contents: prompt,
      config: { temperature: 0.15, maxOutputTokens: 8192, responseMimeType: "application/json", responseSchema: explanationSchema },
    });
    if (!response.text) throw new Error("Gemini returned an empty explanation");
    return normalizeExplanation(JSON.parse(response.text));
  } catch (error) {
    log("error", "gemini.explanation.failed", { model: env.model, status: error.status, reason: error.message });
    if (error.statusCode) throw error;
    throw Object.assign(new Error("Gemini explanation request failed"), { statusCode: 502, technicalError: error.message });
  }
};

export const explainMatch = async ({ rawText, candidate, job, matchResult }) => {
  if (!client) throw Object.assign(new Error("GEMINI_API_KEY is not configured"), { statusCode: 503 });
  const prompt = buildMatchPrompt({ rawText, candidate, job, matchResult });
  if (prompt.length > env.maxInputChars) throw Object.assign(new Error("Match explanation input is too large"), { statusCode: 413 });
  try {
    const response = await client.models.generateContent({ model: env.model, contents: prompt, config: { temperature: 0.15, maxOutputTokens: 8192, responseMimeType: "application/json", responseSchema: matchExplanationSchema } });
    if (!response.text) throw new Error("Gemini returned an empty match explanation");
    return normalizeMatchExplanation(JSON.parse(response.text));
  } catch (error) {
    log("error", "gemini.match-explanation.failed", { model: env.model, status: error.status, reason: error.message });
    if (error.statusCode) throw error;
    throw Object.assign(new Error("Gemini match explanation request failed"), { statusCode: 502, technicalError: error.message });
  }
};

export const explainAttrition = async ({ candidate, simulation, context, models }) => {
  if (!client) throw Object.assign(new Error("GEMINI_API_KEY is not configured"), { statusCode: 503 });
  const prompt = buildAttritionPrompt({ candidate, simulation, context, models });
  if (prompt.length > env.maxInputChars) throw Object.assign(new Error("Attrition explanation input is too large"), { statusCode: 413 });
  try {
    const response = await client.models.generateContent({
      model: env.model, contents: prompt,
      config: { temperature: 0.15, maxOutputTokens: 4096, responseMimeType: "application/json", responseSchema: attritionExplanationSchema },
    });
    if (!response.text) throw new Error("Gemini returned an empty attrition explanation");
    return { ...normalizeAttritionExplanation(JSON.parse(response.text)), model: env.model };
  } catch (error) {
    log("error", "gemini.attrition-explanation.failed", { model: env.model, status: error.status, reason: error.message });
    if (error.statusCode) throw error;
    throw Object.assign(new Error("Gemini attrition explanation request failed"), { statusCode: 502, technicalError: error.message });
  }
};
