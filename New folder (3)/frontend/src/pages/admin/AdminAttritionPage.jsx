/**
 * Purpose: Strategic workforce retention & attrition analytics dashboard for hiring administrators.
 * Responsibilities:
 * - Evaluates flight risk across candidates using the CatBoost machine learning attrition model.
 * - Displays KPI cards (Mean Attrition Risk, Safe Rate, Watchlist, Flight Risk).
 * - Implements 4-Quadrant Talent Matrix (Match Potential vs Retention Stability).
 * - Provides interactive candidate roster with RiskMeter gauges, filtering, sorting, and search.
 * - Triggers Explainable AI (XAI) modal and official executive retention report generation (PDF/CSV).
 * Contents: AdminAttritionPage component, percentage helper.
 * Used by: AppRoutes.jsx (/admin/attrition).
 * Dependencies: getAttritionAssessment, getApplicantAttritionInput, AttritionReportModal, ExplainableAiModal, RiskMeter, CvNavigation, CvTopbar.
 * Route: /admin/attrition.
 * API integration: GET /api/jobs, GET /api/applications, POST /api/attrition/predict.
 * Data flow: Loads job requisitions and candidate applications; runs concurrent batch predictions; computes summary stats and 4-quadrant matrices.
 * Related files: AttritionReportModal.jsx, ExplainableAiModal.jsx, WhatIfSimulation.jsx, attritionService.js.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import CvNavigation from "../../components/layout/CvNavigation";
import CvTopbar from "../../components/layout/CvTopbar";
import Icon from "../../components/common/Icon";
import RiskMeter from "../../components/attrition/RiskMeter";
import AttritionReportModal from "../../components/admin/AttritionReportModal";
import ExplainableAiModal from "../../components/admin/ExplainableAiModal";
import { useAuth } from "../../context/AuthContext";
import { getAdminJobs, getAdminApplications } from "../../services/apiClient";
import { getApplicantAttritionInput } from "../../services/applicantAttritionService";
import { getAttritionAssessment } from "../../services/attritionService";
import { defaultSimulation } from "../../data/demoCandidate";
import { attritionScore as scoreFor } from "../../utils/attritionResults";
import { descriptionScore, skillScore } from "../../utils/applicantRanking";
import { initials } from "./adminDashboardUtils";
import "./AdminDashboardPage.css";
import "./AdminAttritionPage.css";

const percentage = (value) => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value)) && Number(value) >= 0
  ? `${Number(value).toFixed(1)}%` : "—";

function AdminAttritionPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [sortBy, setSortBy] = useState("low-risk"); // User requested low result first
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isXaiOpen, setIsXaiOpen] = useState(false);
  const [xaiCandidateId, setXaiCandidateId] = useState(null);
  const [attritionResults, setAttritionResults] = useState({});
  const [analyzingCount, setAnalyzingCount] = useState(0);
  const [viewMode, setViewMode] = useState("roster"); // "roster" | "matrix"

  // Load jobs and applications
  useEffect(() => {
    if (user?.role !== "admin") return;
    let active = true;
    setLoading(true);
    Promise.all([getAdminJobs(), getAdminApplications()])
      .then(([jobsRes, appsRes]) => {
        if (!active) return;
        setJobs(jobsRes.data || []);
        setApplications(appsRes.data || []);
      })
      .catch((err) => {
        if (active) setError(err.message || "Could not load attrition data.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [user]);

  // Lookup map for jobs
  const jobMap = useMemo(() => {
    const map = {};
    for (const j of jobs) map[j.id] = j;
    return map;
  }, [jobs]);

  // Filter applications by selected job
  const scopedApplications = useMemo(() => {
    if (selectedJobId === "all") return applications;
    return applications.filter((app) => (app.jobId || app.job?.id) === selectedJobId);
  }, [applications, selectedJobId]);

  // Selected job object
  const currentJob = useMemo(() => {
    if (selectedJobId === "all") return null;
    return jobMap[selectedJobId] || null;
  }, [selectedJobId, jobMap]);

  // Batch calculate attrition scores for scoped applications
  useEffect(() => {
    if (!scopedApplications.length) return;
    let active = true;
    const toAssess = scopedApplications.filter((app) => !attritionResults[app.id]);
    if (!toAssess.length) return;

    let cursor = 0;
    setAnalyzingCount((prev) => prev + toAssess.length);

    async function worker() {
      while (active && cursor < toAssess.length) {
        const app = toAssess[cursor++];
        const job = jobMap[app.jobId || app.job?.id] || app.job || {};
        try {
          const input = await getApplicantAttritionInput(app, job);
          if (!active) return;
          const result = await getAttritionAssessment(input.candidate, defaultSimulation, input.context);
          if (active) {
            setAttritionResults((prev) => ({
              ...prev,
              [app.id]: { result, loading: false },
            }));
          }
        } catch {
          if (active) {
            setAttritionResults((prev) => ({
              ...prev,
              [app.id]: { result: null, loading: false },
            }));
          }
        } finally {
          if (active) {
            setAnalyzingCount((prev) => Math.max(0, prev - 1));
          }
        }
      }
    }

    Promise.all(Array.from({ length: Math.min(3, toAssess.length) }, worker));
    return () => { active = false; };
  }, [scopedApplications, jobMap]);

  // Compute enriched candidate metrics
  const processedCandidates = useMemo(() => {
    return scopedApplications.map((app) => {
      const assessment = attritionResults[app.id]?.result;
      const model = assessment?.models?.attrition || (assessment?.target === "EarlyAttrition" ? null : assessment);
      const score = scoreFor(model);
      const match = descriptionScore(app) * 100;
      const skills = skillScore(app, jobMap[app.jobId] || app.job);
      const drivers = model?.topRiskDrivers || model?.top_risk_drivers || assessment?.topRiskDrivers || assessment?.top_risk_drivers || assessment?.explainability?.models?.[0]?.drivers || [];
      const riskLevel = score === null ? "unknown" : score < 35 ? "low" : score < 65 ? "medium" : "high";
      const job = jobMap[app.jobId || app.job?.id] || app.job || {};

      return {
        ...app,
        assessment,
        job,
        attritionScore: score,
        riskLevel,
        matchScorePercent: match >= 0 ? match : null,
        skillScorePercent: skills,
        drivers,
        isCalculating: !attritionResults[app.id],
      };
    });
  }, [scopedApplications, attritionResults, jobMap]);

  // Executive KPI summary calculations
  const summaryStats = useMemo(() => {
    const assessed = processedCandidates.filter((c) => c.attritionScore !== null);
    const avgRisk = assessed.length ? assessed.reduce((sum, c) => sum + c.attritionScore, 0) / assessed.length : null;
    const lowCount = assessed.filter((c) => c.riskLevel === "low").length;
    const medCount = assessed.filter((c) => c.riskLevel === "medium").length;
    const highCount = assessed.filter((c) => c.riskLevel === "high").length;
    const safeRate = assessed.length ? Math.round((lowCount / assessed.length) * 100) : 0;

    return {
      total: processedCandidates.length,
      assessedCount: assessed.length,
      avgRisk,
      lowCount,
      medCount,
      highCount,
      safeRate,
    };
  }, [processedCandidates]);

  // Apply Search, Filters, and Sorting
  const filteredCandidates = useMemo(() => {
    let result = [...processedCandidates];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((c) => {
        const name = (c.applicant?.displayName || c.candidate?.name || "").toLowerCase();
        const email = (c.applicant?.email || "").toLowerCase();
        const role = (c.candidate?.candidateRole || c.job?.title || "").toLowerCase();
        return name.includes(q) || email.includes(q) || role.includes(q);
      });
    }

    // Risk tier filter
    if (riskFilter !== "all") {
      result = result.filter((c) => c.riskLevel === riskFilter);
    }

    // Stage filter
    if (stageFilter !== "all") {
      result = result.filter((c) => (c.status || "new").toLowerCase() === stageFilter.toLowerCase());
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "low-risk") {
        // Lowest Attrition Risk First (default / user requested)
        if (a.attritionScore === null && b.attritionScore === null) return 0;
        if (a.attritionScore === null) return 1;
        if (b.attritionScore === null) return -1;
        return a.attritionScore - b.attritionScore;
      }
      if (sortBy === "high-risk") {
        if (a.attritionScore === null && b.attritionScore === null) return 0;
        if (a.attritionScore === null) return 1;
        if (b.attritionScore === null) return -1;
        return b.attritionScore - a.attritionScore;
      }
      if (sortBy === "match-desc") {
        const matchA = a.matchScorePercent ?? -1;
        const matchB = b.matchScorePercent ?? -1;
        return matchB - matchA;
      }
      if (sortBy === "name-asc") {
        const nameA = (a.applicant?.displayName || a.candidate?.name || "").toLowerCase();
        const nameB = (b.applicant?.displayName || b.candidate?.name || "").toLowerCase();
        return nameA.localeCompare(nameB);
      }
      if (sortBy === "newest") {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      return 0;
    });

    return result;
  }, [processedCandidates, searchQuery, riskFilter, stageFilter, sortBy]);

  // Strategic 4-Quadrant Talent Matrix (Match Potential vs Retention Risk)
  const matrixQuadrants = useMemo(() => {
    const q1 = []; // Star Retainees: High Match (>=70%) & Safe Risk (<35%)
    const q2 = []; // High-Impact Flight Risk: High Match (>=70%) & Elevated Risk (>=35%)
    const q3 = []; // Steady Specialists: Moderate Match (<70%) & Safe Risk (<35%)
    const q4 = []; // Cautionary Profiles: Moderate Match (<70%) & Elevated Risk (>=35%)

    for (const c of filteredCandidates) {
      const match = c.matchScorePercent ?? 0;
      const risk = c.attritionScore ?? 50;
      if (match >= 70 && risk < 35) q1.push(c);
      else if (match >= 70 && risk >= 35) q2.push(c);
      else if (match < 70 && risk < 35) q3.push(c);
      else q4.push(c);
    }

    return { q1, q2, q3, q4 };
  }, [filteredCandidates]);

  const navigateFromSidebar = (view) => {
    const destinations = {
      admin: "/admin",
      "admin-jobs": "/admin/jobs",
      "admin-applications": "/admin/applications",
      "admin-attrition": "/admin/attrition",
      "admin-interviews": "/admin/interviews",
      "admin-interview-results": "/admin/interview-results",
    };
    navigate(destinations[view] || "/admin");
  };

  if (user?.role !== "admin") return <Navigate to="/matching" replace />;

  return (
    <div className="cv-app-shell admin-app-shell attrition-dashboard-shell">
      <CvNavigation isOpen={navigationOpen} activeView="admin-attrition" onNavigate={navigateFromSidebar} onClose={() => setNavigationOpen(false)} />
      <div className="cv-app-shell__main admin-app-shell__main">
        <CvTopbar activeView="admin-attrition" onMenuToggle={() => setNavigationOpen(true)} />
        <main className="admin-page admin-attrition-page">
          <div className="admin-page__container">

            {/* Hero Header */}
            <header className="attrition-hero">
              <div className="attrition-hero__copy">
                <span className="attrition-eyebrow"><Icon name="shield" size={14} /> AI Retention Intelligence</span>
                <h1>Attrition Risk & Retention Analytics</h1>
                <p>Monitor workforce retention flight risks, assess job-specific stability, and simulate compensation interventions powered by the CatBoost hiring model.</p>
                <div className="attrition-hero__actions">
                  <button type="button" className="attrition-btn attrition-btn--primary" onClick={() => setIsReportOpen(true)}>
                    <Icon name="download" size={16} /> Generate Retention Report
                  </button>
                  <button type="button" className="attrition-btn attrition-btn--ghost" onClick={() => navigate("/admin/jobs")}>
                    <Icon name="briefcase" size={16} /> Manage Job Posts
                  </button>
                  {analyzingCount > 0 && (
                    <span className="attrition-calculating-pill">
                      <Icon name="refresh" size={13} className="spin" /> Evaluating {analyzingCount} candidate{analyzingCount > 1 ? "s" : ""}...
                    </span>
                  )}
                </div>
              </div>
              <div
                className="attrition-hero__xai-badge"
                onClick={() => { setXaiCandidateId(filteredCandidates[0]?.id || null); setIsXaiOpen(true); }}
                role="button"
                tabIndex={0}
                title="Open Explainable AI (XAI) Model Attribution & Drivers Inspector"
              >
                <div className="attrition-xai-avatar"><Icon name="spark" size={24} /></div>
                <span>Explainable AI (XAI)</span>
                <strong>TreeSHAP Attribution</strong>
                <small>Local & Global Feature Drivers</small>
                <button type="button" className="attrition-xai-trigger-btn">
                  <Icon name="tune" size={13} />
                  <span>Inspect XAI Drivers</span>
                </button>
              </div>
            </header>

            {/* Error banner */}
            {error && <p className="attrition-error-banner" role="alert"><Icon name="alert" size={16} /> {error}</p>}

            {/* Executive Dashboard Cards */}
            <section className="attrition-metrics-grid" aria-label="Workforce Retention KPI Summary">
              {/* Card 1: Mean Retention Risk */}
              <article className="attrition-card attrition-card--mean">
                <div className="attrition-card__header">
                  <span className="attrition-card__icon attrition-card__icon--blue"><Icon name="shield" size={18} /></span>
                  <span className={`attrition-status-chip attrition-status-chip--${summaryStats.avgRisk !== null && summaryStats.avgRisk < 35 ? "low" : summaryStats.avgRisk < 65 ? "medium" : "high"}`}>
                    {summaryStats.avgRisk !== null && summaryStats.avgRisk < 35 ? "Safe Outlook" : summaryStats.avgRisk < 65 ? "Moderate Watchlist" : "Elevated Risk"}
                  </span>
                </div>
                <div className="attrition-card__body">
                  <small>Mean Attrition Risk</small>
                  <strong>{percentage(summaryStats.avgRisk)}</strong>
                  <p>Average departure probability across {summaryStats.assessedCount} assessed candidate{summaryStats.assessedCount === 1 ? "" : "s"}.</p>
                </div>
                <div className="attrition-card__bar">
                  <div className="attrition-card__bar-fill" style={{ width: `${Math.min(100, summaryStats.avgRisk || 0)}%`, background: summaryStats.avgRisk < 35 ? "#10b981" : summaryStats.avgRisk < 65 ? "#f59e0b" : "#ef4444" }} />
                </div>
              </article>

              {/* Card 2: Low Risk Talent (Safe to Hire) */}
              <article className="attrition-card attrition-card--safe">
                <div className="attrition-card__header">
                  <span className="attrition-card__icon attrition-card__icon--green"><Icon name="check" size={18} /></span>
                  <span className="attrition-status-chip attrition-status-chip--low">{summaryStats.safeRate}% of pool</span>
                </div>
                <div className="attrition-card__body">
                  <small>Safe to Retain (&lt; 35%)</small>
                  <strong className="text-emerald">{summaryStats.lowCount}</strong>
                  <p>High retention stability. Top priority candidates for job offers.</p>
                </div>
                <div className="attrition-card__pill-footer">
                  <span className="text-emerald"><Icon name="spark" size={12} /> Low flight risk</span>
                </div>
              </article>

              {/* Card 3: Moderate Risk Watchlist */}
              <article className="attrition-card attrition-card--moderate">
                <div className="attrition-card__header">
                  <span className="attrition-card__icon attrition-card__icon--amber"><Icon name="tune" size={18} /></span>
                  <span className="attrition-status-chip attrition-status-chip--medium">Watchlist</span>
                </div>
                <div className="attrition-card__body">
                  <small>Moderate Risk (35% – 65%)</small>
                  <strong className="text-amber">{summaryStats.medCount}</strong>
                  <p>Manageable flight risk. Sensitive to salary offers and remote flexibility.</p>
                </div>
                <div className="attrition-card__pill-footer">
                  <span className="text-amber"><Icon name="info" size={12} /> Monitor compensation</span>
                </div>
              </article>

              {/* Card 4: High Flight Risk Alerts */}
              <article className="attrition-card attrition-card--flight">
                <div className="attrition-card__header">
                  <span className="attrition-card__icon attrition-card__icon--red"><Icon name="alert" size={18} /></span>
                  <span className="attrition-status-chip attrition-status-chip--high">Flight Risk</span>
                </div>
                <div className="attrition-card__body">
                  <small>High Risk (&gt; 65%)</small>
                  <strong className="text-red">{summaryStats.highCount}</strong>
                  <p>Early exit alert. Retention intervention required prior to onboarding.</p>
                </div>
                <div className="attrition-card__pill-footer">
                  <span className="text-red"><Icon name="clock" size={12} /> Intervention needed</span>
                </div>
              </article>
            </section>

            {/* Interactive Job Selector Tabs */}
            <section className="attrition-job-selector" aria-label="Select Job Requisition">
              <div className="attrition-job-selector__header">
                <div className="attrition-job-selector__title">
                  <Icon name="briefcase" size={17} />
                  <h3>Filter by Job Requisition</h3>
                </div>
                <span className="attrition-job-count">{jobs.length} Active Role{jobs.length === 1 ? "" : "s"}</span>
              </div>
              <div className="attrition-job-chips" role="tablist">
                <button
                  type="button"
                  className={`attrition-job-chip ${selectedJobId === "all" ? "attrition-job-chip--active" : ""}`}
                  onClick={() => setSelectedJobId("all")}
                >
                  <strong>All Jobs Requisitions</strong>
                  <span>{applications.length} candidates</span>
                </button>
                {jobs.map((job) => {
                  const jobAppsCount = applications.filter((a) => (a.jobId || a.job?.id) === job.id).length;
                  const isActive = selectedJobId === job.id;
                  return (
                    <button
                      type="button"
                      key={job.id}
                      className={`attrition-job-chip ${isActive ? "attrition-job-chip--active" : ""}`}
                      onClick={() => setSelectedJobId(job.id)}
                    >
                      <strong>{job.title}</strong>
                      <span>{jobAppsCount} candidate{jobAppsCount === 1 ? "" : "s"} · {[job.location, job.employmentType].filter(Boolean).join(" · ")}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Controls Bar: Search, Filters, Sorting */}
            <div className="attrition-controls">
              <div className="attrition-controls__search">
                <Icon name="search" size={16} />
                <input
                  type="text"
                  placeholder="Search candidate by name, job role, or skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search candidates"
                />
                {searchQuery && (
                  <button type="button" className="attrition-search-clear" onClick={() => setSearchQuery("")} aria-label="Clear search">
                    <Icon name="close" size={14} />
                  </button>
                )}
              </div>

              <div className="attrition-controls__filters">
                {/* Risk Filter */}
                <div className="attrition-select-wrap">
                  <label htmlFor="risk-filter-select">Risk Level:</label>
                  <select
                    id="risk-filter-select"
                    value={riskFilter}
                    onChange={(e) => setRiskFilter(e.target.value)}
                  >
                    <option value="all">All Risk Levels</option>
                    <option value="low">Low Risk (&lt; 35%)</option>
                    <option value="medium">Moderate Risk (35%–65%)</option>
                    <option value="high">High Flight Risk (&gt; 65%)</option>
                  </select>
                </div>

                {/* Stage Filter */}
                <div className="attrition-select-wrap">
                  <label htmlFor="stage-filter-select">Hiring Stage:</label>
                  <select
                    id="stage-filter-select"
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value)}
                  >
                    <option value="all">All Stages</option>
                    <option value="new">New</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="hired">Hired</option>
                  </select>
                </div>

                {/* Sorting — Low risk first by default */}
                <div className="attrition-select-wrap attrition-select-wrap--highlight">
                  <label htmlFor="sort-by-select"><Icon name="tune" size={13} /> Sort By:</label>
                  <select
                    id="sort-by-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="low-risk">Lowest Attrition Risk (Safe First)</option>
                    <option value="high-risk">Highest Attrition Risk (Flight Risks)</option>
                    <option value="match-desc">Highest CV Match Score</option>
                    <option value="name-asc">Candidate Name (A–Z)</option>
                    <option value="newest">Most Recent Application</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Candidate Roster with Attrition Meters */}
            <section className="attrition-roster" aria-label="Candidate Attrition Analysis Roster">
              <div className="attrition-roster__heading">
                <div>
                  <h2>Candidate Attrition Evaluations</h2>
                  <p>Showing {filteredCandidates.length} candidate{filteredCandidates.length === 1 ? "" : "s"} sorted by {sortBy === "low-risk" ? "Lowest Attrition Risk (Safe First)" : sortBy === "high-risk" ? "Highest Attrition Risk" : sortBy === "match-desc" ? "CV Match" : "selected criteria"}.</p>
                </div>
                <div className="attrition-roster__controls-right">
                  <div className="attrition-view-toggle">
                    <button
                      type="button"
                      className={`attrition-view-toggle-btn ${viewMode === "roster" ? "active" : ""}`}
                      onClick={() => setViewMode("roster")}
                      title="View individual candidate cards"
                    >
                      <Icon name="layers" size={13} />
                      <span>Roster Cards</span>
                    </button>
                    <button
                      type="button"
                      className={`attrition-view-toggle-btn ${viewMode === "matrix" ? "active" : ""}`}
                      onClick={() => setViewMode("matrix")}
                      title="View strategic 4-quadrant talent matrix"
                    >
                      <Icon name="spark" size={13} />
                      <span>Strategic 4-Quadrant Matrix</span>
                    </button>
                  </div>
                  <div className="attrition-roster__legend">
                    <span><i className="is-safe" /> &lt;35% Safe</span>
                    <span><i className="is-moderate" /> 35-65% Moderate</span>
                    <span><i className="is-high" /> &gt;65% Flight Risk</span>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="attrition-loading-state">
                  <div className="attrition-spinner"><Icon name="refresh" size={24} className="spin" /></div>
                  <p>Loading candidate pool and preparing CatBoost attrition assessments...</p>
                </div>
              ) : filteredCandidates.length === 0 ? (
                <div className="attrition-empty-state">
                  <div className="attrition-empty-icon"><Icon name="people" size={32} /></div>
                  <h3>No candidates matched your filter</h3>
                  <p>Try clearing search filters or selecting another job requisition.</p>
                  <button type="button" className="attrition-btn attrition-btn--ghost" onClick={() => { setSearchQuery(""); setRiskFilter("all"); setStageFilter("all"); setSelectedJobId("all"); }}>
                    Reset Filters
                  </button>
                </div>
              ) : viewMode === "matrix" ? (
                <div className="attrition-talent-matrix-wrap">
                  <div className="attrition-matrix-intro">
                    <div className="attrition-matrix-intro-text">
                      <span className="attrition-matrix-badge"><Icon name="spark" size={13} /> Research Selection Matrix</span>
                      <h3>Performance Potential vs Retention Stability (4-Quadrant Grid)</h3>
                      <p>Holistic decision framework balancing candidate CV match probability against ML-predicted turnover risk.</p>
                    </div>
                    <div className="attrition-matrix-axes-indicator">
                      <span><strong>Y-Axis:</strong> CV Match Score</span>
                      <span><strong>X-Axis:</strong> Attrition Risk</span>
                    </div>
                  </div>

                  <div className="attrition-talent-matrix">
                    {/* Quadrant 1: Star Retainees */}
                    <div className="attrition-matrix-quadrant attrition-matrix-quadrant--star">
                      <div className="attrition-quadrant-header">
                        <div className="attrition-quadrant-title">
                          <span className="attrition-quadrant-icon"><Icon name="check" size={16} /></span>
                          <div>
                            <h4>🌟 Star Retainees</h4>
                            <small>High Match (≥70%) · Safe Risk (&lt;35%)</small>
                          </div>
                        </div>
                        <span className="attrition-quadrant-count">{matrixQuadrants.q1.length} Hires</span>
                      </div>
                      <p className="attrition-quadrant-strategy"><strong>Action Strategy:</strong> Immediate offer priority. High competency with low flight probability.</p>
                      <div className="attrition-quadrant-candidates">
                        {matrixQuadrants.q1.map((c) => (
                          <div className="attrition-matrix-chip" key={c.id}>
                            <div className="attrition-matrix-chip-info">
                              <strong>{c.applicant?.displayName || c.candidate?.name || "Candidate"}</strong>
                              <span>Match: {percentage(c.matchScorePercent)} · Risk: <b className="text-emerald">{percentage(c.attritionScore)}</b></span>
                            </div>
                            <Link
                              className="attrition-matrix-chip-sim"
                              to={`/admin/jobs/${encodeURIComponent(c.jobId || c.job?.id || "job")}/applicants/${encodeURIComponent(c.id)}?tab=attrition`}
                              state={{ tab: "attrition" }}
                              title="Open What-If Simulator"
                            >
                              <Icon name="tune" size={13} />
                              <span>Simulate</span>
                            </Link>
                          </div>
                        ))}
                        {matrixQuadrants.q1.length === 0 && <span className="attrition-quadrant-empty">No candidates currently in this quadrant</span>}
                      </div>
                    </div>

                    {/* Quadrant 2: High-Impact Flight Risks */}
                    <div className="attrition-matrix-quadrant attrition-matrix-quadrant--flight">
                      <div className="attrition-quadrant-header">
                        <div className="attrition-quadrant-title">
                          <span className="attrition-quadrant-icon"><Icon name="alert" size={16} /></span>
                          <div>
                            <h4>⚠️ High-Impact Flight Risks</h4>
                            <small>High Match (≥70%) · Elevated Risk (≥35%)</small>
                          </div>
                        </div>
                        <span className="attrition-quadrant-count">{matrixQuadrants.q2.length} Candidates</span>
                      </div>
                      <p className="attrition-quadrant-strategy"><strong>Action Strategy:</strong> Retention package needed. Strong skill profile with vulnerability to early departure.</p>
                      <div className="attrition-quadrant-candidates">
                        {matrixQuadrants.q2.map((c) => (
                          <div className="attrition-matrix-chip attrition-matrix-chip--alert" key={c.id}>
                            <div className="attrition-matrix-chip-info">
                              <strong>{c.applicant?.displayName || c.candidate?.name || "Candidate"}</strong>
                              <span>Match: {percentage(c.matchScorePercent)} · Risk: <b className="text-red">{percentage(c.attritionScore)}</b></span>
                            </div>
                            <Link
                              className="attrition-matrix-chip-sim"
                              to={`/admin/jobs/${encodeURIComponent(c.jobId || c.job?.id || "job")}/applicants/${encodeURIComponent(c.id)}?tab=attrition`}
                              state={{ tab: "attrition" }}
                              title="Open What-If Simulator"
                            >
                              <Icon name="tune" size={13} />
                              <span>Simulate</span>
                            </Link>
                          </div>
                        ))}
                        {matrixQuadrants.q2.length === 0 && <span className="attrition-quadrant-empty">No candidates currently in this quadrant</span>}
                      </div>
                    </div>

                    {/* Quadrant 3: Steady Support Retainees */}
                    <div className="attrition-matrix-quadrant attrition-matrix-quadrant--steady">
                      <div className="attrition-quadrant-header">
                        <div className="attrition-quadrant-title">
                          <span className="attrition-quadrant-icon"><Icon name="shield" size={16} /></span>
                          <div>
                            <h4>🛡️ Steady Specialists</h4>
                            <small>Moderate Match (&lt;70%) · Safe Risk (&lt;35%)</small>
                          </div>
                        </div>
                        <span className="attrition-quadrant-count">{matrixQuadrants.q3.length} Candidates</span>
                      </div>
                      <p className="attrition-quadrant-strategy"><strong>Action Strategy:</strong> Long-term dependable talent. High loyalty and low turnover; ideal for training.</p>
                      <div className="attrition-quadrant-candidates">
                        {matrixQuadrants.q3.map((c) => (
                          <div className="attrition-matrix-chip" key={c.id}>
                            <div className="attrition-matrix-chip-info">
                              <strong>{c.applicant?.displayName || c.candidate?.name || "Candidate"}</strong>
                              <span>Match: {percentage(c.matchScorePercent)} · Risk: <b className="text-emerald">{percentage(c.attritionScore)}</b></span>
                            </div>
                            <Link
                              className="attrition-matrix-chip-sim"
                              to={`/admin/jobs/${encodeURIComponent(c.jobId || c.job?.id || "job")}/applicants/${encodeURIComponent(c.id)}?tab=attrition`}
                              state={{ tab: "attrition" }}
                              title="Open What-If Simulator"
                            >
                              <Icon name="tune" size={13} />
                              <span>Simulate</span>
                            </Link>
                          </div>
                        ))}
                        {matrixQuadrants.q3.length === 0 && <span className="attrition-quadrant-empty">No candidates currently in this quadrant</span>}
                      </div>
                    </div>

                    {/* Quadrant 4: Cautionary Profile */}
                    <div className="attrition-matrix-quadrant attrition-matrix-quadrant--caution">
                      <div className="attrition-quadrant-header">
                        <div className="attrition-quadrant-title">
                          <span className="attrition-quadrant-icon"><Icon name="close" size={16} /></span>
                          <div>
                            <h4>🛑 Cautionary Profiles</h4>
                            <small>Moderate Match (&lt;70%) · Elevated Risk (≥35%)</small>
                          </div>
                        </div>
                        <span className="attrition-quadrant-count">{matrixQuadrants.q4.length} Candidates</span>
                      </div>
                      <p className="attrition-quadrant-strategy"><strong>Action Strategy:</strong> Re-evaluate alignment. Elevated flight probability coupled with lower role fit.</p>
                      <div className="attrition-quadrant-candidates">
                        {matrixQuadrants.q4.map((c) => (
                          <div className="attrition-matrix-chip attrition-matrix-chip--warning" key={c.id}>
                            <div className="attrition-matrix-chip-info">
                              <strong>{c.applicant?.displayName || c.candidate?.name || "Candidate"}</strong>
                              <span>Match: {percentage(c.matchScorePercent)} · Risk: <b className="text-amber">{percentage(c.attritionScore)}</b></span>
                            </div>
                            <Link
                              className="attrition-matrix-chip-sim"
                              to={`/admin/jobs/${encodeURIComponent(c.jobId || c.job?.id || "job")}/applicants/${encodeURIComponent(c.id)}?tab=attrition`}
                              state={{ tab: "attrition" }}
                              title="Open What-If Simulator"
                            >
                              <Icon name="tune" size={13} />
                              <span>Simulate</span>
                            </Link>
                          </div>
                        ))}
                        {matrixQuadrants.q4.length === 0 && <span className="attrition-quadrant-empty">No candidates currently in this quadrant</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="attrition-candidate-grid">
                  {filteredCandidates.map((candidate) => {
                    const name = candidate.applicant?.displayName || candidate.candidate?.name || "Candidate";
                    const photo = candidate.applicant?.profilePhoto;
                    const role = candidate.candidate?.candidateRole || candidate.job?.title || "Candidate";
                    const score = candidate.attritionScore;
                    const riskBand = candidate.riskLevel;
                    const status = candidate.status || "new";

                    return (
                      <article className={`attrition-candidate-card attrition-candidate-card--${riskBand}`} key={candidate.id}>
                        {/* Top candidate badge */}
                        <div className="attrition-candidate-card__header">
                          <div className={`attrition-candidate-avatar attrition-candidate-avatar--${riskBand}`}>
                            {photo ? <img src={photo} alt="" /> : initials(name)}
                          </div>
                          <div className="attrition-candidate-info">
                            <h4>{name}</h4>
                            <p>{candidate.applicant?.email || role}</p>
                            <span className="attrition-job-pill">{candidate.job?.title || "General Role"}</span>
                          </div>
                          <span className={`attrition-stage-badge attrition-stage-badge--${status}`}>{status}</span>
                        </div>

                        {/* Prominent Risk Meter Body */}
                        <div className="attrition-candidate-card__meter-wrap">
                          <div className="attrition-candidate-gauge">
                            <RiskMeter value={score} riskLevel={riskBand} label={candidate.isCalculating ? "Calculating" : score === null ? "Unavailable" : "Attrition Risk"} />
                          </div>
                          <div className="attrition-candidate-verdict">
                            <span className={`attrition-verdict-pill attrition-verdict-pill--${riskBand}`}>
                              <i />
                              {candidate.isCalculating ? "Evaluating model..." : score === null ? "Assessment Pending" : riskBand === "low" ? "Low Risk · Stable" : riskBand === "medium" ? "Moderate Risk" : "High Flight Risk"}
                            </span>
                            <div className="attrition-candidate-scores">
                              <div>
                                <small>CV Match</small>
                                <strong>{percentage(candidate.matchScorePercent)}</strong>
                              </div>
                              {candidate.candidate?.yearsExperience ? (
                                <div>
                                  <small>Experience</small>
                                  <strong>{candidate.candidate.yearsExperience} yrs</strong>
                                </div>
                              ) : candidate.candidate?.candidateSeniority ? (
                                <div>
                                  <small>Seniority</small>
                                  <strong>{candidate.candidate.candidateSeniority}</strong>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        {/* Top Risk Driver */}
                        <div className="attrition-candidate-card__driver">
                          <span className="attrition-driver-title"><Icon name="spark" size={13} /> Primary Model Driver:</span>
                          <p>{candidate.drivers?.length > 0 ? (candidate.drivers[0].explanation || candidate.drivers[0].feature) : "Balanced tenure & compensation parity"}</p>
                        </div>

                        {/* Actions */}
                        <footer className="attrition-candidate-card__footer">
                          <Link
                            className="attrition-card-action attrition-card-action--primary"
                            to={`/admin/jobs/${encodeURIComponent(candidate.jobId || candidate.job?.id || "job")}/applicants/${encodeURIComponent(candidate.id)}`}
                          >
                            <span>View Dossier</span>
                            <Icon name="chevronRight" size={15} />
                          </Link>
                          <button
                            type="button"
                            className="attrition-card-action attrition-card-action--xai"
                            onClick={() => { setXaiCandidateId(candidate.id); setIsXaiOpen(true); }}
                            title={`Inspect Explainable AI attribution drivers for ${name}`}
                          >
                            <Icon name="spark" size={13} />
                            <span>Explain AI</span>
                          </button>
                          <Link
                            className="attrition-card-action attrition-card-action--secondary"
                            to={
                              candidate.jobId || candidate.job?.id
                                ? `/admin/jobs/${encodeURIComponent(candidate.jobId || candidate.job?.id)}/applicants/${encodeURIComponent(candidate.id)}?tab=attrition`
                                : `/admin/applications/${encodeURIComponent(candidate.id)}`
                            }
                            state={{ tab: "attrition" }}
                            title="Open What-If Scenario Simulator"
                            aria-label={`Open What-If Scenario Simulator for ${name}`}
                          >
                            <Icon name="tune" size={14} />
                            <span>Simulator</span>
                          </Link>
                        </footer>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

          </div>
        </main>
      </div>

      {/* Executive Report Modal */}
      <AttritionReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        job={currentJob}
        applications={filteredCandidates}
        attritionResults={attritionResults}
        companyName={user?.companyName || "Lanka Talent Insights"}
      />

      {/* Explainable AI (XAI) Inspector Modal */}
      <ExplainableAiModal
        isOpen={isXaiOpen}
        onClose={() => setIsXaiOpen(false)}
        candidates={filteredCandidates}
        initialCandidateId={xaiCandidateId}
      />
    </div>
  );
}

export default AdminAttritionPage;
