import Icon from "../common/Icon";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import "./CvNavigation.css";
import "./CvAdminNavigation.css";
import "./CvNavigationCollapse.css";
import "./CvNavigationResponsive.css";

const navigationItems = [
  { label: "Open jobs", icon: "briefcase", view: "jobs" },
  { label: "Skill analysis", icon: "activity", view: "skill-analysis" },
  { label: "My interviews", icon: "calendar", view: "interviews" },
];

const adminNavigationItems = [
  { label: "Admin dashboard", icon: "dashboard", view: "admin" },
  { label: "Job posts", icon: "briefcase", view: "admin-jobs" },
  { label: "Applications", icon: "people", view: "admin-applications" },
  { label: "Attrition analytics", icon: "shield", view: "admin-attrition" },
  { label: "Interview scheduling", icon: "calendar", view: "admin-interviews" },
  { label: "Interview results", icon: "chart", view: "admin-interview-results" },
];

function CvNavigation({ isOpen, activeView, onNavigate, onClose }) {
  const { user, signOut } = useAuth();
  const items = user?.role === "admin" ? adminNavigationItems : navigationItems;
  const initials = (user?.displayName || "User").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const profilePhoto = user?.profilePhoto || "";
  const isAdmin = user?.role === "admin";
  return (
    <>
      {isOpen && <button className="cv-navigation__scrim" type="button" aria-label="Close navigation" onClick={onClose} />}
      <aside className={`cv-navigation ${isAdmin ? "cv-navigation--admin" : ""} ${isOpen ? "cv-navigation--open" : ""}`}>
        <div className="cv-navigation__brand">
          <div className="cv-navigation__brand-mark" aria-hidden="true"><Icon name="layers" size={18} /></div>
          <div className="cv-navigation__brand-copy"><strong>Match<span>OS</span></strong><small>Talent workspace</small></div>
          <button className="cv-navigation__close" type="button" aria-label="Close navigation" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>

        <div className="cv-navigation__workspace">
          <div className="cv-navigation__workspace-avatar" aria-hidden="true"><Icon name="compass" size={15} /></div>
          <div><span>Workspace</span><strong>{user?.companyName || "Personal workspace"}</strong></div>
          <Icon name="arrowDown" size={14} />
        </div>

        <nav className="cv-navigation__nav" aria-label="Main navigation">
          <span className="cv-navigation__label">{user?.role === "admin" ? "Admin workspace" : "Workspace"}</span>
          {items.map((item) => {
            const isActive = item.view === activeView;
            return (
              <button className={`cv-navigation__item ${isActive ? "cv-navigation__item--active" : ""}`} type="button" key={item.label} onClick={() => { if (item.view) onNavigate(item.view); onClose(); }}>
                <Icon name={item.icon} size={17} /><span>{item.label}</span>{item.active && <b>Live</b>}
              </button>
            );
          })}
          {isAdmin && <Link className={`cv-navigation__item ${activeView === "admin-management" ? "cv-navigation__item--active" : ""}`} to="/company/admins" title="Company admins" aria-current={activeView === "admin-management" ? "page" : undefined} onClick={onClose}><Icon name="people" size={17} /><span>Company admins</span></Link>}
        </nav>

        <div className="cv-navigation__bottom">
          <div className="cv-navigation__user">
            <div className={`cv-navigation__user-avatar ${profilePhoto ? "cv-navigation__user-avatar--photo" : ""}`}>
              {profilePhoto ? <img src={profilePhoto} alt="" /> : initials}
            </div>
            <div><strong>{user?.displayName}</strong><span>{user?.accountType === "company" ? "Company owner" : user?.role === "admin" ? "Company administrator" : "User"}</span></div>
            <button className="cv-navigation__logout" type="button" aria-label="Log out" title="Log out" onClick={() => { signOut(); onClose(); }}>
              <Icon name="logout" size={15} />
              <span>Log out</span>
            </button>
          </div>
          <a className={`cv-navigation__item ${(!isAdmin && activeView === "profile") ? "cv-navigation__item--active" : ""}`} href={isAdmin ? "/admin" : "/profile"} onClick={onClose}><Icon name={isAdmin ? "dashboard" : "person"} size={17} /><span>{isAdmin ? "Admin workspace" : "My profile"}</span></a>
        </div>
      </aside>
    </>
  );
}

export default CvNavigation;
