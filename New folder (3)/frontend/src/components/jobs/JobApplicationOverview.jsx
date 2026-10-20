import Icon from "../common/Icon";
import JobPublisher from "./JobPublisher";
import "./JobApplicationOverview.css";

export default function JobApplicationOverview({ job }) {
  const facts = [
    ["compass", "Location", job.location],
    ["clock", "Employment", job.employmentType || "Full-time"],
    ["layers", "Experience level", job.seniority],
    ["briefcase", "Industry", job.industry],
  ].filter(([, , value]) => value);
  return <aside className="application-overview" aria-label="Job overview">
    <div className="application-overview__art" aria-hidden="true"><Icon name="briefcase" size={30} /><span>YOUR NEXT CHAPTER</span></div>
    <div className="application-overview__content">
      <span className="application-overview__status"><i /> Open role</span>
      <h2>{job.title}</h2><JobPublisher job={job} />
      <dl>{facts.map(([icon, label, value]) => <div key={label}><span className="application-overview__icon"><Icon name={icon} size={17} /></span><div><dt>{label}</dt><dd>{value}</dd></div></div>)}</dl>
      <div className="application-overview__note"><Icon name="lightbulb" size={18} /><p>A little context goes a long way. Share what interests you about this role and the experience you would bring.</p></div>
    </div>
  </aside>;
}
