import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CandidateDetailsFields from "../../components/resume/CandidateDetailsFields";
import ResumeStrengthSummary from "../../components/resume/ResumeStrengthSummary";
import CompensationFields from "../../components/profile/CompensationFields";
import ProfileCertificates from "../../components/profile/ProfileCertificates";
import CvNavigation from "../../components/layout/CvNavigation";
import CvTopbar from "../../components/layout/CvTopbar";
import useProfileWorkspace from "./useProfileWorkspace";
import useProfileSection from "./useProfileSection";
import "./ProfilePage.css";

const formatSavedAt = (value) => value ? new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "Not saved yet";

function ProfilePage() {
  const navigate = useNavigate();
  const [navigationOpen, setNavigationOpen] = useState(false);
  const section = useProfileSection();
  const {
    user, profile, setProfile, skills, setSkills, cvCandidate, setCvCandidate,
    cvPreview, profileAnalysis, status, cvStatus, cvBusy, initials, profilePhoto,
    savedSkills, savedProjects, completion, update, save, uploadCv,
    photoStatus, photoBusy, uploadPhoto, removePhoto,
  } = useProfileWorkspace();

  return <div className="cv-app-shell profile-app-shell">
    <CvNavigation isOpen={navigationOpen} activeView="profile" onNavigate={(view) => navigate(view === "analysis" ? "/matching/analysis" : view === "jobs" ? "/jobs" : view === "interviews" ? "/interviews" : view === "skill-analysis" ? "/skill-analysis" : "/matching")} onClose={() => setNavigationOpen(false)} />
    <div className="cv-app-shell__main profile-app-shell__main">
      <CvTopbar activeView="profile" profilePhoto={profilePhoto} monochrome onMenuToggle={() => setNavigationOpen(true)} />
      <main className="profile-page" data-section={section}><div className="profile-page__container">
        <section className="profile-page__overview" aria-label="Profile overview">
          <div className="profile-overview__item profile-overview__item--progress"><div><span>Profile completion</span><strong>{completion}%</strong></div><div className="profile-overview__bar"><i style={{ width: `${completion}%` }} /></div><small>{completion === 100 ? "Everything is ready for matching" : "Complete your details for better results"}</small></div>
          <div className="profile-overview__item"><span>CV status</span><strong>{profile.cv ? "Ready to match" : "Not uploaded"}</strong><small>{profile.cv ? profile.cv.fileName : "Upload a personal CV"}</small></div>
          <div className="profile-overview__item"><span>Last saved</span><strong>{formatSavedAt(profile.updatedAt)}</strong><small>{savedSkills.length} skill{savedSkills.length === 1 ? "" : "s"} · {savedProjects.length} project{savedProjects.length === 1 ? "" : "s"}</small></div>
        </section>
        <nav className="profile-page__quicknav" aria-label="Profile sections"><a href="#account-details">Account details</a><a href="#cv-profile">CV profile</a><a href="#save-profile">Skills</a><a href="#certificates">Certificates</a></nav>
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
          <ProfileCertificates candidate={cvCandidate} hasCv={Boolean(profile.cv)} cvText={cvPreview} active={Boolean(profile.cv)} cvRevision={profile.cv?.revision} savedChecks={profile.cv?.certificateChecks} ownerId={user?.id} />
          <div className="profile-page__savebar" id="save-profile"><button className="cv-button cv-button--primary">Save profile and CV fields</button>{status && <p>{status}</p>}</div>
        </form>
      </div></main>
    </div>
  </div>;
}

export default ProfilePage;
