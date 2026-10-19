import "./JobsWelcome.css";

export default function JobsWelcome({ user, profilePhoto, jobCount, applicationCount, profileReady, candidateHasProfile }) {
  return <section className="jobs-welcome" aria-label="Your opportunities overview">
    <header className="jobs-hero">
      <div className="jobs-welcome__copy">
        <span className="jobs-eyebrow"><i />Opportunities</span>
        <h1>Find a role that fits your next chapter.</h1>
        <p>Explore jobs published by the hiring team. Your saved CV profile is ready to use when you find the right opportunity.</p>
      </div>
      <div className="jobs-hero__profile">
        <span className={profilePhoto ? "jobs-hero__profile-avatar jobs-hero__profile-avatar--photo" : "jobs-hero__profile-avatar"}>
          {profilePhoto ? <img src={profilePhoto} alt="Your profile" /> : (user?.displayName || "User").slice(0, 1).toUpperCase()}
        </span>
        <div><small>Signed in as</small><strong>{user?.displayName}</strong></div>
      </div>
    </header>
    <section className="jobs-overview" aria-label="Jobs overview">
      <div className="jobs-welcome__stat jobs-welcome__stat--roles"><strong>{jobCount}</strong><span>Open roles</span></div>
      <div className="jobs-welcome__stat jobs-welcome__stat--applications"><strong>{applicationCount}</strong><span>My applications</span></div>
      <div className="jobs-welcome__stat jobs-welcome__stat--profile"><strong>{profileReady ? (candidateHasProfile ? "Ready" : "Missing") : "Loading"}</strong><span>CV profile</span></div>
    </section>
  </section>;
}
