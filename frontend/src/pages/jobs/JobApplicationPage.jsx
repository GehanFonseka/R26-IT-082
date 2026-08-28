import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import CvNavigation from "../../components/layout/CvNavigation";
import CvTopbar from "../../components/layout/CvTopbar";
import Icon from "../../components/common/Icon";
import { applyForJob, getMyApplications, getMyProfile, getOpenJobs } from "../../services/apiClient";
import { toMatcherCandidate } from "../../utils/candidateProfile";
import "./JobApplicationPage.css";

const navigateFromSidebar = (navigate, view) => navigate(view === "jobs" ? "/jobs" : view === "interviews" ? "/interviews" : view === "profile" ? "/profile" : view === "skill-analysis" ? "/skill-analysis" : "/jobs");
const jobMeta = (job) => [job?.employmentType || "Full-time", job?.seniority, job?.industry].filter(Boolean);

function JobApplicationPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [job, setJob] = useState(null);
  const [candidate, setCandidate] = useState(toMatcherCandidate());
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || "");
  const [profileReady, setProfileReady] = useState(false);
  const [existingApplication, setExistingApplication] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([getOpenJobs(), getMyProfile(), getMyApplications()]).then(([jobsResponse, profileResponse, applicationsResponse]) => {
      if (!mounted) return;
      setJob((jobsResponse.data || []).find((item) => item.id === jobId) || null);
      const savedPhoto = profileResponse.data?.profilePhoto || "";
      setProfilePhoto(savedPhoto);
      updateUser({ profilePhoto: savedPhoto });
      setCandidate(toMatcherCandidate({ ...profileResponse.data?.cv?.candidate, compensation: profileResponse.data?.compensation || profileResponse.data?.cv?.candidate?.compensation }));
      setProfileReady(true);
      setExistingApplication((applicationsResponse.data || []).find((item) => item.jobId === jobId) || null);
    }).catch((requestError) => mounted && setError(requestError.message || "Could not load this job application."))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [jobId]);

  const candidateHasProfile = Object.values(candidate).some(Boolean);
  const submit = async (event) => {
    event.preventDefault();
    if (!job || existingApplication || !candidateHasProfile) return;
    setSubmitting(true);
    setError("");
    try {
      await applyForJob(job.id, candidate, coverLetter);
      setSuccess(true);
    } catch (requestError) {
      setError(requestError.message || "Could not submit this application.");
    } finally {
      setSubmitting(false);
    }
  };

  const close = () => navigate("/jobs");
  const title = job?.title || "Job application";

  return <div className="cv-app-shell job-application-shell">
    <CvNavigation isOpen={navigationOpen} activeView="jobs" onNavigate={(view) => navigateFromSidebar(navigate, view)} onClose={() => setNavigationOpen(false)} />
    <div className="cv-app-shell__main job-application-shell__main">
      <CvTopbar activeView="jobs" profilePhoto={profilePhoto} monochrome onMenuToggle={() => setNavigationOpen(true)} />
      <main className="job-application-page">
        <div className="job-application-page__container">
          <button className="job-application-back" type="button" onClick={close}><Icon name="arrowLeft" size={15} /> Back to open jobs</button>
          {loading ? <div className="job-application-state"><span className="job-application-loader" /><strong>Loading application workspace...</strong></div> : error && !job ? <div className="job-application-state job-application-state--error"><Icon name="alert" size={24} /><strong>{error}</strong><button type="button" onClick={close}>Return to open jobs</button></div> : <section className="job-application-card" aria-labelledby="job-application-title">
            <header className="job-application-card__header"><div><span className="job-application-eyebrow"><i /> Application workspace</span><h1 id="job-application-title">Apply for {title}</h1><p>{job.company}{job.location ? ` · ${job.location}` : ""}</p></div><button className="job-application-close" type="button" aria-label="Close application" onClick={close}><Icon name="close" size={19} /></button></header>
            <div className="job-application-card__jobmeta">{jobMeta(job).map((item) => <span key={item}>{item}</span>)}<span className="job-application-card__open"><i /> Open role</span></div>
            <div className="job-application-candidate"><div className={`job-application-candidate__avatar ${profilePhoto ? "job-application-candidate__avatar--photo" : ""}`}>{profilePhoto ? <img src={profilePhoto} alt="Your profile" /> : (user?.displayName || "U").slice(0, 1).toUpperCase()}</div><div><strong>{user?.displayName || "Your profile"}</strong><span>{candidateHasProfile ? `${candidate.candidateRole || "Candidate profile"} · Saved CV fields will be shared` : "Upload a CV before applying"}</span></div><button type="button" onClick={() => navigate("/profile")}>Review profile <Icon name="arrowRight" size={14} /></button></div>
            {success ? <div className="job-application-success"><div className="job-application-success__icon"><Icon name="check" size={20} /></div><div><strong>Application sent successfully</strong><p>The hiring team can now review your CV profile for this role.</p></div><button type="button" onClick={close}>Browse more roles <Icon name="arrowRight" size={14} /></button></div> : existingApplication ? <div className="job-application-existing"><Icon name="check" size={18} /><div><strong>Application already submitted</strong><span>You have already applied for this role. The hiring team can review your saved CV profile.</span></div></div> : <form className="job-application-form" onSubmit={submit}><label>Cover letter <span>Optional · help the hiring team understand your interest</span><textarea value={coverLetter} onChange={(event) => setCoverLetter(event.target.value)} rows="7" placeholder="Tell the hiring team why this role interests you and what you can bring." /></label>{error && <p className="job-application-error" role="alert"><Icon name="alert" size={15} />{error}</p>}<div className="job-application-actions"><button className="job-application-cancel" type="button" onClick={close}>Cancel</button><button className="job-application-submit" type="submit" disabled={submitting || !candidateHasProfile}>{submitting ? "Sending..." : candidateHasProfile ? "Send application" : "Upload CV to apply"}<Icon name="arrowRight" size={16} /></button></div></form>}
          </section>}
        </div>
      </main>
    </div>
  </div>;
}

export default JobApplicationPage;
