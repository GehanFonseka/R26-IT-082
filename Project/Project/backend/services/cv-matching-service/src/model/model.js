import { createRequire } from "node:module";
import { env } from "../config/env.js";
import { compactModelText } from "./modelInput.js";

const require = createRequire(import.meta.url);
const { AutoModelForSequenceClassification, AutoTokenizer } = require("@huggingface/transformers");

const state = { tokenizer: null, model: null, loaded: false, error: null, promise: null };

export function modelStatus() {
  return { loaded: state.loaded, error: state.error?.message ?? null };
}

export async function loadModel() {
  if (state.loaded) return;
  if (!state.promise) {
    state.promise = Promise.all([
      AutoTokenizer.from_pretrained(env.modelId),
      AutoModelForSequenceClassification.from_pretrained(env.modelId),
    ]).then(([tokenizer, model]) => {
      state.tokenizer = tokenizer;
      state.model = model;
      state.loaded = true;
      state.error = null;
    }).catch((error) => {
      state.error = error;
      throw error;
    }).finally(() => { state.promise = null; });
  }
  return state.promise;
}

const sigmoid = (value) => 1 / (1 + Math.exp(-value));

export async function predict(jobText, candidateText) {
  if (!state.loaded) throw Object.assign(new Error("Hugging Face matching model is not loaded"), { statusCode: 503 });
  const inputs = await state.tokenizer(compactModelText(jobText), {
    text_pair: compactModelText(candidateText), padding: true, truncation: true, max_length: 256,
  });
  const output = await state.model(inputs);
  const logit = Number(output.logits?.data?.[0] ?? output.logits?.[0]);
  if (!Number.isFinite(logit)) throw Object.assign(new Error("Model returned an invalid logit"), { statusCode: 502 });
  return sigmoid(logit);
}
