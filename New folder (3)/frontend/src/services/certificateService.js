import { apiRequest, getAccessToken } from "./apiClient";

const pending = new Map();
let queue = Promise.resolve();

const observeRequest = (request, signal) => {
  if (!signal) return request;
  if (signal.aborted) return Promise.reject(signal.reason);
  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason);
    signal.addEventListener("abort", abort, { once: true });
    request.then((value) => { signal.removeEventListener("abort", abort); resolve(value); },
      (error) => { signal.removeEventListener("abort", abort); reject(error); });
  });
};

const certificatePath = (applicationId) => applicationId
  ? `/api/admin/applications/${encodeURIComponent(applicationId)}/certificates`
  : "/api/candidates/profiles/me/certificates";

export const getSavedCertificateChecks = (cvRevision, signal, applicationId = "") => apiRequest(
  `${certificatePath(applicationId)}?cvRevision=${encodeURIComponent(cvRevision)}`, { signal },
);

export function verifyCertificateName(url, cvRevision, signal, force = false, applicationId = "") {
  if (signal?.aborted) return Promise.reject(signal.reason);
  const token = getAccessToken();
  const key = JSON.stringify([token, applicationId, url, cvRevision, force]);
  let request = pending.get(key);
  if (!request) {
    request = queue.then(() => {
      if (getAccessToken() !== token) throw new DOMException("The account changed.", "AbortError");
      // An unmounted observer must not cancel OCR that the server is already running.
      return apiRequest(`${certificatePath(applicationId)}/verify`, {
        method: "POST", body: JSON.stringify({ url, cvRevision, force }),
      });
    }).finally(() => pending.delete(key));
    pending.set(key, request);
    queue = request.catch(() => {});
  }
  return observeRequest(request, signal);
}
