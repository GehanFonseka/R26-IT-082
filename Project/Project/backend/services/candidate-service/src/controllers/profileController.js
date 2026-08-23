import { profileRepository } from "../repositories/profileRepository.js";
import { validateProfile } from "../validation/profileValidation.js";

const identity = (req) => String(req.header("x-user-id") ?? "");
const requireIdentity = (req, res) => {
  if (identity(req)) return true;
  res.status(401).json({ success: false, message: "Authenticated user identity required", requestId: req.requestId });
  return false;
};

export const getOwnProfile = async (req, res) => {
  if (!requireIdentity(req, res)) return;
  const profile = await profileRepository.get(identity(req));
  return res.json({ success: true, data: profile, requestId: req.requestId });
};

export const saveOwnProfile = async (req, res) => {
  if (!requireIdentity(req, res)) return;
  const profile = await profileRepository.upsert(identity(req), validateProfile(req.body));
  return res.json({ success: true, data: profile, requestId: req.requestId });
};

export const getProfileAsAdmin = async (req, res) => {
  if (req.header("x-user-role") !== "admin") return res.status(403).json({ success: false, message: "Admin role required", requestId: req.requestId });
  const profile = await profileRepository.get(req.params.userId);
  return res.json({ success: true, data: profile, requestId: req.requestId });
};

export const getProfilePhotosAsAdmin = async (req, res) => {
  if (req.header("x-user-role") !== "admin") return res.status(403).json({ success: false, message: "Admin role required", requestId: req.requestId });
  const userIds = Array.isArray(req.body?.userIds) ? req.body.userIds : [];
  const data = await profileRepository.getPhotos(userIds);
  return res.json({ success: true, data, requestId: req.requestId });
};
