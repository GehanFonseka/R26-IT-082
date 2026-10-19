import { getDatabase } from "../config/mongo.js";
import { cvRevision } from "../utils/cvRevision.js";
import { certificateCheckRepository } from "./certificateCheckRepository.js";

const collection = async () => (await getDatabase()).collection("candidate_profiles");

const map = (profile) => profile && ({
  userId: profile.userId,
  displayName: profile.displayName,
  headline: profile.headline,
  location: profile.location,
  skills: profile.skills,
  compensation: profile.compensation,
  profilePhoto: profile.profilePhoto || "",
  metadata: profile.metadata,
  cv: profile.cv,
  cvUpdatedAt: profile.cvUpdatedAt,
  updatedAt: profile.updatedAt,
});

const hydrate = async (profile) => {
  if (!profile?.cv) return profile;
  const revision = cvRevision(profile.cv);
  return { ...profile, cv: { ...profile.cv, revision, certificateChecks: await certificateCheckRepository.list(profile.userId, revision) } };
};

export const profileRepository = {
  async get(userId) {
    return hydrate(map(await (await collection()).findOne({ userId })));
  },
  async getPhotos(userIds = []) {
    const ids = [...new Set(userIds.map((userId) => String(userId || "").trim()).filter(Boolean))].slice(0, 500);
    if (!ids.length) return [];
    return (await (await collection()).find({ userId: { $in: ids } }, { projection: { _id: 0, userId: 1, profilePhoto: 1 } }).toArray())
      .map((profile) => ({ userId: profile.userId, profilePhoto: profile.profilePhoto || "" }));
  },
  async upsert(userId, profile) {
    const profiles = await collection();
    const update = { ...profile, userId, updatedAt: new Date() };
    if (profile.cv) update.cv = { ...profile.cv, revision: cvRevision(profile.cv) };
    if (profile.cv) update.cvUpdatedAt = new Date();
    const updateDocument = { $set: update };
    if (profile.cv) {
      updateDocument.$unset = {
        candidate: "",
        rawText: "",
        cvFileName: "",
        cvRawText: "",
        cvCandidate: "",
      };
    }
    if (profile.profilePhoto === "") {
      delete update.profilePhoto;
      updateDocument.$unset = { ...(updateDocument.$unset || {}), profilePhoto: "" };
    }
    await profiles.updateOne(
      { userId },
      updateDocument,
      { upsert: true },
    );
    return hydrate(map(await profiles.findOne({ userId })));
  },
};
