import { Fragment } from "react";
import ApplicationCard from "./ApplicationCard";
import ApplicationJobHeader from "./ApplicationJobHeader";
import ApplicationsFilters from "./ApplicationsFilters";
import Icon from "../common/Icon";
import { jobKey } from "./applicationBoardUtils";
import "./AdminApplicationsBoard.css";

function EmptyState({ filtered, navigate, clearFilters }) {
  return <div className="applications-empty"><span className="applications-empty__art"><Icon name={filtered ? "search" : "people"} size={28} /></span><strong>{filtered ? "No matching applications" : "Your talent pipeline is ready"}</strong><span>{filtered ? "Try a different name, role, job post, or stage." : "New candidates will appear here as soon as they apply."}</span><button type="button" onClick={filtered ? clearFilters : () => navigate("/admin/jobs")}>{filtered ? "Clear filters" : "View job posts"}<Icon name="arrowRight" size={13} /></button></div>;
}

function ApplicationList({ applications, counts, changeStatus, navigate }) {
  return <div className="application-result-list">{applications.map((application, index) => {
    const key = jobKey(application);
    const groupStart = index === 0 || jobKey(applications[index - 1]) !== key;
    return <Fragment key={application.id}>{groupStart && <ApplicationJobHeader application={application} count={counts[key]} />}<ApplicationCard application={application} changeApplicationStatus={changeStatus} navigate={navigate} /></Fragment>;
  })}</div>;
}

function AdminApplicationsBoard(props) {
  const { applications, filteredApplications, sortedApplications, loading, error, applicationGroupCounts, changeApplicationStatus, navigate } = props;
  const clearFilters = () => { props.setApplicationQuery(""); props.setApplicationStage("all"); props.setApplicationJobFilter("all"); };
  let content = <ApplicationList applications={sortedApplications} counts={applicationGroupCounts} changeStatus={changeApplicationStatus} navigate={navigate} />;
  if (loading) content = <div className="applications-empty"><span className="applications-empty__loader" />Loading applications...</div>;
  else if (!applications.length) content = <EmptyState navigate={navigate} clearFilters={clearFilters} />;
  else if (!filteredApplications.length) content = <EmptyState filtered navigate={navigate} clearFilters={clearFilters} />;
  return <section className="applications-workspace" id="applications" tabIndex="-1">{error && <p className="applications-workspace__error" role="alert"><Icon name="alert" size={15} />{error}</p>}{applications.length > 0 && <ApplicationsFilters {...props} />}{content}</section>;
}

export default AdminApplicationsBoard;
