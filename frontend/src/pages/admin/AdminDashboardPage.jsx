import { Navigate } from "react-router-dom";
import CvNavigation from "../../components/layout/CvNavigation";
import CvTopbar from "../../components/layout/CvTopbar";
import Icon from "../../components/common/Icon";
import AdminApplicationsBoard from "../../components/admin/AdminApplicationsBoard";
import AdminOverview from "./AdminOverview";
import { useAuth } from "../../context/AuthContext";
import "./AdminDashboardPage.css";
import "./AdminDashboardReference.css";
import "./AdminJobPosting.css";
import "./AdminJobCardBackgrounds.css";
import "./AdminJobTabsLayout.css";
import "./AdminApplicationCommandTheme.css";

import useAdminDashboard from "../../hooks/useAdminDashboard";
import AdminWorkspaceHeader from "./AdminWorkspaceHeader";
import AdminLegacyOverview from "./AdminLegacyOverview";
import AdminJobsWorkspace from "./AdminJobsWorkspace";

function AdminDashboardPage({ mode = "overview" }) {
  const { user } = useAuth();
  const workspace = useAdminDashboard(mode, user);
  const { navigationOpen, setNavigationOpen, activeView, applications, interviews, newApplications, pipelineStages, averageMatchScore, navigate, navigateFromSidebar, applicationQuery, setApplicationQuery, applicationStage, setApplicationStage, applicationJobFilter, setApplicationJobFilter, applicationSort, setApplicationSort, loading, error, suitableMatches, pendingMatches, applicationStageCounts, applicationJobOptions, filteredApplications, sortedApplications, applicationGroupCounts, changeApplicationStatus } = workspace;
  if (user?.role !== "admin") return <Navigate to="/matching" replace />;
  return (
    <div className="cv-app-shell admin-app-shell">
      <CvNavigation isOpen={navigationOpen} activeView={activeView} onNavigate={navigateFromSidebar} onClose={() => setNavigationOpen(false)} />
      <div className="cv-app-shell__main admin-app-shell__main">
        <CvTopbar activeView={activeView} onMenuToggle={() => setNavigationOpen(true)} />
        <main className={`admin-page admin-page--${mode}`} id="admin-overview">
          <div className="admin-page__container">
            <AdminWorkspaceHeader {...workspace} user={user} />

            {mode === "overview" && <AdminLegacyOverview {...workspace} />}

            {mode === "overview" && <AdminOverview applications={applications} interviews={interviews} pipelineStages={pipelineStages} averageMatchScore={averageMatchScore} navigate={navigate} />}

            {mode === "applications" && <section className="admin-application-command" aria-label="Application command centre">
              <div className="admin-application-command__intro">
                <div>
                  <span className="admin-overline"><i /> Candidate pipeline</span>
                  <h2>See your strongest matches first.</h2>
                  <p>Applications are grouped by job and ranked with the server-side CV matching result. Open a candidate to review the saved CV snapshot, job requirements, and next stage.</p>
                </div>
                <div className="admin-application-command__actions">
                  <button type="button" className="admin-button admin-button--primary" onClick={() => { setApplicationStage("new"); setApplicationJobFilter("all"); }}><Icon name="spark" size={15} /> Review new <b>{applicationStageCounts.new}</b></button>
                  <button type="button" className="admin-button admin-button--quiet" onClick={() => navigate("/admin/jobs")}><Icon name="briefcase" size={15} /> Manage roles <Icon name="arrowRight" size={14} /></button>
                </div>
              </div>
              <div className="admin-application-metrics">
                <article className="admin-application-metric admin-application-metric--total"><span className="admin-application-metric__icon admin-application-metric__icon--dark"><Icon name="people" size={16} /></span><div><strong>{applications.length}</strong><small>Total applicants</small></div></article>
                <article className="admin-application-metric admin-application-metric--review"><span className="admin-application-metric__icon admin-application-metric__icon--gold"><Icon name="spark" size={16} /></span><div><strong>{applicationStageCounts.new}</strong><small>Needs first review</small></div></article>
                <article className="admin-application-metric admin-application-metric--match"><span className="admin-application-metric__icon admin-application-metric__icon--teal"><Icon name="check" size={16} /></span><div><strong>{suitableMatches}</strong><small>Suitable model matches</small></div></article>
                <article className="admin-application-metric admin-application-metric--pending"><span className="admin-application-metric__icon admin-application-metric__icon--purple"><Icon name="activity" size={16} /></span><div><strong>{pendingMatches}</strong><small>Awaiting model score</small></div></article>
              </div>
              <div className="admin-application-pipeline" aria-label="Application stage summary">
                <div><span>Pipeline health</span><strong>{applications.length ? `${Math.round(((applicationStageCounts.shortlisted + applicationStageCounts.hired) / applications.length) * 100)}%` : "0%"}</strong></div>
                <div className="admin-application-pipeline__track"><i style={{ width: `${applications.length ? Math.max(2, ((applicationStageCounts.shortlisted + applicationStageCounts.hired) / applications.length) * 100) : 0}%` }} /></div>
                <div className="admin-application-pipeline__legend"><span><i className="is-new" />{applicationStageCounts.new} new</span><span><i className="is-reviewing" />{applicationStageCounts.reviewing} reviewing</span><span><i className="is-shortlisted" />{applicationStageCounts.shortlisted} shortlisted</span><span><i className="is-hired" />{applicationStageCounts.hired} hired</span></div>
              </div>
            </section>}

            {mode === "jobs" && <AdminJobsWorkspace {...workspace} />}

            {mode === "applications" && <AdminApplicationsBoard applications={applications} filteredApplications={filteredApplications} sortedApplications={sortedApplications} loading={loading} error={error} applicationQuery={applicationQuery} setApplicationQuery={setApplicationQuery} applicationStage={applicationStage} setApplicationStage={setApplicationStage} applicationJobFilter={applicationJobFilter} setApplicationJobFilter={setApplicationJobFilter} applicationSort={applicationSort} setApplicationSort={setApplicationSort} applicationJobOptions={applicationJobOptions} applicationGroupCounts={applicationGroupCounts} changeApplicationStatus={changeApplicationStatus} navigate={navigate} />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
