const configuredApiBase = import.meta.env.VITE_API_BASE_URL;
const API_BASE = (configuredApiBase || (typeof window !== "undefined" ? window.location.origin : "http://localhost:8080")).replace(/\/$/, "");
const TOKEN_KEY = "lti_access_token";

export const getAccessToken = () => localStorage.getItem(TOKEN_KEY);
export const setAccessToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearAccessToken = () => localStorage.removeItem(TOKEN_KEY);

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("accept", "application/json");
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  if (options.body && !isFormData) headers.set("content-type", "application/json");
  const token = getAccessToken();
  if (token) headers.set("authorization", `Bearer ${token}`);
  const requestPath = path.startsWith("/api") ? path : `/api${path}`;
  let response;
  try {
    response = await fetch(`${API_BASE}${requestPath}`, { ...options, headers });
  } catch (error) {
    throw new Error(`API Gateway is unavailable: ${error.message}`);
  }
  const body = await response.json().catch(() => ({}));
  if (response.status === 401) {
    clearAccessToken();
    localStorage.removeItem("lti_current_user");
    window.dispatchEvent(new Event("lti-auth-expired"));
  }
  if (!response.ok) {
    const detail = body.error && body.error !== body.message ? `: ${body.error}` : "";
    const requestError = new Error(`${body.message || `Request failed (${response.status})`}${detail}`);
    requestError.status = response.status;
    throw requestError;
  }
  return body;
}

export const extractCv = (file) => {
  const body = new FormData();
  body.append("file", file);
  return apiRequest("/api/cv/extract", { method: "POST", body });
};

export const analyzeCvProfile = (rawText, candidate, job = null) => apiRequest("/api/cv/analyze", {
  method: "POST", body: JSON.stringify({ rawText, candidate, ...(job ? { job } : {}) }),
});

export const scoreMatch = (job, candidate) => apiRequest("/api/match/score", {
  method: "POST", body: JSON.stringify({ job, candidate }),
});

export const explainMatch = (rawText, candidate, job, matchResult) => apiRequest("/api/match/explain", {
  method: "POST", body: JSON.stringify({ rawText, candidate, job, matchResult }),
});

export const getAttritionAssessment = (candidate, simulation = {}, context = {}) => apiRequest("/api/attrition/predict", {
  method: "POST", body: JSON.stringify({ candidate, simulation, context }),
});

export const getMyProfile = () => apiRequest("/api/candidates/profiles/me");

export const saveMyProfile = (profile) => apiRequest("/api/candidates/profiles/me", {
  method: "PUT", body: JSON.stringify(profile),
});

export const getAdminJobs = () => apiRequest("/api/admin/jobs");
export const createAdminJob = (job) => apiRequest("/api/admin/jobs", {
  method: "POST", body: JSON.stringify(job),
});
export const updateAdminJob = (jobId, job) => apiRequest(`/api/admin/jobs/${jobId}`, {
  method: "PATCH", body: JSON.stringify(job),
});
export const getAdminApplications = () => apiRequest("/api/admin/applications");
export const getAdminApplicationCvContext = (applicationId) => apiRequest(`/api/admin/applications/${applicationId}/cv-context`);
export const updateAdminApplication = (applicationId, status) => apiRequest(`/api/admin/applications/${applicationId}`, {
  method: "PATCH", body: JSON.stringify({ status }),
});
export const updateAdminApplicationScore = (applicationId, matchScore) => apiRequest(`/api/admin/applications/${applicationId}/score`, {
  method: "PATCH", body: JSON.stringify({ matchScore }),
});
export const getAdminInterviews = () => apiRequest("/api/admin/interviews");
export const createAdminInterview = (interview) => apiRequest("/api/admin/interviews", {
  method: "POST", body: JSON.stringify(interview),
});
export const updateAdminInterview = (interviewId, changes) => apiRequest(`/api/admin/interviews/${interviewId}`, {
  method: "PATCH", body: JSON.stringify(changes),
});
export const getMyInterviews = () => apiRequest("/api/interviews/me");
export const getInterviewRoom = (interviewId) => apiRequest(`/api/interviews/${interviewId}/room`);
export const getInterviewLiveKitToken = (interviewId) => apiRequest(`/api/interviews/${interviewId}/livekit-token`);
export const saveInterviewOffer = (interviewId, sdp) => apiRequest(`/api/interviews/${interviewId}/room/offer`, {
  method: "POST", body: JSON.stringify({ sdp }),
});
export const saveInterviewAnswer = (interviewId, sdp) => apiRequest(`/api/interviews/${interviewId}/room/answer`, {
  method: "POST", body: JSON.stringify({ sdp }),
});
export const sendInterviewVideoFrame = (interviewId, frame, sequence = 0, sessionId = "") => apiRequest(`/api/interviews/${interviewId}/room/video-frame`, {
  method: "POST", body: JSON.stringify({ frame, sequence, sessionId }),
});
export const getInterviewVideoFrame = (interviewId) => apiRequest(`/api/interviews/${interviewId}/room/video-frame`);
export const requestInterviewMedia = (interviewId) => apiRequest(`/api/interviews/${interviewId}/room/media-request`, {
  method: "POST", body: JSON.stringify({}),
});
export const getInterviewMediaRequest = (interviewId) => apiRequest(`/api/interviews/${interviewId}/room/media-request`);
export const getInterviewTranscript = (interviewId) => apiRequest(`/api/interviews/${interviewId}/transcript`);
export const appendInterviewTranscript = (interviewId, text, language = "en-US") => apiRequest(`/api/interviews/${interviewId}/transcript`, {
  method: "POST", body: JSON.stringify({ text, language }),
});
export const updateInterviewTranscript = (interviewId, entryId, text) => apiRequest(`/api/interviews/${interviewId}/transcript/${entryId}`, {
  method: "PATCH", body: JSON.stringify({ text }),
});
export const deleteInterviewTranscript = (interviewId, entryId) => apiRequest(`/api/interviews/${interviewId}/transcript/${entryId}`, {
  method: "DELETE",
});
export const transcribeInterviewAudio = (interviewId, audioBlob, language = "en-US") => {
  const body = new FormData();
  const extension = audioBlob.type.includes("mp4") || audioBlob.type.includes("m4a") ? "mp4" : "webm";
  body.append("file", audioBlob, `interview-segment.${extension}`);
  body.append("language", language);
  return apiRequest(`/api/interviews/${interviewId}/transcribe`, { method: "POST", body });
};
export const analyzeInterview = (interviewId, referenceAnswers = []) => apiRequest(`/api/interviews/${interviewId}/analysis`, {
  method: "POST", body: JSON.stringify({ referenceAnswers }),
});
export const getInterviewAnalysis = (interviewId) => apiRequest(`/api/interviews/${interviewId}/analysis`);

export const getOpenJobs = () => apiRequest("/api/jobs");
export const getMyApplications = () => apiRequest("/api/applications/me");
export const applyForJob = (jobId, candidate, coverLetter = "") => apiRequest(`/api/jobs/${jobId}/applications`, {
  method: "POST", body: JSON.stringify({ candidate, coverLetter }),
});
