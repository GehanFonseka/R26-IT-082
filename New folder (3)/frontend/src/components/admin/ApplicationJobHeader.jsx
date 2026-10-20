import Icon from "../common/Icon";
import { jobSubtitle, jobTitle } from "./applicationBoardUtils";
import "./ApplicationJobHeader.css";

function ApplicationJobHeader({ application, count }) {
  const company = application.job?.company;
  const location = application.job?.location;
  return <header className="application-job-header"><span className="application-job-header__icon"><Icon name="briefcase" size={19} /></span><div className="application-job-header__copy"><span className="application-job-header__eyebrow"><i />Open position <b>{count} application{count === 1 ? "" : "s"}</b></span><h3>{jobTitle(application)}</h3><div className="application-job-header__meta">{company && <span><Icon name="briefcase" size={11} />{company}</span>}{location && <span><Icon name="compass" size={11} />{location}</span>}{!company && !location && <span>{jobSubtitle(application)}</span>}</div></div><div className="application-job-header__count"><span><Icon name="people" size={16} /></span><div><strong>{count}</strong><small>Candidate{count === 1 ? "" : "s"}</small></div><Icon name="chevronRight" size={15} /></div></header>;
}
export default ApplicationJobHeader;
