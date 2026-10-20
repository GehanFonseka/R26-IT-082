import { apiRequest } from "./apiClient";

export const getApplicantCertificates = (applicationId, signal) => apiRequest(
  `/api/admin/applications/${encodeURIComponent(applicationId)}/certificates`, { signal },
);
