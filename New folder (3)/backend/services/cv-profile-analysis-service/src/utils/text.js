export const clean = (value, limit = 4000) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, limit);
export const lines = (value) => String(value ?? "").split(/\r?\n/).map((line) => line.replace(/^[^\p{L}\p{N}]+/u, "").trim()).filter(Boolean);
export const list = (value, limit = 30) => (Array.isArray(value) ? value : String(value ?? "").split(/[,;|\n]+/)).map((item) => clean(item, 120)).filter(Boolean).slice(0, limit);
export const normalize = (value) => clean(value, 140).toLowerCase().replace(/[^a-z0-9+#]+/g, " ").trim();
export const titleCase = (value) => clean(value, 120).replace(/\b\w/g, (letter) => letter.toUpperCase());
export const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value) || 0));

const headers = {
  summary: /^(professional\s+)?(summary|profile|about\s+me|objective)$/i,
  experience: /^(professional\s+|work\s+)?(experience|employment\s+history|career\s+history)$/i,
  education: /^(education|academic\s+qualifications?)$/i,
  skills: /^(technical\s+|core\s+|key\s+|professional\s+)?skills?|competenc(y|ies)|technologies$/i,
  projects: /^(?:(?:selected|personal|academic|relevant|featured|major)\s+)?projects?(?:\s+(?:experience|work|portfolio))?$|^(?:project\s+)?portfolio(?:\s+projects?)?$/i,
  certifications: /^(professional\s+|relevant\s+|industry\s+)?certifications?|licenses?|credentials?$/i,
  softSkills: /^(soft\s+skills|interpersonal\s+skills)$/i,
};

export const parseSections = (rawText) => {
  const sections = { other: [] };
  let current = "other";
  for (const line of lines(rawText)) {
    const header = Object.entries(headers).find(([, rule]) => rule.test(line.replace(/^[^\p{L}\p{N}]+/u, "").replace(/[:#]+$/, "").trim()))?.[0];
    if (header) { current = header; sections[current] ??= []; continue; }
    (sections[current] ??= []).push(line);
  }
  return sections;
};
