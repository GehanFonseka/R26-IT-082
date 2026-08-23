const headers = [
  ["summary", /^(professional\s+)?summary|profile|about\s+me|objective$/i],
  ["experience", /^(professional\s+)?(work\s+)?experience|employment\s+history|career\s+history$/i],
  ["education", /^education(al\s+background)?|academic\s+qualifications?$/i],
  ["skills", /^(technical\s+|core\s+|key\s+|professional\s+)?skills?|competenc(y|ies)|technologies$/i],
  ["projects", /^(?:(?:selected|personal|academic|relevant|featured|major)\s+)?projects?(?:\s+(?:experience|work|portfolio))?$|^(?:project\s+)?portfolio(?:\s+projects?)?$/i],
  ["certifications", /^(professional\s+|relevant\s+|industry\s+)?certifications?|licenses?|credentials?$/i],
];

const cleanLine = (line) => line.replace(/^[^\p{L}\p{N}]+/u, "").trim();
const headerName = (line) => {
  const candidate = cleanLine(line).replace(/[#:|_-]+$/, "").trim();
  return candidate.length <= 45 ? headers.find(([, rule]) => rule.test(candidate))?.[0] : null;
};

const parseSections = (text) => {
  const sections = { other: [] };
  let current = "other";
  for (const rawLine of text.split(/\r?\n/)) {
    const line = cleanLine(rawLine);
    if (!line) continue;
    const header = headerName(line);
    if (header) { current = header; sections[current] ??= []; continue; }
    sections[current] ??= [];
    sections[current].push(line);
  }
  return sections;
};

const firstNonContactLine = (text) => text.split(/\r?\n/).slice(0, 12).map(cleanLine).find((line) => (
  line && !headerName(line) && !/@|https?:\/\/|www\.|(?:\+?\d[\d ()-]{7,})/i.test(line) && line.split(/\s+/).length <= 10
)) ?? "";

const sectionText = (section = [], limit = 800) => section.join(" ").trim().slice(0, limit);
const sectionItems = (section = [], limit = 1400) => section.filter(Boolean).join("; ").slice(0, limit);
const inlineSection = (text, labels, nextLabels, limit) => {
  const match = text.replace(/\s+/g, " ").match(new RegExp(`\\b(?:${labels})\\b\\s*[:\\-]\\s*(.*?)(?=\\s+\\b(?:${nextLabels})\\b\\s*[:\\-]\\s*|$)`, "i"));
  return match?.[1]?.trim().slice(0, limit) ?? "";
};
const list = (value) => String(value ?? "").split(/[|,;\n]+/).map((item) => item.trim()).filter(Boolean);
const projectMarker = /^(?:project\s+(?:name|title)|name)\s*[:\-]\s*(.+)$/i;
const dateOnly = /^(?:[A-Za-z]{3,9}\s+)?(?:19|20)\d{2}\s*[-–—]\s*(?:(?:[A-Za-z]{3,9}\s+)?(?:19|20)\d{2}|present|current)$/i;
const projectDescription = /^(?:built|developed|designed|created|implemented|contributed|worked|supported|fine[- ]?tuned|exposed|applied|optimized|reduced|delivered|integrated|deployed|maintained|engineered|helped|led|used|responsible)\b/i;
const projectTitle = (line) => Boolean(line)
  && !projectMarker.test(line)
  && !dateOnly.test(line)
  && !/:/.test(line)
  && !/[.!?]$/.test(line)
  && !projectDescription.test(line)
  && line.length <= 140;

const structuredProjects = (items) => {
  const lines = items.map(cleanLine).filter(Boolean);
  const hasMarkers = lines.some((line) => projectMarker.test(line));
  const hasDates = lines.some((line) => dateOnly.test(line));
  if (!hasMarkers && !hasDates) return lines.slice(0, 30);

  const projects = [];
  let current = null;
  const flush = () => {
    if (!current) return;
    // Keep each project as one saved textarea line. Semicolons are used by the
    // frontend as a project delimiter, so use a visual separator inside the
    // project summary instead.
    const details = current.details.join(" · ").trim();
    projects.push(`${current.name}${details ? ` — ${details}` : ""}`.slice(0, 700));
    current = null;
  };

  for (const line of lines) {
    const marker = line.match(projectMarker);
    if (marker) {
      flush();
      current = { name: marker[1].trim(), details: [] };
      continue;
    }
    if (!current && projectTitle(line)) {
      current = { name: line, details: [] };
      continue;
    }
    if (current && projectTitle(line) && current.details.length) {
      flush();
      current = { name: line, details: [] };
      continue;
    }
    if (current) current.details.push(line);
  }
  flush();
  return projects.length ? projects.slice(0, 30) : lines.slice(0, 30);
};

const inlineProjects = (text) => {
  const normalized = text.replace(/\s+/g, " ");
  const match = normalized.match(/\b(?:selected\s+|personal\s+|academic\s+|relevant\s+)?projects?(?:\s+(?:experience|work))?\s*[:\-]\s*(.*?)(?=\s+\b(?:experience|education|skills|summary|certifications?|references?)\b\s*[:\-]?\s*|$)/i);
  return match?.[1] ? list(match[1]).slice(0, 30) : [];
};

export function extractCandidateFields(text) {
  const sections = parseSections(text);
  const allText = text.replace(/\s+/g, " ");
  const firstLine = firstNonContactLine(text);
  const roleWords = ["developer", "engineer", "manager", "analyst", "designer", "specialist", "officer", "assistant", "consultant", "accountant", "teacher", "intern"];
  let role = "";
  for (const line of (sections.other ?? []).slice(0, 8)) {
    if (line === firstLine) continue;
    role = line.split(/\s*(?:\||\s{2,})/).find((part) => roleWords.some((word) => part.toLowerCase().includes(word)))?.trim() ?? "";
    if (role) break;
  }
  role ||= firstLine;
  const seniority = allText.match(/\b(associate|intern|internship|entry[- ]?level|junior|mid[- ]?level|intermediate|senior|lead|principal|manager|director|executive)\b/i)?.[1] ?? "";
  const years = allText.match(/\b(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)\b/i)?.[1] ?? "";
  const industryTerms = ["FinTech", "Banking", "Finance", "Software", "Information Technology", "Healthcare", "Education", "Marketing", "Tourism", "Retail", "Logistics", "Construction", "Manufacturing", "Telecommunications", "Insurance", "Hospitality", "Government", "E-commerce"];
  const industry = industryTerms.find((term) => new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(allText)) ?? allText.match(/\bindustry\s*[:\-]\s*([^|]+)/i)?.[1]?.trim() ?? "";
  const education = sectionText(sections.education, 600) || inlineSection(text, "education|academic\\s+qualifications?", "experience|skills|summary|certifications|projects", 600);
  const skills = sectionItems(sections.skills) || inlineSection(text, "technical\\s+skills|core\\s+skills|skills|competenc(?:y|ies)|technologies", "experience|education|summary|certifications|projects", 1200);
  const summary = sectionText(sections.summary) || inlineSection(text, "professional\\s+summary|summary|profile|objective", "experience|education|skills|certifications|projects", 900) || sectionText((sections.other ?? []).slice(1, 5), 900);
  const experience = sectionItems(sections.experience) || inlineSection(text, "professional\\s+experience|work\\s+experience|experience|employment\\s+history", "education|skills|summary|certifications|projects", 1400);
  const certifications = sectionItems(sections.certifications, 1000) || inlineSection(text, "professional\\s+certifications?|relevant\\s+certifications?|certifications?|licenses?|credentials?", "experience|education|skills|summary|projects", 1000);
  const projects = sections.projects?.length ? structuredProjects(sections.projects) : inlineProjects(text);
  return {
    role,
    seniority: seniority.replace("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
    yearsExperience: Number.parseFloat(years) || 0,
    industry,
    education,
    skills: list(skills),
    certifications: list(certifications),
    summary,
    experienceHighlights: list(experience),
    projects,
  };
}
