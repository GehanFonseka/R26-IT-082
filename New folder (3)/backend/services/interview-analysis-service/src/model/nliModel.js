import { createRequire } from "node:module";
import { env } from "../config/env.js";

const require = createRequire(import.meta.url);
const {
  AutoModelForSequenceClassification,
  AutoTokenizer,
  env: transformersEnv,
} = require("@huggingface/transformers");
transformersEnv.allowRemoteModels = false;
transformersEnv.allowLocalModels = true;
transformersEnv.localModelPath = env.nliModelDir;
const state = { tokenizer: null, model: null, loaded: false, error: null, promise: null, queue: Promise.resolve() };

export const modelStatus = () => ({ loaded: state.loaded, model: env.nliModelId, modelDir: env.nliModelDir, error: state.error?.message || null });

export const loadModel = async () => {
  if (state.loaded) return;
  if (!state.promise) {
    state.promise = Promise.all([
      AutoTokenizer.from_pretrained(env.nliModelDir, { local_files_only: true }),
      AutoModelForSequenceClassification.from_pretrained(env.nliModelDir, {
        local_files_only: true,
        dtype: env.nliModelDtype,
      }),
    ]).then(([tokenizer, model]) => {
      state.tokenizer = tokenizer; state.model = model; state.loaded = true; state.error = null;
    }).catch((error) => { state.error = error; throw error; }).finally(() => { state.promise = null; });
  }
  return state.promise;
};

const softmax = (values) => {
  const max = Math.max(...values); const exps = values.map((value) => Math.exp(value - max)); const total = exps.reduce((sum, value) => sum + value, 0);
  return exps.map((value) => value / total);
};

const labelAt = (model, index) => String(model.config?.id2label?.[index] || `LABEL_${index}`).toLowerCase();

const classify = async (premise, hypothesis) => {
  if (!state.loaded) throw Object.assign(new Error("Local interview NLI model is not loaded"), { statusCode: 503 });
  const inputs = await state.tokenizer(premise, { text_pair: hypothesis, padding: true, truncation: true, max_length: 256 });
  const output = await state.model(inputs); const logits = Array.from(output.logits.data); const scores = softmax(logits);
  const probabilities = Object.fromEntries(scores.map((score, index) => [labelAt(state.model, index), Number(score.toFixed(4))]));
  const best = scores.reduce((winner, score, index) => score > winner.score ? { score, index } : winner, { score: -1, index: 0 });
  return { label: labelAt(state.model, best.index), confidence: Number(best.score.toFixed(4)), probabilities };
};

export const classifyPair = (premise, hypothesis) => {
  state.queue = state.queue.catch(() => {}).then(() => classify(premise, hypothesis));
  return state.queue;
};
