import { env } from "../config/env.js";
import { profileRepository } from "../repositories/profileRepository.js";
import { certificateCheckRepository } from "../repositories/certificateCheckRepository.js";
import { cvRevision, cvCertificateLinks } from "../utils/cvRevision.js";
import { certificateCheckResult } from "../utils/certificateCheckResult.js";
import { log } from "../utils/logger.js";

const pending = new Set();
let queue = Promise.resolve();
const fail = (message, statusCode) => Object.assign(new Error(message), { statusCode });

export async function certificateContext(userId, revision) {
  const profile = await profileRepository.get(userId);
  if (!profile?.cv?.rawText) throw fail("Upload and save a CV before checking its certificates.", 409);
  const current = cvRevision(profile.cv);
  if (revision !== current) throw fail("The saved CV changed. Reload the profile before checking its certificates.", 409);
  return { cv: profile.cv, revision: current };
}

export async function getCertificateChecks(userId, revision, requestId) {
  const context = await certificateContext(userId, revision);
  await scheduleCertificateChecks(userId, context.cv, requestId);
  const records = await certificateCheckRepository.list(userId, context.revision);
  const urls = cvCertificateLinks(context.cv);
  return { cvRevision: context.revision, results: Object.fromEntries(Object.entries(records).filter(([url]) => urls.includes(url))) };
}

async function checkAndSave(userId, context, url, requestId) {
  let data;
  const current = await profileRepository.get(userId);
  if (cvRevision(current?.cv) !== context.revision) {
    data = { cvName: context.cv.candidate?.name || "", status: "unavailable", reason: "This CV was replaced before the certificate check started." };
    return certificateCheckRepository.save(userId, context.cv, certificateCheckResult(data, url, context.revision), requestId);
  }
  try {
    const response = await fetch(`${env.extractionUrl.replace(/\/$/, "")}/certificates/verify`, {
      method: "POST", headers: { "content-type": "application/json", "x-request-id": requestId },
      body: JSON.stringify({ url, rawText: context.cv.rawText }), signal: AbortSignal.timeout(env.certificateTimeoutMs),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.data) throw fail(body.message || "Certificate reading is unavailable.", response.status);
    data = body.data;
  } catch (error) {
    data = { cvName: context.cv.candidate?.name || "", status: "unavailable",
      reason: ["TimeoutError", "AbortError"].includes(error.name) ? "The certificate reader took too long. Please try again."
        : error.statusCode ? error.message : "The certificate reader is unavailable. Please try again." };
  }
  return certificateCheckRepository.save(userId, context.cv, certificateCheckResult(data, url, context.revision), requestId);
}

async function enqueueCertificate(userId, context, url, requestId) {
  const key = JSON.stringify([userId, context.revision, url]);
  if (pending.has(key)) return await certificateCheckRepository.get(userId, context.revision, url)
    || { url, cvRevision: context.revision, status: "checking" };
  pending.add(key);
  try {
    const checking = await certificateCheckRepository.markChecking(userId, context.cv, context.revision, url, requestId);
    queue = queue.catch(() => {}).then(() => checkAndSave(userId, context, url, requestId))
      .catch(() => log("error", "certificate.result_save_failed", { requestId }))
      .finally(() => pending.delete(key));
    return checking;
  } catch (error) { pending.delete(key); throw error; }
}

export async function scheduleCertificateChecks(userId, cv, requestId) {
  if (!cv?.rawText) return;
  const revision = cvRevision(cv);
  const existing = await certificateCheckRepository.list(userId, revision);
  await Promise.all(cvCertificateLinks(cv).filter((url) => !existing[url] || existing[url].status === "checking")
    .map((url) => enqueueCertificate(userId, { cv, revision }, url, requestId)));
}

export async function resumePendingCertificateChecks() {
  const profiles = new Map();
  for (const record of await certificateCheckRepository.pending()) {
    if (!profiles.has(record.userId)) profiles.set(record.userId, await profileRepository.get(record.userId));
    const profile = profiles.get(record.userId);
    if (cvRevision(profile?.cv) !== record.cvRevision || !cvCertificateLinks(profile?.cv).includes(record.url)) {
      await certificateCheckRepository.cancelPending(record);
    } else await enqueueCertificate(record.userId, { cv: profile.cv, revision: record.cvRevision }, record.url, record.requestId);
  }
}

export async function verifyAndSaveCertificate(userId, { url, cvRevision: revision, force = false }, requestId) {
  const context = await certificateContext(userId, revision);
  if (typeof url !== "string" || !cvCertificateLinks(context.cv).includes(url)) throw fail("This certificate link does not belong to the saved CV.", 400);
  if (!force) {
    const saved = await certificateCheckRepository.get(userId, revision, url);
    if (saved && saved.status !== "checking") return saved;
  }
  return enqueueCertificate(userId, context, url, requestId);
}
