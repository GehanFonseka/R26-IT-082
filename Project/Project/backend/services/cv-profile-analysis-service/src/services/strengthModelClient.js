import { env } from "../config/env.js";

export const predictStrengthBatch = async (items) => {
  if (!items.length) return [];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.requestTimeoutMs);
  try {
    const response = await fetch(`${env.resumeStrengthModelUrl.replace(/\/$/, "")}/predict/batch`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ items }),
      signal: controller.signal,
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.detail?.error || body.error || body.message || `Strength model request failed (${response.status})`);
    return body.data || [];
  } finally {
    clearTimeout(timer);
  }
};
