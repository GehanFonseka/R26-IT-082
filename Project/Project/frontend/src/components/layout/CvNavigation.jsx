import Icon from "../common/Icon";
import { useAuth } from "../../context/AuthContext";
import "./CvNavigation.css";

const navigationItems = [
  { label: "Open jobs", icon: "briefcase", view: "jobs" },
  { label: "Skill analysis", icon: "activity", view: "skill-analysis" },
  { label: "My interviews", icon: "calendar", view: "interviews" },
];

const adminNavigationItems = [
  { label: "Admin dashboard", icon: "dashboard", view: "admin" },
  { label: "Job posts", icon: "briefcase", view: "admin-jobs" },
  { label: "Applications", icon: "people", view: "admin-applications" },
  { label: "Interview scheduling", icon: "calendar", view: "admin-interviews" },
  { label: "Interview results", icon: "chart", view: "admin-interview-results" },
];

function CvNavigation({ isOpen, activeView, onNavigate, onClose }) {
  const { user, signOut } = useAuth();
  const items = user?.role === "admin" ? adminNavigationItems : navigationItems;
  const initials = (user?.displayName || "User").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return (
    <>
      {isOpen && <button className="cv-navigation__scrim" type="button" aria-label="Close navigation" onClick={onClose} />}
      <aside className={`cv-navigation ${user?.role === "admin" ? "cv-navigation--admin" : ""} ${isOpen ? "cv-navigation--open" : ""}`}>
        <div className="cv-navigation__brand">
          <div className="cv-navigation__brand-mark" aria-hidden="true"><Icon name="layers" size={18} /></div>
          <div className="cv-navigation__brand-copy"><strong>Match<span>OS</span></strong><small>Talent workspace</small></div>
          <button className="cv-navigation__close" type="button" aria-label="Close navigation" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>

        <div className="cv-navigation__workspace">
          <div className="cv-navigation__workspace-avatar" aria-hidden="true"><Icon name="compass" size={15} /></div>
          <div><span>Workspace</span><strong>Northstar Hiring</strong></div>
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
          {user?.role !== "admin" && <><span className="cv-navigation__label cv-navigation__label--spaced">Manage</span><a className="cv-navigation__item" href="#settings" onClick={onClose}><Icon name="tune" size={17} /><span>Settings</span></a></>}
        </nav>

        <div className="cv-navigation__bottom">
          {user?.role !== "admin" && <div className="cv-navigation__model-card">
            <div className="cv-navigation__model-icon"><Icon name="shield" size={16} /></div>
            <div><strong>Hugging Face inference</strong><span>Gehan77/cv-match-browser</span><small><i />Backend model service</small></div>
          </div>}
          <div className="cv-navigation__user">
            <div className="cv-navigation__user-avatar">{initials}</div>
            <div><strong>{user?.displayName}</strong><span>{user?.role === "admin" ? "Administrator" : "User"}</span></div>
            <button className="cv-navigation__logout" type="button" aria-label="Log out" title="Log out" onClick={() => { signOut(); onClose(); }}>
              <Icon name="logout" size={15} />
              <span>Log out</span>
            </button>
          </div>
          <a className={`cv-navigation__item ${(user?.role === "admin" ? activeView === "admin" : activeView === "profile") ? "cv-navigation__item--active" : ""}`} href={user?.role === "admin" ? "/admin" : "/profile"} onClick={onClose}><Icon name={user?.role === "admin" ? "dashboard" : "person"} size={17} /><span>{user?.role === "admin" ? "Admin workspace" : "My profile"}</span></a>
        </div>
      </aside>
    </>
  );
}

export default CvNavigation;
