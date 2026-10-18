import Icon from "../../components/common/Icon";
import "./AdminJobTabs.css";

function AdminJobTabs({ activeTab, onChange, jobCount }) {
  const tabs = [
    { id: "create", label: "Create post", icon: "plus", panel: "job-posts" },
    { id: "published", label: "Published jobs", icon: "briefcase", panel: "published-jobs" },
  ];

  const handleKeyDown = (event, index) => {
    const next = event.key === "ArrowRight" ? index + 1 : event.key === "ArrowLeft" ? index - 1 : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : null;
    if (next === null) return;
    event.preventDefault();
    const target = tabs[(next + tabs.length) % tabs.length];
    onChange(target.id);
    event.currentTarget.parentElement.querySelector(`#admin-job-tab-${target.id}`)?.focus();
  };

  return <div className="admin-job-tabs" role="tablist" aria-label="Job posts sections">
    {tabs.map((tab, index) => <button key={tab.id} id={`admin-job-tab-${tab.id}`} type="button" role="tab" aria-selected={activeTab === tab.id} aria-controls={tab.panel} tabIndex={activeTab === tab.id ? 0 : -1} onClick={() => onChange(tab.id)} onKeyDown={(event) => handleKeyDown(event, index)}>
      <Icon name={tab.icon} size={17} /><span>{tab.label}</span>{tab.id === "published" && <b>{jobCount}</b>}
    </button>)}
  </div>;
}

export default AdminJobTabs;
