const certificateUrl = (value) => {
  if (typeof value !== "string" || value.length > 2048) return "";
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? url.href : "";
  } catch { return ""; }
};

const certificateRecord = (entry) => {
  const urls = [...new Set([entry.url, ...(Array.isArray(entry.urls) ? entry.urls : [])]
    .map(certificateUrl).filter(Boolean))].slice(0, 10);
  return { name: entry.name.trim().slice(0, 180), url: urls[0] || "", ...(urls.length > 1 ? { urls } : {}) };
};

export const validateCertificates = (value) => (Array.isArray(value) ? value : [])
  .filter((entry) => entry && typeof entry === "object" && typeof entry.name === "string")
  .map(certificateRecord)
  .filter((entry) => entry.name)
  .slice(0, 20);
