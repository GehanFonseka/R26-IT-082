import { useState } from "react";
import { saveMyProfile } from "../../services/apiClient";
import { prepareProfilePhoto, profileSkills } from "./profileHelpers";

export default function useProfilePhoto({ profile, skills, setProfile, setStatus, updateUser }) {
  const [photoStatus, setPhotoStatus] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const profilePhoto = profile.profilePhoto || "";

  const uploadPhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setPhotoBusy(true);
    setPhotoStatus("Optimizing and saving your profile photo...");
    try {
      const profilePhoto = await prepareProfilePhoto(file);
      const payload = { ...profile, profilePhoto, skills: profileSkills(skills) };
      const response = await saveMyProfile(payload);
      const savedProfile = response.data || payload;
      setProfile(savedProfile);
      if (savedProfile.displayName) updateUser({ displayName: savedProfile.displayName, profilePhoto: savedProfile.profilePhoto || "" });
      setPhotoStatus("Profile photo saved to this account.");
      setStatus("Profile photo updated securely for this account.");
    } catch (error) {
      setPhotoStatus(error.message || "Could not save the profile photo.");
    } finally {
      setPhotoBusy(false);
    }
  };

  const removePhoto = async () => {
    if (!profilePhoto || photoBusy) return;
    setPhotoBusy(true);
    setPhotoStatus("Removing your profile photo...");
    try {
      const payload = { ...profile, profilePhoto: "", skills: profileSkills(skills) };
      const response = await saveMyProfile(payload);
      const savedProfile = response.data || payload;
      setProfile(savedProfile);
      if (savedProfile.displayName) updateUser({ displayName: savedProfile.displayName, profilePhoto: savedProfile.profilePhoto || "" });
      setPhotoStatus("Profile photo removed from this account.");
      setStatus("Profile photo removed securely.");
    } catch (error) {
      setPhotoStatus(error.message || "Could not remove the profile photo.");
    } finally {
      setPhotoBusy(false);
    }
  };

  return { photoStatus, setPhotoStatus, photoBusy, uploadPhoto, removePhoto };
}
