import "./SchedulingTabs.css";

const tabs = [
  { id: "jobs", label: "Job opportunities" },
  { id: "schedule", label: "Schedule interview" },
  { id: "upcoming", label: "Upcoming interviews" },
];

export default function SchedulingTabs({ activeTab, onChange, jobsCount, interviewsCount, selectedJob, query, onQueryChange, filter, onFilterChange }) {
  const handleKey = (event, index) => {
    let next;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tabs.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    onChange(tabs[next].id);
    document.getElementById(`scheduling-tab-${tabs[next].id}`)?.focus();
  };
  return <div className="scheduling-controls">
    <div className="scheduling-tabs" role="tablist" aria-label="Interview management">
      {tabs.map((tab, index) => <button key={tab.id} id={`scheduling-tab-${tab.id}`} type="button" role="tab"
        aria-selected={activeTab === tab.id} aria-controls={`scheduling-panel-${tab.id}`} tabIndex={activeTab === tab.id ? 0 : -1}
        onClick={() => onChange(tab.id)} onKeyDown={(event) => handleKey(event, index)}>
        {tab.label}{tab.id !== "schedule" && <span>{tab.id === "jobs" ? jobsCount : interviewsCount}</span>}
      </button>)}
    </div>
    {activeTab === "schedule" ? <div className="scheduling-context"><span>{selectedJob ? `Scheduling for ${selectedJob.title}` : "Start by selecting a job opportunity"}</span><button type="button" onClick={() => onChange("jobs")}>{selectedJob ? "Change job" : "Choose job"}</button></div>
      : <div className="scheduling-toolbar">
        <label><span>{activeTab === "jobs" ? "Search opportunities" : "Search interviews"}</span><input type="search" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder={activeTab === "jobs" ? "Job title, company or location" : "Candidate, job title or company"} /></label>
        <label><span>Show</span><select value={filter} onChange={(event) => onFilterChange(event.target.value)}>
          <option value="all">{activeTab === "jobs" ? "All opportunities" : "All scheduled interviews"}</option>
          {activeTab === "jobs" ? <><option value="open">Accepting applications</option><option value="closed">Closed roles</option><option value="ready">With candidates</option></> : <><option value="today">Today</option><option value="future">Future interviews</option></>}
        </select></label>
      </div>}
  </div>;
}
