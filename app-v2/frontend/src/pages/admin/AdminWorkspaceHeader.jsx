import Icon from "../../components/common/Icon";
import { initials } from "./adminDashboardUtils";
import "./AdminWorkspaceHeader.css";

export default function AdminWorkspaceHeader({ user, openJobs, applications, newApplications, scheduledInterviews, goToAdminSection }) {
  return <>
            <header className="admin-hero" aria-labelledby="admin-hero-title">
              <div className="admin-hero__content">
                <span className="admin-eyebrow"><i /> Admin command center</span>
                <h1 id="admin-hero-title">Admin workspace</h1>
                <p>Manage every role, candidate, and interview from one focused hiring workspace.</p>
                <div className="admin-hero__actions">
                  <button className="admin-button admin-button--primary" type="button" onClick={() => goToAdminSection("admin-jobs")}><Icon name="plus" size={16} /> Post a new job</button>
                  <button className="admin-button admin-button--quiet" type="button" onClick={() => goToAdminSection("admin-applications")}><Icon name="people" size={16} /> Review applications</button>
                </div>
              </div>
              <div className="admin-hero__identity">
                <div className="admin-hero__avatar">{initials(user.displayName)}</div>
                <span>Signed in as</span>
                <strong>{user.displayName}</strong>
                <small>{user.email}</small>
                <div className="admin-hero__identity-meta" aria-label="Workspace overview">
                  <span><b>{openJobs}</b><small>Open roles</small></span>
                  <i />
                  <span><b>{applications.length}</b><small>Applications</small></span>
                </div>
              </div>
            </header>

            <section className="admin-stats" aria-label="Recruiting overview">
              <article className="admin-stat admin-stat--open-jobs"><span className="admin-stat__icon admin-stat__icon--purple"><Icon name="briefcase" size={17} /></span><div><small>Open jobs</small><strong>{openJobs}</strong><span>Currently accepting applications</span></div><svg className="admin-stat__spark admin-stat__spark--purple" viewBox="0 0 120 44" aria-hidden="true"><polyline points="2,35 16,30 29,34 42,22 54,27 67,17 80,25 94,9 106,17 118,4" /></svg></article>
              <article className="admin-stat admin-stat--total-applications"><span className="admin-stat__icon admin-stat__icon--teal"><Icon name="people" size={17} /></span><div><small>Total applications</small><strong>{applications.length}</strong><span>Across every published role</span></div><svg className="admin-stat__spark admin-stat__spark--teal" viewBox="0 0 120 44" aria-hidden="true"><polyline points="2,29 14,15 26,18 39,38 51,20 64,23 77,8 89,31 101,5 118,17" /></svg></article>
              <article className="admin-stat admin-stat--needs-review"><span className="admin-stat__icon admin-stat__icon--gold"><Icon name="spark" size={17} /></span><div><small>Needs review</small><strong>{newApplications}</strong><span>New candidate submissions</span></div><svg className="admin-stat__spark admin-stat__spark--gold" viewBox="0 0 120 44" aria-hidden="true"><polyline points="2,32 15,25 28,30 39,16 51,27 63,8 76,24 88,12 101,28 112,7 118,12" /></svg></article>
              <article className="admin-stat admin-stat--interviews-planned"><span className="admin-stat__icon admin-stat__icon--blue"><Icon name="calendar" size={17} /></span><div><small>Interviews planned</small><strong>{scheduledInterviews}</strong><span>Upcoming conversations</span></div><svg className="admin-stat__spark admin-stat__spark--blue" viewBox="0 0 120 44" aria-hidden="true"><polyline points="2,30 16,25 27,31 41,17 53,24 65,12 77,22 88,8 99,29 110,19 118,27" /></svg></article>
            </section>


  </>;
}
