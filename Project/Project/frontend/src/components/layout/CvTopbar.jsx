import Icon from "../common/Icon";
import { useAuth } from "../../context/AuthContext";
import "./CvTopbar.css";

function CvTopbar({ activeView, onMenuToggle, monochrome = false, profilePhoto = "" }) {
  const { user } = useAuth();
  const avatarPhoto = profilePhoto || user?.profilePhoto || "";
  const pageTitle = activeView === "analysis" ? "Analysis" : activeView === "jobs" ? "Open jobs" : activeView === "skill-analysis" ? "Skill analysis" : activeView === "interviews" ? "My interviews" : activeView === "profile" ? "My profile" : activeView === "admin-jobs" ? "Job posts" : activeView === "admin-applications" ? "Applications" : activeView === "admin-interviews" ? "Interview scheduling" : activeView === "admin-interview-results" ? "Interview results" : activeView === "admin" ? "Admin workspace" : "CV matcher";
  const isAdmin = activeView?.startsWith("admin");
  return (
    <header className={`cv-topbar ${isAdmin || monochrome ? "cv-topbar--admin" : ""}`}>
      <div className="cv-topbar__left">
        <button className="cv-topbar__menu" type="button" aria-label="Open navigation" onClick={onMenuToggle}><Icon name="menu" size={19} /></button>
        <div className="cv-topbar__breadcrumb">
          <span className="cv-topbar__workspace"><i />Workspace</span>
          <Icon name="chevronRight" size={13} />
          <div className="cv-topbar__page"><strong>{pageTitle}</strong><small>{isAdmin ? "Hiring operations" : "Candidate workspace"}</small></div>
        </div>
      </div>
      <div className="cv-topbar__right">
        <span className="cv-topbar__status"><i /><span><b>Gateway inference</b><small>Operational</small></span></span>
        <button className="cv-topbar__help" type="button" aria-label="Help and information" title="Help and information"><Icon name="info" size={17} /></button>
        <div className={`cv-topbar__avatar ${avatarPhoto ? "cv-topbar__avatar--photo" : ""}`} title={avatarPhoto ? "Your profile photo" : "Hugging Face model"}>
          {avatarPhoto ? <img src={avatarPhoto} alt="Your profile" /> : <span>HF</span>}
          <i />
        </div>
      </div>
    </header>
  );
}

export default CvTopbar;
