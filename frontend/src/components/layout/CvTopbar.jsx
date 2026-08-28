import Icon from "../common/Icon";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./CvTopbar.css";
import "./CvAdminTopbar.css";

function CvTopbar({ activeView, onMenuToggle, monochrome = false, profilePhoto = "", notificationCount = 0 }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const avatarPhoto = profilePhoto || user?.profilePhoto || "";
  const adminInitial = (user?.displayName || "Admin").slice(0, 1).toUpperCase();
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
        {isAdmin && <div className="cv-topbar__quick-actions" aria-label="Admin shortcuts"><button type="button" aria-label="Admin dashboard" title="Admin dashboard" onClick={() => navigate("/admin")}><Icon name="dashboard" size={17} /></button><button type="button" aria-label="Job posts" title="Job posts" onClick={() => navigate("/admin/jobs")}><Icon name="briefcase" size={17} /></button><button type="button" aria-label="Interview calendar" title="Interview calendar" onClick={() => navigate("/admin/interviews")}><Icon name="calendar" size={17} /></button><button type="button" aria-label="Applications" title="Applications" onClick={() => navigate("/admin/applications")}><Icon name="people" size={17} /></button></div>}
        <span className="cv-topbar__status"><i /><span><b>Gateway inference</b><small>Operational</small></span></span>
        <button className="cv-topbar__help" type="button" aria-label="Help and information" title="Help and information"><Icon name="info" size={17} /></button>
        {isAdmin && <button className="cv-topbar__notifications" type="button" aria-label={`${notificationCount} notifications`} title="Notifications"><Icon name="bell" size={18} />{notificationCount > 0 && <b>{notificationCount}</b>}</button>}
        <div className={`cv-topbar__avatar ${avatarPhoto ? "cv-topbar__avatar--photo" : ""}`} title={avatarPhoto ? "Your profile photo" : "Local matching model"}>
          {avatarPhoto ? <img src={avatarPhoto} alt="Your profile" /> : <span>{isAdmin ? adminInitial : "HF"}</span>}
          <i />
        </div>
      </div>
    </header>
  );
}

export default CvTopbar;
