import Icon from "../common/Icon";
import "./ApplicationsHero.css";

function ApplicationsHero({ applications }) {
  const active = applications.filter(({ status }) => !["hired", "rejected"].includes(status)).length;
  const shortlisted = applications.filter(({ status }) => status === "shortlisted").length;
  return <header className="applications-hero"><div className="applications-hero__copy"><span><i />Candidate pipeline</span><h1>Applications</h1><p>Find the strongest candidates and move every conversation forward from one focused workspace.</p></div><div className="applications-hero__summary" aria-label="Application summary"><div><Icon name="people" size={16} /><span><strong>{applications.length}</strong>Received</span></div><div><Icon name="activity" size={16} /><span><strong>{active}</strong>In progress</span></div><div><Icon name="check" size={16} /><span><strong>{shortlisted}</strong>Shortlisted</span></div></div></header>;
}
export default ApplicationsHero;
