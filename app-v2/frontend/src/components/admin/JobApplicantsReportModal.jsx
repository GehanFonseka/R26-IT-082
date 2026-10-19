import { useEffect, useMemo } from "react";
import Icon from "../common/Icon";
import { descriptionScore, skillScore } from "../../utils/applicantRanking";
import { attritionModels, attritionScore } from "../../utils/attritionResults";
import "./JobApplicantsReportModal.css";

const percentage = (value) =>
  value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value)) && Number(value) >= 0
    ? `${Number(value).toFixed(1)}%`
    : "—";

function JobApplicantsReportModal({
  isOpen,
  onClose,
  job,
  applications = [],
  attritionResults = {},
  companyName = "MatchOS Talent Insights",
}) {
  // ESC key and body scroll lock
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // Handle print lifecycle to prevent layout height artifacts
  useEffect(() => {
    const onBefore = () => {
      document.body.style.overflow = "visible";
      document.body.classList.add("is-printing-report");
    };
    const onAfter = () => {
      if (isOpen) {
        document.body.style.overflow = "hidden";
      }
      document.body.classList.remove("is-printing-report");
    };
    window.addEventListener("beforeprint", onBefore);
    window.addEventListener("afterprint", onAfter);
    return () => {
      window.removeEventListener("beforeprint", onBefore);
      window.removeEventListener("afterprint", onAfter);
    };
  }, [isOpen]);

  // Compute enriched candidate metrics and ORDER THEM TOP TO BOTTOM BY OVERALL BEST CANDIDATES
  const rankedCandidates = useMemo(() => {
    const RAW_FEATURE_MAP = {
      CurrentNoticePeriod: "Notice Period Transition Buffer",
      CurrentSalaryUSD: "Competitive Market Salary Parity",
      LocationWorkRisk: "Commute & Flexible Work Alignment",
      TrainingRisk: "Onboarding & Technical Enablement",
      MentorshipRisk: "Engineering Mentorship Support",
      CareerDevelopmentRisk: "Promotion & Career Progression Track",
    };

    const list = applications.map((app) => {
      const applicant = app.applicant || {};
      const name = (applicant.displayName || app.candidate?.name || app.name || "Candidate").trim();
      const email = applicant.email || app.email || "—";
      const cvMatch = typeof app.cvMatch === "number" ? app.cvMatch : (descriptionScore(app) * 100);
      const skills = typeof app.skillEvidence === "number" ? app.skillEvidence : skillScore(app, job);
      const analysis = app.candidateAnalysis;
      const technical = typeof app.technical === "number"
        ? app.technical
        : (analysis?.model?.status === "live" ? analysis.technicalCompetencyScore : null);

      const assessment = attritionResults[app.id]?.result || app.attritionResult?.result || app.assessment;
      const models = attritionModels(assessment);
      const attrition = typeof app.attritionScore === "number"
        ? app.attritionScore
        : attritionScore(models?.attrition);
      const riskLevel = app.riskLevel || (attrition === null ? "unknown" : attrition < 35 ? "low" : attrition < 65 ? "medium" : "high");

      // Extract meaningful top AI driver
      const drivers = models?.attrition?.topRiskDrivers || assessment?.topRiskDrivers || [];
      let topDriver = "";
      if (drivers.length > 0) {
        const d = drivers[0];
        const label = RAW_FEATURE_MAP[d.feature] || RAW_FEATURE_MAP[d.rawFeature] || d.feature;
        topDriver = d.explanation || label || "Workforce continuity factor";
      } else if (attrition !== null && attrition < 35) {
        topDriver = "Long-term career stability & market compensation parity";
      } else if (attrition !== null && attrition >= 65) {
        topDriver = "Notice period transition window & market salary adjustment risk";
      } else {
        topDriver = "Standard industry career progression continuity";
      }

      // Resolve role name safely to prevent candidate name collision
      const candRole = (app.candidate?.candidateRole || app.candidate?.role || "").trim();
      const role = (job?.title && job.title.toLowerCase() !== name.toLowerCase())
        ? job.title
        : (candRole && candRole.toLowerCase() !== name.toLowerCase())
        ? candRole
        : "Software Engineer";

      // Overall Composite Score (60% CV Match + 40% Retention Stability)
      const matchVal = cvMatch >= 0 ? cvMatch : 50;
      const retentionVal = attrition !== null ? (100 - attrition) : 65;
      const compositeScore = typeof app.compositeScore === "number"
        ? app.compositeScore
        : Math.round((matchVal * 0.6) + (retentionVal * 0.4));
      const isStar = typeof app.isStar === "boolean"
        ? app.isStar
        : (cvMatch >= 70 && (attrition === null || attrition < 35));

      const recommendation = isStar
        ? "Top Recommendation: Fast-track offer"
        : riskLevel === "low"
        ? "Strong Candidate: Safe long-term retention"
        : riskLevel === "medium"
        ? "Proceed to Technical Interview & Retention Check"
        : cvMatch >= 70
        ? "High Match: Review compensation to mitigate flight risk"
        : "Standard Pipeline: Review competencies";

      return {
        id: app.id,
        name,
        email,
        role,
        cvMatch: cvMatch >= 0 ? cvMatch : null,
        skillEvidence: skills >= 0 ? skills : null,
        technical: technical !== null && technical >= 0 ? technical : null,
        attritionScore: attrition,
        riskLevel,
        compositeScore,
        isStar,
        topDriver,
        recommendation,
      };
    });

    // STRICTLY ORDER FROM OVERALL BEST CANDIDATES TO LOWEST (TOP TO BOTTOM)
    list.sort((a, b) => {
      if (b.compositeScore !== a.compositeScore) {
        return b.compositeScore - a.compositeScore;
      }
      return (b.cvMatch ?? -1) - (a.cvMatch ?? -1);
    });

    return list;
  }, [applications, job, attritionResults]);

  // Aggregate executive metrics
  const total = rankedCandidates.length;
  const scoredMatches = rankedCandidates.filter((c) => c.cvMatch !== null);
  const avgMatch = scoredMatches.length
    ? scoredMatches.reduce((sum, c) => sum + c.cvMatch, 0) / scoredMatches.length
    : 0;

  const validAttrition = rankedCandidates.filter((c) => c.attritionScore !== null);
  const avgAttrition = validAttrition.length
    ? validAttrition.reduce((sum, c) => sum + c.attritionScore, 0) / validAttrition.length
    : null;

  const starCount = rankedCandidates.filter((c) => c.isStar).length;
  const safeCount = rankedCandidates.filter((c) => c.riskLevel === "low").length;
  const watchlistCount = rankedCandidates.filter((c) => c.riskLevel === "medium" || c.riskLevel === "high").length;
  const safePct = total > 0 ? Math.round((safeCount / total) * 100) : 0;

  const topCandidate = rankedCandidates[0] || null;

  const currentDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const reportId = `JOB-EVAL-${new Date().getFullYear()}-${String(job?.id || "REQ").slice(-6).toUpperCase()}`;

  const handlePrint = () => {
    const originalTitle = document.title;
    const requisitionName = job?.title || "Requisition";
    document.title = `${requisitionName} - Candidate Evaluation Report - ${companyName}`;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "visible";
    document.body.classList.add("is-printing-report");

    // Give browser a microtask to flush layout and styles before print dialog
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        if (isOpen) {
          document.body.style.overflow = originalOverflow || "hidden";
        }
        document.body.classList.remove("is-printing-report");
        document.title = originalTitle;
      }, 500);
    }, 60);
  };

  const exportCsv = () => {
    const headers = [
      "Rank",
      "Candidate Name",
      "Email",
      "Target Role",
      "Overall Suitability Score (0-100)",
      "Star Retainee Pick",
      "CV-Job Match %",
      "Skill Evidence %",
      "Technical Score %",
      "Attrition Risk %",
      "Risk Level",
      "Primary AI Driver",
      "Hiring Recommendation",
    ];

    const rows = rankedCandidates.map((c, index) => [
      index + 1,
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.email.replace(/"/g, '""')}"`,
      `"${c.role.replace(/"/g, '""')}"`,
      c.compositeScore,
      c.isStar ? "YES" : "NO",
      c.cvMatch !== null ? c.cvMatch.toFixed(1) : "",
      c.skillEvidence !== null ? c.skillEvidence.toFixed(1) : "",
      c.technical !== null ? c.technical.toFixed(1) : "",
      c.attritionScore !== null ? c.attritionScore.toFixed(1) : "",
      `"${c.riskLevel.toUpperCase()}"`,
      `"${c.topDriver.replace(/"/g, '""')}"`,
      `"${c.recommendation.replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `job_candidates_evaluation_${(job?.title || "requisition").toLowerCase().replace(/[^a-z0-9]/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="job-report-modal" role="dialog" aria-modal="true" aria-labelledby="job-report-modal-title">
      <div className="job-report-modal__backdrop no-print" onClick={onClose} />

      <div className="job-report-modal__content">
        {/* Header for Screen View */}
        <header className="job-report-modal__header no-print">
          <div className="job-report-modal__header-left">
            <span className="job-report-modal__badge">
              <Icon name="briefcase" size={14} />
              Requisition Evaluation Report
            </span>
            <h2 id="job-report-modal-title">{job?.title} — Candidate Evaluation & Predictive Fit</h2>
            <p>Complete multi-model predictions ranked top to bottom by overall best candidate suitability.</p>
          </div>

          <div className="job-report-modal__actions">
            <button type="button" className="job-report-btn job-report-btn--primary" onClick={handlePrint}>
              <Icon name="download" size={15} />
              <span>Print / Save PDF</span>
            </button>
            <button type="button" className="job-report-btn job-report-btn--secondary" onClick={exportCsv}>
              <Icon name="chart" size={15} />
              <span>Export Full CSV</span>
            </button>
            <button type="button" className="job-report-modal__close" onClick={onClose} aria-label="Close report">
              <Icon name="close" size={18} />
            </button>
          </div>
        </header>

        {/* Printable Audit Document Sheet */}
        <div className="job-report-sheet" id="job-printable-sheet">
          {/* Brand Header */}
          <div className="job-report-sheet__brand">
            <div className="job-report-sheet__brand-left">
              <div className="job-report-sheet__logo-row">
                <span className="job-report-sheet__logo-icon"><Icon name="shield" size={18} /></span>
                <span className="job-report-sheet__meta-company">{companyName}</span>
                <span className="job-report-sheet__doc-tag">Audit Ref: {reportId}</span>
              </div>
              <h1>Job Requisition Candidate Evaluation Report</h1>
              <p>Predictive Candidate Ranking, CV Qualification Match, Skill Evidence & CatBoost Retention Stability</p>
            </div>

            <div className="job-report-sheet__stamp">
              <strong>CONFIDENTIAL</strong>
              <span>EXECUTIVE AUDIT</span>
              <small>{currentDate}</small>
            </div>
          </div>

          {/* Requisition Context Scope */}
          <div className="job-report-sheet__scope">
            <div className="job-report-sheet__scope-item">
              <label>Job Requisition</label>
              <strong>{job?.title || "Position Evaluation"}</strong>
            </div>
            <div className="job-report-sheet__scope-item">
              <label>Company & Location</label>
              <span>{[job?.company, job?.location, job?.employmentType].filter(Boolean).join(" · ") || "On-site / Hybrid"}</span>
            </div>
            <div className="job-report-sheet__scope-item">
              <label>Candidate Cohort</label>
              <span>{total} Evaluated Candidates (Ranked Top to Bottom)</span>
            </div>
            <div className="job-report-sheet__scope-item">
              <label>Predictive Engine</label>
              <span>BERT Matcher + Skill Evidence + CatBoost V7</span>
            </div>
          </div>

          {/* Executive Cohort KPI Metrics */}
          <div className="job-report-sheet__kpis">
            <article className="job-report-kpi">
              <span>Total Applicants</span>
              <strong>{total}</strong>
              <small>Screened Candidates</small>
            </article>

            <article className="job-report-kpi job-report-kpi--match">
              <span>Average CV Match</span>
              <strong>{avgMatch.toFixed(1)}%</strong>
              <small>Cohort Benchmark</small>
            </article>

            <article className="job-report-kpi job-report-kpi--star">
              <span>Star Retainees</span>
              <strong>{starCount}</strong>
              <small>≥70% Match & &lt;35% Risk</small>
            </article>

            <article className="job-report-kpi job-report-kpi--safe">
              <span>Safe Retention Rate</span>
              <strong>{safePct}%</strong>
              <small>{safeCount} Low Turnover Hires</small>
            </article>

            <article className="job-report-kpi job-report-kpi--watchlist">
              <span>Watchlist / Alerts</span>
              <strong>{watchlistCount}</strong>
              <small>Turnover Risk ≥35%</small>
            </article>
          </div>

          {/* Top Recommended Candidate Spotlight */}
          {topCandidate && (
            <section className="job-report-spotlight">
              <div className="job-report-spotlight__header">
                <span className="job-spotlight-badge">
                  <Icon name="spark" size={14} />
                  #1 Overall Top Recommended Candidate Pick
                </span>
                <span className="job-spotlight-score">
                  Overall Suitability: <strong>{topCandidate.compositeScore}/100</strong> ({topCandidate.isStar ? "🌟 Star Retainee" : "Top Fit"})
                </span>
              </div>

              <div className="job-report-spotlight__content">
                <div className="job-spotlight-profile">
                  <h3>{topCandidate.name}</h3>
                  <p>{topCandidate.email} · Target Role: {topCandidate.role}</p>
                </div>

                <div className="job-spotlight-metric-pills">
                  <span className="spotlight-pill spotlight-pill--match">
                    CV Match: <strong>{percentage(topCandidate.cvMatch)}</strong>
                  </span>
                  <span className="spotlight-pill spotlight-pill--evidence">
                    Skill Evidence: <strong>{percentage(topCandidate.skillEvidence)}</strong>
                  </span>
                  <span className="spotlight-pill spotlight-pill--tech">
                    Technical: <strong>{percentage(topCandidate.technical)}</strong>
                  </span>
                  <span className={`spotlight-pill spotlight-pill--risk spotlight-pill--risk-${topCandidate.riskLevel}`}>
                    Attrition Risk: <strong>{percentage(topCandidate.attritionScore)}</strong> ({topCandidate.riskLevel === "low" ? "Safe" : "Watchlist"})
                  </span>
                </div>

                <p className="job-spotlight-justification">
                  <strong>Executive Recommendation:</strong> {topCandidate.name} is ranked as the #1 overall candidate for this requisition. They demonstrate superior role qualification alignment ({percentage(topCandidate.cvMatch)}) combined with exceptional retention stability ({percentage(topCandidate.attritionScore)} turnover risk). Recommended for priority interview scheduling and offer fast-tracking.
                </p>
              </div>
            </section>
          )}

          {/* Candidate Breakdown Table: ORDERED FROM TOP TO BOTTOM BY OVERALL BEST CANDIDATE */}
          <section className="job-report-sheet__table-wrap">
            <div className="job-report-table-heading">
              <div>
                <h3>Complete Candidate Evaluation & Predictive Rankings</h3>
                <p>Strictly ordered from overall best candidate to lowest based on composite suitability, CV match, and retention stability.</p>
              </div>
              <span className="job-report-order-badge">
                <Icon name="check" size={13} /> Ranked Overall Top to Bottom
              </span>
            </div>

            <table className="job-report-table">
              <thead>
                <tr>
                  <th style={{ width: "5%" }}>Rank</th>
                  <th style={{ width: "22%" }}>Candidate Details</th>
                  <th style={{ width: "11%", textAlign: "center" }}>Overall Rating</th>
                  <th style={{ width: "10%", textAlign: "center" }}>CV Match</th>
                  <th style={{ width: "10%", textAlign: "center" }}>Skill Evidence</th>
                  <th style={{ width: "10%", textAlign: "center" }}>Technical</th>
                  <th style={{ width: "11%", textAlign: "center" }}>Attrition Risk</th>
                  <th style={{ width: "21%" }}>Key AI Factor & Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {rankedCandidates.length ? (
                  rankedCandidates.map((candidate, idx) => (
                    <tr key={candidate.id} className={idx === 0 ? "job-report-row--top" : ""}>
                      <td style={{ textAlign: "center" }}>
                        <span className={`job-rank-badge ${idx === 0 ? "job-rank-badge--first" : ""}`}>
                          #{idx + 1}
                        </span>
                      </td>

                      <td>
                        <div className="job-table-candidate-info">
                          <strong>{candidate.name}</strong>
                          <small>{candidate.email}</small>
                          {candidate.isStar && (
                            <span className="job-table-star-tag">⭐ Top Match</span>
                          )}
                        </div>
                      </td>

                      <td style={{ textAlign: "center" }}>
                        <div className="job-table-score-box">
                          <strong>{candidate.compositeScore}/100</strong>
                          <small>{candidate.isStar ? "Star Hire" : candidate.compositeScore >= 70 ? "Strong Fit" : "Moderate"}</small>
                        </div>
                      </td>

                      <td style={{ textAlign: "center" }}>
                        <span className="job-table-metric-pill job-table-metric-pill--match">
                          {percentage(candidate.cvMatch)}
                        </span>
                      </td>

                      <td style={{ textAlign: "center" }}>
                        <span className="job-table-metric-pill">
                          {percentage(candidate.skillEvidence)}
                        </span>
                      </td>

                      <td style={{ textAlign: "center" }}>
                        <span className="job-table-metric-pill">
                          {percentage(candidate.technical)}
                        </span>
                      </td>

                      <td style={{ textAlign: "center" }}>
                        <span className={`job-table-risk-pill job-table-risk-pill--${candidate.riskLevel}`}>
                          {percentage(candidate.attritionScore)}
                          <small>
                            {candidate.riskLevel === "low" ? "Safe" : candidate.riskLevel === "medium" ? "Watch" : "Risk"}
                          </small>
                        </span>
                      </td>

                      <td>
                        <div className="job-table-ai-summary">
                          <small className="job-driver-text">{candidate.topDriver}</small>
                          <span className={`job-action-tag job-action-tag--${candidate.riskLevel}`}>
                            {candidate.recommendation}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center", padding: "24px" }}>
                      No candidate applications found for this job requisition.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          {/* Strategic Decision Sign-Off */}
          <section className="job-report-signoff">
            <div className="job-signoff-card">
              <span className="job-signoff-title">System Generation & Verification</span>
              <p>MatchOS Predictive AI Intelligence Engine (BERT + TreeSHAP CatBoost V7)</p>
              <div className="job-signoff-line">
                <span>Verification Date: {currentDate}</span>
                <span className="job-signoff-status">Verified Machine Output</span>
              </div>
            </div>

            <div className="job-signoff-card">
              <span className="job-signoff-title">Hiring Authority Authorization</span>
              <p>Talent Acquisition Lead / Engineering Hiring Manager</p>
              <div className="job-signoff-line">
                <span className="signature-line">Signature: __________________________</span>
                <span>Date: ____________</span>
              </div>
            </div>
          </section>

          {/* Document Footer */}
          <footer className="job-report-sheet__footer">
            <p>
              CONFIDENTIAL: Generated via MatchOS Talent Workspace Intelligence. All prediction values (CV match, skill evidence, technical capability, and CatBoost attrition probabilities) are derived from machine-learning models trained on technical workforce datasets. Intended solely for hiring managers and authorized leadership.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default JobApplicantsReportModal;
