const text = (value, limit) => String(value ?? "").trim().slice(0, limit);
const list = (value, limit = 30) => {
  const values = Array.isArray(value) ? value : String(value ?? "").split(",");
  return values.map((item) => text(item, 100)).filter(Boolean).slice(0, limit);
};
const snapshot = (value) => {
  const serialized = JSON.stringify(value);
  if (serialized.length > 100000) throw Object.assign(new Error("Candidate analysis is too large"), { statusCode: 413 });
  return JSON.parse(serialized);
};

// Browsers expect SDP records to use CRLF separators and to end with a
// separator. Normalising here also repairs older room records that were saved
// without the final CRLF.
export const normalizeSessionDescription = (value) => {
  const normalized = String(value ?? "")
    .replace(/\\r\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .join("\r\n");
  return normalized ? `${normalized}\r\n` : "";
};

export const validateJob = (body = {}) => {
  const title = text(body.title, 160);
  if (title.length < 2) throw Object.assign(new Error("A job title is required"), { statusCode: 400 });
  const company = text(body.company, 160);
  if (company.length < 2) throw Object.assign(new Error("A company name is required"), { statusCode: 400 });
  return {
    title, company, location: text(body.location, 160), employmentType: text(body.employmentType, 80),
    seniority: text(body.seniority, 80), industry: text(body.industry, 120),
    description: text(body.description, 6000), responsibilities: text(body.responsibilities, 6000),
    requirements: text(body.requirements, 6000), mustHaveSkills: list(body.mustHaveSkills),
    niceToHaveSkills: list(body.niceToHaveSkills), status: body.status === "closed" ? "closed" : "open",
  };
};

export const validateApplication = (body = {}) => ({
  coverLetter: text(body.coverLetter, 5000),
  candidate: body.candidate && typeof body.candidate === "object" ? body.candidate : {},
  ...(body.candidateAnalysis && typeof body.candidateAnalysis === "object" ? { candidateAnalysis: snapshot(body.candidateAnalysis) } : {}),
  ...(body.matchScore && typeof body.matchScore === "object" ? { matchScore: validateMatchScore(body.matchScore) } : {}),
});

export const validateMatchScore = (body = {}) => {
  const probability = Number(body.probability);
  const percentage = Number(body.percentage);
  if (!Number.isFinite(probability) || probability < 0 || probability > 1 || !Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
    throw Object.assign(new Error("A valid match score is required"), { statusCode: 400 });
  }
  return {
    probability,
    percentage: Number(percentage.toFixed(2)),
    threshold: Number(body.threshold),
    classification: text(body.classification, 80),
    model: text(body.model, 180),
    inputVersion: text(body.inputVersion, 80),
  };
};

export const validateApplicationStatus = (body = {}) => {
  const allowed = ["new", "reviewing", "shortlisted", "rejected", "hired"];
  if (!allowed.includes(body.status)) throw Object.assign(new Error("Invalid application status"), { statusCode: 400 });
  return body.status;
};

const validateInterviewStatus = (value) => {
  const allowed = ["scheduled", "cancelled", "completed"];
  if (!allowed.includes(value)) throw Object.assign(new Error("Invalid interview status"), { statusCode: 400 });
  return value;
};

export const validateInterview = (body = {}) => {
  const jobId = text(body.jobId, 180);
  const applicationId = text(body.applicationId, 180);
  if (!jobId || !applicationId) throw Object.assign(new Error("jobId and applicationId are required"), { statusCode: 400 });
  const scheduledAt = new Date(body.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) throw Object.assign(new Error("A valid interview date and time are required"), { statusCode: 400 });
  const durationMinutes = Number(body.durationMinutes || 45);
  if (!Number.isInteger(durationMinutes) || durationMinutes < 15 || durationMinutes > 240) throw Object.assign(new Error("Interview duration must be between 15 and 240 minutes"), { statusCode: 400 });
  return {
    jobId,
    applicationId,
    scheduledAt: scheduledAt.toISOString(),
    durationMinutes,
    meetingUrl: text(body.meetingUrl, 500),
    notes: text(body.notes, 3000),
    status: body.status ? validateInterviewStatus(body.status) : "scheduled",
  };
};

export const validateInterviewUpdate = (body = {}) => {
  const changes = {};
  if (body.scheduledAt !== undefined) {
    const scheduledAt = new Date(body.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) throw Object.assign(new Error("A valid interview date and time are required"), { statusCode: 400 });
    changes.scheduledAt = scheduledAt.toISOString();
  }
  if (body.durationMinutes !== undefined) {
    const durationMinutes = Number(body.durationMinutes);
    if (!Number.isInteger(durationMinutes) || durationMinutes < 15 || durationMinutes > 240) throw Object.assign(new Error("Interview duration must be between 15 and 240 minutes"), { statusCode: 400 });
    changes.durationMinutes = durationMinutes;
  }
  if (body.meetingUrl !== undefined) changes.meetingUrl = text(body.meetingUrl, 500);
  if (body.notes !== undefined) changes.notes = text(body.notes, 3000);
  if (body.status !== undefined) changes.status = validateInterviewStatus(body.status);
  if (!Object.keys(changes).length) throw Object.assign(new Error("Interview changes are required"), { statusCode: 400 });
  return changes;
};

export const validateRoomDescription = (body = {}) => {
  const sdp = normalizeSessionDescription(text(body.sdp, 50000));
  if (sdp.length < 20) throw Object.assign(new Error("A valid WebRTC session description is required"), { statusCode: 400 });
  return { sdp };
};

export const validateVideoFrame = (body = {}) => {
  const frame = typeof body.frame === "string" ? body.frame.trim() : "";
  if (frame.length > 900000) throw Object.assign(new Error("Video frame is too large"), { statusCode: 413 });
  if (frame && !/^data:image\/(jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/.test(frame)) {
    throw Object.assign(new Error("A valid base64 video frame is required"), { statusCode: 400 });
  }
  const sequence = Number.isFinite(Number(body.sequence)) ? Number(body.sequence) : 0;
  const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim().slice(0, 120) : "";
  return { frame, sequence, sessionId };
};

export const validateTranscriptEntry = (body = {}) => {
  const transcript = text(body.text, 4000);
  if (transcript.length < 1) throw Object.assign(new Error("Transcript text is required"), { statusCode: 400 });
  return { text: transcript, language: text(body.language || "en-US", 20) };
};
