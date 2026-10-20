import Icon from "../common/Icon";
import "./JobPublisher.css";

export default function JobPublisher({ job }) {
  const name = job?.publisherCompany?.name || job?.company;
  return <span className="job-publisher"><Icon name="briefcase" size={14} /><span>Published by <strong>{name || "Company not specified"}</strong></span></span>;
}
