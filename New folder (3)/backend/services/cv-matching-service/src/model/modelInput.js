const MODEL_SIDE_CHAR_LIMIT = 440;

export const MODEL_INPUT_VERSION = "balanced-256-v2";

export const compactModelText = (value, limit = MODEL_SIDE_CHAR_LIMIT) => {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (text.length <= limit) return text;
  const boundary = text.lastIndexOf(" ", limit);
  const end = boundary > Math.floor(limit * 0.75) ? boundary : limit;
  return `${text.slice(0, end).trim()}...`;
};
