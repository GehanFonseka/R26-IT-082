import { getDatabase } from "../config/mongo.js";

const collection = async () => (await getDatabase()).collection("candidate_certificate_checks");
export const certificateCheckRepository = {
  async pending() {
    return (await (await collection()).find({ status: "checking" },
      { projection: { _id: 0, userId: 1, cvRevision: 1, url: 1, requestId: 1, result: 1 } }).limit(1000).toArray());
  },
  async cancelPending(record) {
    await (await collection()).updateOne({ userId: record.userId, cvRevision: record.cvRevision, url: record.url, status: "checking" }, {
      $set: { status: "unavailable", validationStatus: "unavailable", "result.status": "unavailable",
        "result.validationStatus": "unavailable", "result.reason": "This CV was replaced before the certificate check started.",
        "result.checkedAt": new Date().toISOString(), updatedAt: new Date() },
    });
  },
  async list(userId, cvRevision) {
    if (!cvRevision) return {};
    const records = await (await collection()).find({ userId, cvRevision }, { projection: { _id: 0, url: 1, result: 1 } }).toArray();
    return Object.fromEntries(records.map((record) => [record.url, record.result]));
  },
  async get(userId, cvRevision, url) {
    return (await (await collection()).findOne({ userId, cvRevision, url }))?.result || null;
  },
  async markChecking(userId, cv, revision, url, requestId) {
    return this.save(userId, cv, { url, cvRevision: revision, status: "checking", validationStatus: "pending",
      validationType: "recipient_name", cvName: cv.candidate?.name || "", certificateName: "", checkedAt: null,
      officiallyVerified: false }, requestId);
  },
  async save(userId, cv, result, requestId) {
    await (await collection()).updateOne({ userId, cvRevision: result.cvRevision, url: result.url }, {
      $set: { userId, cvRevision: result.cvRevision, url: result.url, cvFileName: cv.fileName,
        certificateTitle: cv.candidate?.certificateDetails?.find((entry) => [entry.url, ...(entry.urls || [])].includes(result.url))?.name || "",
        status: result.status, validationStatus: result.validationStatus, result, requestId, updatedAt: new Date() },
    }, { upsert: true });
    return result;
  },
};
