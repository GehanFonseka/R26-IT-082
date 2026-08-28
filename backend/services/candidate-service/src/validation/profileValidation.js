const text = (value, limit) => String(value ?? "").trim().slice(0, limit);
const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

const money = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0 || amount > 1000000000) {
    throw Object.assign(new Error("Salary values must be valid non-negative amounts"), { statusCode: 400 });
  }
  return Math.round(amount);
};

const validateCompensation = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const current = money(value.current ?? value.offeredLKR);
  const expected = money(value.expected ?? value.expectedLKR);
  const market = money(value.market);
  if (current === undefined && expected === undefined && market === undefined) return undefined;
  return {
    ...(current !== undefined ? { current } : {}),
    ...(expected !== undefined ? { expected } : {}),
    ...(market !== undefined ? { market } : {}),
    currency: text(value.currency || "LKR", 8).toUpperCase(),
  };
};

const validateProfilePhoto = (value) => {
  if (value === "") return "";
  if (typeof value !== "string" || value.length > 600000) {
    throw Object.assign(new Error("Profile photo is too large"), { statusCode: 413 });
  }
  if (!/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/i.test(value)) {
    throw Object.assign(new Error("Profile photo must be a JPG, PNG or WEBP image"), { statusCode: 400 });
  }
  return value;
};

const candidateFields = (candidate = {}) => {
  const compensation = validateCompensation(candidate.compensation);
  return {
    role: text(candidate.role, 160),
    seniority: text(candidate.seniority, 80),
    yearsExperience: Number(candidate.yearsExperience) || 0,
    industry: text(candidate.industry, 120),
    education: text(candidate.education, 240),
    skills: Array.isArray(candidate.skills) ? candidate.skills.map((item) => text(item, 80)).slice(0, 40) : [],
    certifications: Array.isArray(candidate.certifications) ? candidate.certifications.map((item) => text(item, 180)).slice(0, 20) : [],
    summary: text(candidate.summary, 4000),
    experienceHighlights: Array.isArray(candidate.experienceHighlights)
      ? candidate.experienceHighlights.map((item) => text(item, 500)).slice(0, 30) : [],
    projects: Array.isArray(candidate.projects)
      ? candidate.projects.map((item) => text(item, 700)).slice(0, 30) : [],
    ...(compensation ? { compensation } : {}),
  };
};

const safeAnalysis = (analysis) => {
  if (!analysis || typeof analysis !== "object") return undefined;
  const serialized = JSON.stringify(analysis);
  if (serialized.length > 90000) throw Object.assign(new Error("CV analysis is too large"), { statusCode: 413 });
  return JSON.parse(serialized);
};

const validateCv = (cv) => {
  if (!cv || typeof cv !== "object") return undefined;
  const profileAnalysis = safeAnalysis(cv.profileAnalysis);
  return {
    fileName: text(cv.fileName, 180),
    rawText: text(cv.rawText, 50000),
    candidate: candidateFields(cv.candidate),
    ...(profileAnalysis ? { profileAnalysis } : {}),
  };
};

export const validateProfile = (body = {}) => {
  const displayName = text(body.displayName ?? body.name, 120);
  if (displayName.length < 2) throw Object.assign(new Error("A display name is required"), { statusCode: 400 });
  const compensation = validateCompensation(body.compensation);
  const profile = {
    displayName,
    headline: text(body.headline, 160),
    location: text(body.location, 120),
    skills: Array.isArray(body.skills) ? body.skills.map((item) => text(item, 80)).slice(0, 30) : [],
    metadata: typeof body.metadata === "object" && body.metadata ? body.metadata : {},
    ...(compensation ? { compensation } : {}),
  };
  if (hasOwn(body, "profilePhoto")) profile.profilePhoto = validateProfilePhoto(body.profilePhoto);
  const cv = validateCv(body.cv);
  if (cv) profile.cv = cv;
  return profile;
};
