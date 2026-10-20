import { useEffect, useState } from "react";
import { analyzeCvProfile, extractCv, getMyProfile, saveMyProfile } from "../../services/apiClient";
import { useAuth } from "../../context/AuthContext";
import { toMatcherCandidate, toStoredCandidate } from "../../utils/candidateProfile";
import { profileSkills } from "./profileHelpers";
import useProfilePhoto from "./useProfilePhoto";

const emptyProfile = { displayName: "", headline: "", location: "", skills: [], profilePhoto: "", compensation: { current: "", expected: "", currency: "LKR" } };
const emptyCandidate = toMatcherCandidate();
const supportedExtensions = ["pdf", "docx", "txt"];

export default function useProfileWorkspace() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState({ ...emptyProfile, displayName: user?.displayName || "" });
  const [skills, setSkills] = useState("");
  const [cvCandidate, setCvCandidate] = useState(emptyCandidate);
  const [cvPreview, setCvPreview] = useState("");
  const [profileAnalysis, setProfileAnalysis] = useState(null);
  const [status, setStatus] = useState("Loading your profile...");
  const [cvStatus, setCvStatus] = useState("");
  const [cvBusy, setCvBusy] = useState(false);

  useEffect(() => {
    getMyProfile().then((response) => {
      if (response.data) {
        setProfile({ ...emptyProfile, ...response.data, compensation: { ...emptyProfile.compensation, ...(response.data.compensation || {}) } });
        setSkills((response.data.skills || []).join(", "));
        setCvCandidate(toMatcherCandidate({ ...response.data.cv?.candidate, compensation: response.data.compensation || response.data.cv?.candidate?.compensation }));
        setCvPreview(response.data.cv?.rawText || "");
        setProfileAnalysis(response.data.cv?.profileAnalysis || null);
      }
      setStatus("");
    }).catch((error) => setStatus(error.message));
  }, []);

  const update = (event) => setProfile({ ...profile, [event.target.name]: event.target.value });
  const initials = (profile.displayName || user?.displayName || "User").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const profilePhoto = profile.profilePhoto || "";
  const savedSkills = profileSkills(skills);
  const savedProjects = String(cvCandidate.candidateProjects || "").split(/\r?\n|;/).map((item) => item.trim()).filter(Boolean);
  const completionItems = [profile.displayName, profile.headline, profile.location, savedSkills.length, profile.compensation?.current, profile.compensation?.expected, profile.cv, cvCandidate.candidateRole, cvCandidate.candidateSeniority, cvCandidate.yearsExperience, cvCandidate.candidateIndustry, cvCandidate.education, cvCandidate.candidateSkills, cvCandidate.summary, cvCandidate.experienceBullets, cvCandidate.candidateProjects];
  const completion = Math.round((completionItems.filter(Boolean).length / completionItems.length) * 100);
  const photo = useProfilePhoto({ profile, skills, setProfile, setStatus, updateUser });
  const { setPhotoStatus } = photo;
  const profilePayload = () => {
    const payload = { ...profile, skills: profileSkills(skills) };
    if (profile.cv) payload.cv = { ...profile.cv, rawText: cvPreview, candidate: toStoredCandidate({ ...cvCandidate, compensation: profile.compensation }), ...(profileAnalysis ? { profileAnalysis } : {}) };
    return payload;
  };

  const save = async (event) => {
    event.preventDefault();
    setStatus("Saving profile and CV fields...");
    try {
      const payload = profilePayload();
      if (payload.cv?.rawText) {
        try { const refreshed = (await analyzeCvProfile(payload.cv.rawText, payload.cv.candidate)).data; payload.cv.profileAnalysis = refreshed; setProfileAnalysis(refreshed); } catch { /* Keep the last saved evidence if the analysis service is temporarily unavailable. */ }
      }
      const response = await saveMyProfile(payload);
      const savedProfile = response.data || payload;
      setProfile(savedProfile);
      if (savedProfile.displayName) updateUser({ displayName: savedProfile.displayName, profilePhoto: savedProfile.profilePhoto || "" });
      setPhotoStatus(payload.profilePhoto ? "Profile photo is saved to this account." : "");
      const persistedProjects = Array.isArray(response.data?.cv?.candidate?.projects)
        ? response.data.cv.candidate.projects.length
        : savedProjects.length;
      setStatus(`Profile, CV fields and ${persistedProjects} project${persistedProjects === 1 ? "" : "s"} saved securely for this account.`);
    } catch (error) {
      setStatus(error.message);
    }
  };

  const uploadCv = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!supportedExtensions.includes(extension)) return setCvStatus("Supported CV formats are PDF, DOCX and TXT.");
    if (file.size > 15 * 1024 * 1024) return setCvStatus("Please choose a CV smaller than 15 MB.");
    setCvBusy(true);
    setCvStatus("Uploading and extracting your CV...");
    try {
      const response = await extractCv(file);
      const extractedCandidate = toMatcherCandidate({ ...(response.candidate || {}), compensation: profile.compensation });
      let nextAnalysis = null;
      try { nextAnalysis = (await analyzeCvProfile(response.rawText || "", toStoredCandidate(extractedCandidate))).data; } catch { setCvStatus("CV extracted. The CV fields are ready to review and save."); }
      const cv = { fileName: file.name, rawText: response.rawText || "", candidate: toStoredCandidate(extractedCandidate), ...(nextAnalysis ? { profileAnalysis: nextAnalysis } : {}) };
      const saved = await saveMyProfile({ ...profile, skills: profileSkills(skills), cv });
      const persistedCandidate = saved.data?.cv?.candidate;
      const nextCandidate = persistedCandidate ? toMatcherCandidate(persistedCandidate) : extractedCandidate;
      const persistedProjects = Array.isArray(persistedCandidate?.projects) ? persistedCandidate.projects : [];
      const savedProfile = saved.data || { ...profile, cv };
      setProfile(savedProfile);
      if (savedProfile.displayName) updateUser({ displayName: savedProfile.displayName, profilePhoto: savedProfile.profilePhoto || "" });
      setCvCandidate(nextCandidate);
      setCvPreview(savedProfile.cv?.rawText || response.rawText || "");
      setProfileAnalysis(nextAnalysis);
      const projectCount = persistedCandidate
        ? persistedProjects.length
        : String(nextCandidate.candidateProjects || "").split(/\r?\n|;/).filter(Boolean).length;
      setCvStatus(`CV fields and ${projectCount} project${projectCount === 1 ? "" : "s"} saved successfully and ready for matching.`);
    } catch (error) {
      setCvStatus(error.message || "Could not process this CV.");
    } finally {
      setCvBusy(false);
    }
  };

  return {
    user, profile, setProfile, skills, setSkills, cvCandidate, setCvCandidate,
    cvPreview, profileAnalysis, status, cvStatus, cvBusy, initials, profilePhoto,
    savedSkills, savedProjects, completion, update, save, uploadCv, ...photo,
  };
}
