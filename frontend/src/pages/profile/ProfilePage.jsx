import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { analyzeCvProfile, extractCv, getMyProfile, saveMyProfile } from "../../services/apiClient";
import { useAuth } from "../../context/AuthContext";
import { toMatcherCandidate, toStoredCandidate } from "../../utils/candidateProfile";
import CandidateDetailsFields from "../../components/resume/CandidateDetailsFields";
import ResumeStrengthSummary from "../../components/resume/ResumeStrengthSummary";
import CompensationFields from "../../components/profile/CompensationFields";
import CvNavigation from "../../components/layout/CvNavigation";
import CvTopbar from "../../components/layout/CvTopbar";
import "./ProfilePage.css";

const emptyProfile = { displayName: "", headline: "", location: "", skills: [], profilePhoto: "", compensation: { current: "", expected: "", currency: "LKR" } };
const emptyCandidate = toMatcherCandidate();
const supportedExtensions = ["pdf", "docx", "txt"];
const supportedPhotoTypes = ["image/jpeg", "image/png", "image/webp"];
const profileSkills = (value) => value.split(",").map((item) => item.trim()).filter(Boolean);
const formatSavedAt = (value) => value ? new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "Not saved yet";

const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ""));
  reader.onerror = () => reject(new Error("Could not prepare the profile photo."));
  reader.readAsDataURL(blob);
});

const prepareProfilePhoto = (file) => new Promise((resolve, reject) => {
  if (!supportedPhotoTypes.includes(file.type)) {
    reject(new Error("Please choose a JPG, PNG or WEBP image."));
    return;
  }
  if (file.size > 8 * 1024 * 1024) {
    reject(new Error("Please choose an image smaller than 8 MB."));
    return;
  }

  const objectUrl = URL.createObjectURL(file);
  const image = new Image();
  image.onload = async () => {
    URL.revokeObjectURL(objectUrl);
    const maxDimension = 720;
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) {
      reject(new Error("Your browser could not prepare the profile photo."));
      return;
    }
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const createBlob = (quality) => new Promise((resolveBlob, rejectBlob) => {
      canvas.toBlob((blob) => blob ? resolveBlob(blob) : rejectBlob(new Error("Could not prepare the profile photo.")), "image/jpeg", quality);
    });

    try {
      let blob = await createBlob(0.82);
      if (blob.size > 450 * 1024) blob = await createBlob(0.62);
      if (blob.size > 450 * 1024) throw new Error("This image is still too large after optimization. Please choose a smaller image.");
      resolve(await blobToDataUrl(blob));
    } catch (error) {
      reject(error);
    }
  };
  image.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    reject(new Error("That image could not be read. Please choose another file."));
  };
  image.src = objectUrl;
});

function ProfilePage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [profile, setProfile] = useState({ ...emptyProfile, displayName: user?.displayName || "" });
  const [skills, setSkills] = useState("");
  const [cvCandidate, setCvCandidate] = useState(emptyCandidate);
  const [cvPreview, setCvPreview] = useState("");
  const [profileAnalysis, setProfileAnalysis] = useState(null);
  const [status, setStatus] = useState("Loading your profile...");
  const [cvStatus, setCvStatus] = useState("");
  const [cvBusy, setCvBusy] = useState(false);
  const [photoStatus, setPhotoStatus] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);

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
      setCvPreview(response.rawText || "");
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

  return <div className="cv-app-shell profile-app-shell">
    <CvNavigation isOpen={navigationOpen} activeView="profile" onNavigate={(view) => navigate(view === "analysis" ? "/matching/analysis" : view === "jobs" ? "/jobs" : view === "interviews" ? "/interviews" : view === "skill-analysis" ? "/skill-analysis" : "/matching")} onClose={() => setNavigationOpen(false)} />
    <div className="cv-app-shell__main profile-app-shell__main">
      <CvTopbar activeView="profile" profilePhoto={profilePhoto} monochrome onMenuToggle={() => setNavigationOpen(true)} />
      <main className="profile-page"><div className="profile-page__container">
        <header className="profile-page__hero">
          <div className={`profile-page__avatar ${profilePhoto ? "profile-page__avatar--photo" : ""}`}>
            {profilePhoto ? <img src={profilePhoto} alt={`${profile.displayName || "User"} profile`} /> : initials}
          </div>
          <div><p className="cv-overline">Account workspace</p><h1>{profile.displayName || "Your profile"}</h1><p>Keep your account details and personal CV ready for every match.</p></div>
          <span className="profile-page__role">{user?.role === "admin" ? "Administrator" : "Member"}</span>
          <button className="profile-page__matchlink" type="button" onClick={() => navigate("/jobs")}>View opportunities <span>→</span></button>
        </header>
        <section className="profile-page__overview" aria-label="Profile overview">
          <div className="profile-overview__item profile-overview__item--progress"><div><span>Profile completion</span><strong>{completion}%</strong></div><div className="profile-overview__bar"><i style={{ width: `${completion}%` }} /></div><small>{completion === 100 ? "Everything is ready for matching" : "Complete your details for better results"}</small></div>
          <div className="profile-overview__item"><span>CV status</span><strong>{profile.cv ? "Ready to match" : "Not uploaded"}</strong><small>{profile.cv ? profile.cv.fileName : "Upload a personal CV"}</small></div>
          <div className="profile-overview__item"><span>Last saved</span><strong>{formatSavedAt(profile.updatedAt)}</strong><small>{savedSkills.length} skill{savedSkills.length === 1 ? "" : "s"} · {savedProjects.length} project{savedProjects.length === 1 ? "" : "s"}</small></div>
        </section>
        <nav className="profile-page__quicknav" aria-label="Profile sections"><a href="#account-details">Account details</a><a href="#cv-profile">CV profile</a><a href="#save-profile">Save changes</a></nav>
        <form className="profile-page__form" onSubmit={save}>
          <section className="profile-card profile-card--account" id="account-details">
            <div className="profile-card__heading"><div><p className="cv-overline">Account details</p><h2>Personal profile</h2></div><span className="profile-card__secure"><i /> Private</span></div>
            <p className="profile-card__intro">Your profile is linked to your authenticated account and is not shared with another user.</p>
            <div className="profile-photo-manager">
              <div className={`profile-photo-manager__preview ${profilePhoto ? "profile-photo-manager__preview--photo" : ""}`}>
                {profilePhoto ? <img src={profilePhoto} alt="Profile preview" /> : initials}
                <span className="profile-photo-manager__online" aria-hidden="true" />
              </div>
              <div className="profile-photo-manager__content">
                <div><strong>Profile photo</strong><p>Use a clear photo so your profile feels personal and easy to recognize.</p></div>
                <div className="profile-photo-manager__actions">
                  <label className={`profile-photo-manager__upload ${photoBusy ? "profile-photo-manager__upload--busy" : ""}`}>
                    <span>{photoBusy ? "Saving..." : profilePhoto ? "Change photo" : "Upload photo"}</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadPhoto} disabled={photoBusy} />
                  </label>
                  {profilePhoto && <button className="profile-photo-manager__remove" type="button" onClick={removePhoto} disabled={photoBusy}>Remove</button>}
                </div>
                <small>JPG, PNG or WEBP · optimized to a private account photo</small>
                {photoStatus && <p className="profile-photo-manager__status">{photoStatus}</p>}
              </div>
            </div>
            <div className="profile-card__fields">
              <label>Display name<input name="displayName" value={profile.displayName} onChange={update} required /></label>
              <label>Headline<input name="headline" value={profile.headline} onChange={update} placeholder="e.g. Senior Product Designer" /></label>
              <label>Location<input name="location" value={profile.location} onChange={update} placeholder="e.g. Colombo, Sri Lanka" /></label>
               <label>Profile skills <span>comma separated</span><input value={skills} onChange={(event) => setSkills(event.target.value)} placeholder="Design systems, Figma, Research" /></label>
             </div>
             <CompensationFields compensation={profile.compensation} onChange={(compensation) => setProfile({ ...profile, compensation })} />
           </section>
          <section className="profile-card profile-card--cv" id="cv-profile">
            <div className="profile-card__heading"><div><p className="cv-overline">Personal CV</p><h2>CV profile</h2></div><span className="profile-card__step">01</span></div>
            <p className="profile-card__intro">Upload once and we will extract each field, save it to your profile, and reuse it in matching.</p>
            <label className={`profile-card__upload ${profile.cv ? "profile-card__upload--ready" : ""}`}><span className="profile-card__upload-icon">↑</span><span className="profile-card__upload-copy"><strong>{profile.cv ? "Replace your CV" : "Choose a CV"}</strong><small>Drop a PDF, DOCX or TXT · max 15 MB</small></span><span className="profile-card__upload-button">Browse files</span><input type="file" accept=".pdf,.docx,.txt,application/pdf,text/plain" onChange={uploadCv} disabled={cvBusy} /></label>
            {cvStatus && <p className="profile-card__status profile-card__status--accent">{cvStatus}</p>}
            <label>Extracted text preview<textarea value={cvPreview} readOnly rows="5" placeholder="Your CV text preview will appear here." /></label>
            <CandidateDetailsFields candidate={cvCandidate} onChange={setCvCandidate} />
            <ResumeStrengthSummary analysis={profileAnalysis} fallbackProjects={savedProjects} />
            {profile.cv && <div className="profile-card__cv-summary"><span className="profile-card__file-icon">✓</span><div><strong>{profile.cv.fileName}</strong><span>Saved privately to {profile.displayName || user?.displayName || "your profile"} · {savedProjects.length} project{savedProjects.length === 1 ? "" : "s"} saved.</span></div><b>Ready</b></div>}
          </section>
          <div className="profile-page__savebar" id="save-profile"><button className="cv-button cv-button--primary">Save profile and CV fields</button>{status && <p>{status}</p>}</div>
        </form>
      </div></main>
    </div>
  </div>;
}

export default ProfilePage;
