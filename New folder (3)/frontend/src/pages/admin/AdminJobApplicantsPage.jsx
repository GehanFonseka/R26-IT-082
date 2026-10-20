/**
 * Purpose: Dedicated applicants management page for a specific job requisition.
 * Responsibilities:
 * - Lists and ranks applicants applying for the specified jobId.
 * - Displays match score, skill score, attrition risk score, and review status.
 * - Allows filtering by stage, sorting by ranking criteria, and generating applicant reports.
 * Contents: AdminJobApplicantsPage component.
 * Used by: AppRoutes.jsx (/admin/jobs/:jobId).
 * Dependencies: loadRankedApplicants, useApplicantListAttrition, JobApplicantsReportModal, ApplicantRowMetrics, JobPublisher.
 * Route: /admin/jobs/:jobId.
 * API integration: GET /api/jobs, GET /api/applications, POST /api/attrition/predict (via useApplicantListAttrition).
 * Data flow: Extracts jobId from URL params, loads applications for that job, scores and ranks them, renders candidate table.
 * Related files: ApplicantJobDashboard.jsx, JobApplicantsReportModal.jsx, applicantRankingService.js.
 */
import { useEffect, useState, useMemo } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import JobPublisher from "../../components/jobs/JobPublisher";
import CvNavigation from "../../components/layout/CvNavigation";
import CvTopbar from "../../components/layout/CvTopbar";
import Icon from "../../components/common/Icon";
import ApplicantRowMetrics from "../../components/admin/ApplicantRowMetrics";
import JobApplicantsReportModal from "../../components/admin/JobApplicantsReportModal";
import { initials, jobKey } from "../../components/admin/applicationBoardUtils";
import { useAuth } from "../../context/AuthContext";
import { getAdminJobs, getAdminApplications } from "../../services/apiClient";
import { loadRankedApplicants } from "../../services/applicantRankingService";
import { useApplicantListAttrition } from "../../hooks/useApplicantListAttrition";
import { descriptionScore, skillScore } from "../../utils/applicantRanking";
import { attritionModels, attritionScore } from "../../utils/attritionResults";
import "./AdminDashboardPage.css";
import "./AdminJobApplicantsPage.css";

const destinations = {
  admin: "/admin",
  "admin-jobs": "/admin/jobs",
  "admin-applications": "/admin/applications",
  "admin-attrition": "/admin/attrition",
  "admin-interviews": "/admin/interviews",
  "admin-interview-results": "/admin/interview-results",
  matcher: "/matching",
};

const percentage = (value) =>
  value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value)) && Number(value) >= 0
    ? `${Number(value).toFixed(1)}%`
    : "—";

function AdminJobApplicantsPage() {
  const { user } = useAuth();
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [navigationOpen, setNavigationOpen] = useState(false);
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters, sorting, search, and report modal state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("best"); // "best" | "match-desc" | "risk-asc" | "risk-desc" | "name-asc" | "newest"
  const [riskFilter, setRiskFilter] = useState("all"); // "all" | "star" | "low" | "medium" | "high"
  const [stageFilter, setStageFilter] = useState("all"); // "all" | "new" | "reviewing" | "shortlisted" | "hired" | "rejected"
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Background async attrition calculations
  const attritionResults = useApplicantListAttrition(applications, job);

  useEffect(() => {
    if (user?.role !== "admin") return;
    let mounted = true;
    setLoading(true);
    setError("");
    setJob(null);
    setApplications([]);

    Promise.all([getAdminJobs(), getAdminApplications()])
      .then(async ([jobsResponse, applicationsResponse]) => {
        if (!mounted) return;
        const selectedJob = (jobsResponse.data || []).find((item) => String(item.id) === jobId) || null;
        setJob(selectedJob);
        if (!selectedJob) return;

        const applicants = (applicationsResponse.data || []).filter((item) => String(jobKey(item)) === jobId);
        const ranked = await loadRankedApplicants(applicants, selectedJob, () => mounted);
        if (!mounted) return;

        setApplications(ranked.applications);
        if (ranked.incomplete) {
          setError("Some model scores are currently updating. Candidates are ordered by available qualification ratings.");
        }
      })
      .catch((requestError) => mounted && setError(requestError.message || "Could not load applicants for this job."))
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [jobId, user?.role]);

  // Enrich applications with normalized scores, attrition risk, and composite suitability
  const enrichedApplications = useMemo(() => {
    return applications.map((app) => {
      const applicant = app.applicant || {};
      const name = applicant.displayName || app.candidate?.name || "Candidate";
      const email = applicant.email || "";
      const cvMatch = descriptionScore(app) * 100;
      const skillEvidence = skillScore(app, job);
      const analysis = app.candidateAnalysis;
      const technical = analysis?.model?.status === "live" ? analysis.technicalCompetencyScore : null;

      const assessment = attritionResults[app.id]?.result;
      const models = attritionModels(assessment);
      const attrition = attritionScore(models?.attrition);
      const riskLevel = attrition === null ? "unknown" : attrition < 35 ? "low" : attrition < 65 ? "medium" : "high";

      // Overall suitability composite score: 60% CV Match + 40% Retention Stability (100 - Attrition)
      const matchVal = cvMatch >= 0 ? cvMatch : 50;
      const retentionVal = attrition !== null ? (100 - attrition) : 65;
      const compositeScore = Math.round((matchVal * 0.6) + (retentionVal * 0.4));
      const isStar = (cvMatch >= 70 && (attrition === null || attrition < 35));

      return {
        ...app,
        name,
        email,
        cvMatch: cvMatch >= 0 ? cvMatch : null,
        skillEvidence: skillEvidence >= 0 ? skillEvidence : null,
        technical: technical !== null && technical >= 0 ? technical : null,
        attritionScore: attrition,
        riskLevel,
        compositeScore,
        isStar,
      };
    });
  }, [applications, job, attritionResults]);

  // Aggregate executive metrics for the job requisition
  const summaryStats = useMemo(() => {
    const total = enrichedApplications.length;
    const scoredMatches = enrichedApplications.filter((a) => a.cvMatch !== null);
    const avgMatch = scoredMatches.length
      ? scoredMatches.reduce((sum, a) => sum + a.cvMatch, 0) / scoredMatches.length
      : 0;

    const starCount = enrichedApplications.filter((a) => a.isStar).length;
    const safeCount = enrichedApplications.filter((a) => a.riskLevel === "low").length;
    const watchlistCount = enrichedApplications.filter((a) => a.riskLevel === "medium" || a.riskLevel === "high").length;

    // Identify overall top candidate
    const sortedByBest = [...enrichedApplications].sort((a, b) => b.compositeScore - a.compositeScore);
    const topCandidate = sortedByBest[0] || null;

    return {
      total,
      avgMatch,
      starCount,
      safeCount,
      watchlistCount,
      topCandidate,
    };
  }, [enrichedApplications]);

  // Apply search query, filters, and sorting
  const filteredApplications = useMemo(() => {
    let result = [...enrichedApplications];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((app) => {
        const name = (app.name || "").toLowerCase();
        const email = (app.email || "").toLowerCase();
        const role = (app.candidate?.candidateRole || "").toLowerCase();
        return name.includes(q) || email.includes(q) || role.includes(q);
      });
    }

    // Risk & Star filter
    if (riskFilter === "star") {
      result = result.filter((app) => app.isStar);
    } else if (riskFilter === "low") {
      result = result.filter((app) => app.riskLevel === "low");
    } else if (riskFilter === "medium") {
      result = result.filter((app) => app.riskLevel === "medium");
    } else if (riskFilter === "high") {
      result = result.filter((app) => app.riskLevel === "high");
    }

    // Stage filter
    if (stageFilter !== "all") {
      result = result.filter((app) => (app.status || "new").toLowerCase() === stageFilter.toLowerCase());
    }

    // Sorting logic
    result.sort((a, b) => {
      if (sortBy === "best") {
        return b.compositeScore - a.compositeScore;
      }
      if (sortBy === "match-desc") {
        return (b.cvMatch ?? -1) - (a.cvMatch ?? -1);
      }
      if (sortBy === "risk-asc") {
        if (a.attritionScore === null && b.attritionScore === null) return 0;
        if (a.attritionScore === null) return 1;
        if (b.attritionScore === null) return -1;
        return a.attritionScore - b.attritionScore;
      }
      if (sortBy === "risk-desc") {
        if (a.attritionScore === null && b.attritionScore === null) return 0;
        if (a.attritionScore === null) return 1;
        if (b.attritionScore === null) return -1;
        return b.attritionScore - a.attritionScore;
      }
      if (sortBy === "name-asc") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "newest") {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      return 0;
    });

    return result;
  }, [enrichedApplications, searchQuery, riskFilter, stageFilter, sortBy]);

  if (user?.role !== "admin") return <Navigate to="/matching" replace />;

  return (
    <div className="cv-app-shell admin-app-shell job-applicants-app-shell">
      <CvNavigation
        isOpen={navigationOpen}
        activeView="admin-jobs"
        onNavigate={(view) => navigate(destinations[view] || "/admin")}
        onClose={() => setNavigationOpen(false)}
      />

      <div className="cv-app-shell__main admin-app-shell__main">
        <CvTopbar activeView="admin-jobs" onMenuToggle={() => setNavigationOpen(true)} />

        <main className="admin-page admin-job-applicants-page">
          <div className="admin-page__container">
            {/* Navigation Breadcrumb Bar */}
            <div className="job-applicants-nav-row">
              <Link className="job-applicants-back-btn" to="/admin/jobs">
                <Icon name="arrowLeft" size={15} />
                <span>Back to Job Posts</span>
              </Link>

              {job && (
                <div className="job-applicants-top-actions">
                  <button
                    type="button"
                    className="job-report-trigger-btn"
                    onClick={() => setIsReportOpen(true)}
                  >
                    <Icon name="download" size={15} />
                    <span>Generate Candidate Report</span>
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div role="alert" className="job-applicants-notice">
                <Icon name="info" size={16} />
                <p>{error}</p>
                <button type="button" onClick={() => setError("")} aria-label="Dismiss notice">
                  <Icon name="close" size={14} />
                </button>
              </div>
            )}

            {loading ? (
              <div className="job-applicants-loading">
                <div className="job-applicants-spinner">
                  <Icon name="refresh" size={24} className="spin" />
                </div>
                <h3>Evaluating Job Pipeline</h3>
                <p>Ranking applicants by CV match, skill evidence, and CatBoost retention stability...</p>
              </div>
            ) : job ? (
              <>
                {/* Executive Requisition Hero */}
                <header className="job-applicants-hero">
                  <div className="job-applicants-hero__backdrop-pattern" />
                  <div className="job-applicants-hero__content">
                    <div className="job-applicants-hero__meta-top">
                      <span className="job-applicants-eyebrow">
                        <Icon name="briefcase" size={13} />
                        Job Requisition · Candidate Evaluation
                      </span>
                      <span className={`job-status-chip job-status-chip--${job.status || "open"}`}>
                        <span className="job-status-dot" />
                        {job.status === "open" ? "Accepting Applications" : "Closed"}
                      </span>
                    </div>

                    <h1 className="job-applicants-title">{job.title}</h1>

                    <div className="job-applicants-details-row">
                      <JobPublisher job={job} />
                      <span className="job-bullet">·</span>
                      <span className="job-meta-item">
                        <Icon name="compass" size={13} />
                        {[job.company, job.location, job.employmentType].filter(Boolean).join(" · ")}
                      </span>
                    </div>

                    <div className="job-applicants-hero-actions">
                      <button
                        type="button"
                        className="hero-action-btn hero-action-btn--primary"
                        onClick={() => setIsReportOpen(true)}
                      >
                        <Icon name="download" size={15} />
                        <span>Generate Candidate Report</span>
                      </button>
                      <Link
                        to={`/admin/jobs/${encodeURIComponent(job.id)}/edit`}
                        className="hero-action-btn hero-action-btn--ghost"
                      >
                        <Icon name="edit" size={14} />
                        <span>Edit Requisition</span>
                      </Link>
                    </div>
                  </div>

                  {/* Executive Metric Tiles Bar */}
                  <div className="job-applicants-hero__kpis">
                    <div className="job-kpi-card">
                      <small>Total Candidates</small>
                      <strong>{summaryStats.total}</strong>
                      <span>All Applicants</span>
                    </div>

                    <div className="job-kpi-card">
                      <small>Average CV Match</small>
                      <strong>{summaryStats.avgMatch.toFixed(1)}%</strong>
                      <span>Cohort Benchmark</span>
                    </div>

                    <div className="job-kpi-card job-kpi-card--highlight">
                      <small>Star Retainees</small>
                      <strong>{summaryStats.starCount}</strong>
                      <span>High Match + Safe Risk</span>
                    </div>

                    <div className="job-kpi-card">
                      <small>Safe Retention Rate</small>
                      <strong>
                        {summaryStats.total > 0
                          ? `${Math.round((summaryStats.safeCount / summaryStats.total) * 100)}%`
                          : "—"}
                      </strong>
                      <span>Turnover Risk &lt;35%</span>
                    </div>
                  </div>
                </header>

                {/* Overall Best Candidate Spotlight Card */}
                {summaryStats.topCandidate && (
                  <section className="top-candidate-spotlight">
                    <div className="top-candidate-spotlight__banner">
                      <div className="top-candidate-badge">
                        <Icon name="spark" size={14} />
                        <span>Overall Top Candidate Pick</span>
                      </div>
                      <span className="top-candidate-score-pill">
                        Match & Retention Score: <strong>{summaryStats.topCandidate.compositeScore}/100</strong>
                      </span>
                    </div>

                    <div className="top-candidate-spotlight__body">
                      <div className="top-candidate-profile">
                        <div className="top-candidate-avatar">
                          {summaryStats.topCandidate.applicant?.profilePhoto ? (
                            <img src={summaryStats.topCandidate.applicant.profilePhoto} alt="" />
                          ) : (
                            initials(summaryStats.topCandidate.name)
                          )}
                        </div>
                        <div className="top-candidate-info">
                          <h3>{summaryStats.topCandidate.name}</h3>
                          <p>{summaryStats.topCandidate.email} · Applied for {job.title}</p>
                          <div className="top-candidate-tags">
                            <span className="top-tag top-tag--match">
                              CV Match: <strong>{percentage(summaryStats.topCandidate.cvMatch)}</strong>
                            </span>
                            <span className={`top-tag top-tag--risk top-tag--risk-${summaryStats.topCandidate.riskLevel}`}>
                              Attrition: <strong>{percentage(summaryStats.topCandidate.attritionScore)}</strong>
                              <small>
                                {summaryStats.topCandidate.riskLevel === "low"
                                  ? " (Safe to Retain)"
                                  : summaryStats.topCandidate.riskLevel === "medium"
                                  ? " (Watchlist)"
                                  : " (Flight Risk)"}
                              </small>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="top-candidate-actions">
                        <Link
                          to={`/admin/jobs/${encodeURIComponent(jobId)}/applicants/${encodeURIComponent(summaryStats.topCandidate.id)}`}
                          className="spotlight-btn spotlight-btn--primary"
                        >
                          <span>View Full Profile</span>
                          <Icon name="arrowRight" size={14} />
                        </Link>
                        <Link
                          to={`/admin/jobs/${encodeURIComponent(jobId)}/applicants/${encodeURIComponent(summaryStats.topCandidate.id)}?tab=attrition`}
                          state={{ tab: "attrition" }}
                          className="spotlight-btn spotlight-btn--ghost"
                        >
                          <Icon name="tune" size={13} />
                          <span>Simulate Interventions</span>
                        </Link>
                      </div>
                    </div>
                  </section>
                )}

                {/* Search, Filter & Sorting Bar */}
                <section className="job-applicants-toolbar" aria-label="Applicant filtering and sorting">
                  <div className="job-applicants-search-wrap">
                    <Icon name="search" size={16} />
                    <input
                      type="text"
                      placeholder="Search candidates by name, email, or role..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        className="search-clear-btn"
                        onClick={() => setSearchQuery("")}
                        aria-label="Clear search query"
                      >
                        <Icon name="close" size={14} />
                      </button>
                    )}
                  </div>

                  <div className="job-applicants-filter-controls">
                    {/* Risk / Recommendation Filter Tabs */}
                    <div className="filter-pill-group">
                      <button
                        type="button"
                        className={`filter-pill ${riskFilter === "all" ? "active" : ""}`}
                        onClick={() => setRiskFilter("all")}
                      >
                        All Candidates ({summaryStats.total})
                      </button>
                      <button
                        type="button"
                        className={`filter-pill filter-pill--star ${riskFilter === "star" ? "active" : ""}`}
                        onClick={() => setRiskFilter("star")}
                      >
                        ⭐ Top Matches ({summaryStats.starCount})
                      </button>
                      <button
                        type="button"
                        className={`filter-pill filter-pill--safe ${riskFilter === "low" ? "active" : ""}`}
                        onClick={() => setRiskFilter("low")}
                      >
                        🛡️ Safe to Retain ({summaryStats.safeCount})
                      </button>
                      <button
                        type="button"
                        className={`filter-pill filter-pill--watchlist ${riskFilter === "medium" || riskFilter === "high" ? "active" : ""}`}
                        onClick={() => setRiskFilter(riskFilter === "medium" ? "high" : "medium")}
                      >
                        ⚠️ Watchlist ({summaryStats.watchlistCount})
                      </button>
                    </div>

                    {/* Sorting Dropdown */}
                    <div className="job-sort-select-wrap">
                      <label htmlFor="job-sort-by">
                        <Icon name="tune" size={13} />
                        <span>Sort:</span>
                      </label>
                      <select
                        id="job-sort-by"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                      >
                        <option value="best">🏆 Overall Best Candidates (Recommended)</option>
                        <option value="match-desc">📈 Highest CV Match First</option>
                        <option value="risk-asc">🛡️ Lowest Attrition Risk (Safest First)</option>
                        <option value="risk-desc">⚠️ Highest Attrition Risk (Flight Risk First)</option>
                        <option value="name-asc">🔤 Candidate Name (A–Z)</option>
                        <option value="newest">📅 Newest Applied First</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* Candidate Roster List */}
                <section className="job-applicants-roster-section" aria-label={`Applicants for ${job.title}`}>
                  <div className="job-roster-header">
                    <div>
                      <h2>Applicant Rankings ({filteredApplications.length})</h2>
                      <p>Candidates evaluated against role requirements and machine-learning retention stability.</p>
                    </div>

                    {(searchQuery || riskFilter !== "all" || stageFilter !== "all" || sortBy !== "best") && (
                      <button
                        type="button"
                        className="reset-filters-link"
                        onClick={() => {
                          setSearchQuery("");
                          setRiskFilter("all");
                          setStageFilter("all");
                          setSortBy("best");
                        }}
                      >
                        <Icon name="refresh" size={13} />
                        <span>Reset Filters</span>
                      </button>
                    )}
                  </div>

                  {filteredApplications.length ? (
                    <div className="job-applicants-table-wrap">
                      <ul className="job-applicants-list">
                        {filteredApplications.map((application, index) => {
                          const applicant = application.applicant || {};
                          const name = application.name;
                          const cvMatch = application.cvMatch;
                          const attrition = application.attritionScore;
                          const riskBand = application.riskLevel;
                          const isTop = index === 0 && sortBy === "best";

                          return (
                            <li className={`job-applicant-row ${isTop ? "job-applicant-row--top" : ""}`} key={application.id}>
                              <div className="job-applicant-row__rank">
                                <span>#{index + 1}</span>
                              </div>

                              <div className="job-applicant-row__identity">
                                <span className="job-applicant-avatar">
                                  {applicant.profilePhoto ? (
                                    <img src={applicant.profilePhoto} alt="" />
                                  ) : (
                                    initials(name)
                                  )}
                                </span>

                                <div className="job-applicant-names">
                                  <div className="name-with-badges">
                                    <Link
                                      to={`/admin/jobs/${encodeURIComponent(jobId)}/applicants/${encodeURIComponent(application.id)}`}
                                      className="applicant-name-link"
                                    >
                                      {name}
                                    </Link>
                                    {application.isStar && (
                                      <span className="star-candidate-badge" title="High Match (≥70%) & Safe Retention Risk (<35%)">
                                        ⭐ Top Match
                                      </span>
                                    )}
                                  </div>
                                  <small className="applicant-email">{application.email}</small>
                                </div>
                              </div>

                              {/* Row Metrics (CV Match, Skill Evidence, Technical, Attrition Risk) */}
                              <div className="job-applicant-row__metrics">
                                <ApplicantRowMetrics
                                  application={application}
                                  job={job}
                                  assessment={attritionResults[application.id]}
                                />
                              </div>

                              {/* Action Buttons */}
                              <div className="job-applicant-row__actions">
                                <Link
                                  to={`/admin/jobs/${encodeURIComponent(jobId)}/applicants/${encodeURIComponent(application.id)}`}
                                  className="applicant-view-profile-btn"
                                  title="View full CV, analysis, and interview evaluations"
                                >
                                  <span>View Profile</span>
                                  <Icon name="chevronRight" size={15} />
                                </Link>
                                <Link
                                  to={`/admin/jobs/${encodeURIComponent(jobId)}/applicants/${encodeURIComponent(application.id)}?tab=attrition`}
                                  state={{ tab: "attrition" }}
                                  className="applicant-simulate-btn"
                                  title="Open What-If Simulator for retention interventions"
                                >
                                  <Icon name="tune" size={14} />
                                </Link>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : (
                    <div className="job-applicants-empty-state">
                      <div className="empty-icon-wrap">
                        <Icon name="people" size={32} />
                      </div>
                      <h3>No candidates match your current filter</h3>
                      <p>Try clearing your search keyword or switching your risk filter tabs.</p>
                      <button
                        type="button"
                        className="empty-reset-btn"
                        onClick={() => {
                          setSearchQuery("");
                          setRiskFilter("all");
                          setStageFilter("all");
                          setSortBy("best");
                        }}
                      >
                        Reset All Filters
                      </button>
                    </div>
                  )}
                </section>
              </>
            ) : !error ? (
              <div className="job-not-found-state">
                <Icon name="alert" size={36} />
                <h2>Job Requisition Not Found</h2>
                <p>The requested job posting may have been archived or removed.</p>
                <Link to="/admin/jobs" className="btn-return-jobs">
                  Return to Job Posts
                </Link>
              </div>
            ) : null}
          </div>
        </main>
      </div>

      {/* Professional Job Requisition Candidate Evaluation Report Modal */}
      <JobApplicantsReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        job={job}
        applications={applications}
        attritionResults={attritionResults}
        companyName={user?.companyName || job?.company || "Talent Workspace"}
      />
    </div>
  );
}

export default AdminJobApplicantsPage;

