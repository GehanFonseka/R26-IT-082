import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import CvNavigation from "../../components/layout/CvNavigation";
import CvTopbar from "../../components/layout/CvTopbar";
import Icon from "../../components/common/Icon";
import { useAuth } from "../../context/AuthContext";
import { getAdminInterviews, getInterviewAnalysis } from "../../services/apiClient";
import "./InterviewResultsPage.css";

const dateLabel = (value) => value ? new Date(value).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "Date unavailable";
const initials = (value) => String(value || "Candidate").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
const scoreLabel = (value) => Number.isFinite(Number(value)) ? `${Math.round(Number(value))}%` : "Pending";

function InterviewResultRow({ row, navigate }) {
  const applicant = row.application?.applicant || {};
  const summary = row.analysis?.summary || {};
  const destination = row.analysis ? `/admin/interview-results/${row.id}` : `/interviews/${row.id}`;
  return <article className="interview-result-row">
    <div className="interview-result-row__avatar">{initials(applicant.displayName || applicant.email)}</div>
    <div className="interview-result-row__main"><div className="interview-result-row__top"><div><h3>{applicant.displayName || applicant.email || "Candidate"}</h3><p>{applicant.email || "No email provided"}</p></div><span className={`interview-result-status ${row.analysis ? "interview-result-status--complete" : "interview-result-status--pending"}`}><i />{row.analysis ? "Analyzed" : "Pending analysis"}</span></div><div className="interview-result-row__details"><span><b>Interview</b>{dateLabel(row.scheduledAt)}</span><span><b>Questions</b>{row.analysis ? `${summary.answerCount || 0}/${summary.questionCount || 0} answered` : "Not analyzed"}</span></div></div>
    <div className={`interview-result-score ${row.analysis && Number(summary.overallScore) >= 70 ? "interview-result-score--strong" : ""}`}><span>Overall score</span><strong>{scoreLabel(summary.overallScore)}</strong>{row.analysis && <small>{summary.needsReview || 0} need review</small>}</div>
    <button className="interview-result-row__action" type="button" onClick={() => navigate(destination)}>{row.analysis ? "Review result" : "Open analyzer"}<Icon name="arrowRight" size={14} /></button>
  </article>;
}

function InterviewResultGroups({ groups, navigate }) {
  return <div className="interview-results-groups">{groups.map((group, index) => <section className="interview-results-group" key={group.key} aria-labelledby={`interview-job-${index}`}><header className="interview-results-group__header"><div><span>Job vacancy</span><h3 id={`interview-job-${index}`}>{group.title}</h3><p>{group.company}{group.location ? ` · ${group.location}` : ""}</p></div><strong>{group.rows.length} applicant{group.rows.length === 1 ? "" : "s"}</strong></header><div className="interview-results-list">{group.rows.map((row) => <InterviewResultRow key={row.id} row={row} navigate={navigate} />)}</div></section>)}</div>;
}

function InterviewResultsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    const loadResults = async () => {
      setLoading(true); setError("");
      try {
        const response = await getAdminInterviews();
        const interviews = Array.isArray(response.data) ? response.data : [];
        const nextRows = []; let analysisError = "";
        for (const interview of interviews) {
          try { const analysis = await getInterviewAnalysis(interview.id); nextRows.push({ ...interview, analysis: analysis.data }); }
          catch (requestError) { nextRows.push({ ...interview, analysis: null }); if (requestError.status !== 404) analysisError ||= requestError.message; }
        }
        if (active) { setRows(nextRows); if (analysisError) setError(analysisError); }
      } catch (requestError) { if (active) setError(requestError.message || "Could not load interview results."); }
      finally { if (active) setLoading(false); }
    };
    loadResults();
    return () => { active = false; };
  }, [reloadKey]);

  const visibleRows = useMemo(() => {
    const text = query.trim().toLowerCase();
    return rows.filter((row) => {
      const applicant = row.application?.applicant || {};
      const searchable = [applicant.displayName, applicant.email, row.job?.title, row.job?.company].join(" ").toLowerCase();
      return (!text || searchable.includes(text)) && (filter === "all" || (filter === "analyzed" ? Boolean(row.analysis) : !row.analysis));
    }).sort((first, second) => Number(second.analysis?.summary?.overallScore ?? -1) - Number(first.analysis?.summary?.overallScore ?? -1) || new Date(second.scheduledAt || 0) - new Date(first.scheduledAt || 0));
  }, [filter, query, rows]);

  const groups = useMemo(() => {
    const grouped = new Map();
    visibleRows.forEach((row) => {
      const key = row.job?.id || row.jobId || row.job?.title || "unknown-job";
      const current = grouped.get(key) || { key, title: row.job?.title || "Unassigned job vacancy", company: row.job?.company || "Hiring team", location: row.job?.location || "", rows: [] };
      current.rows.push(row); grouped.set(key, current);
    });
    return [...grouped.values()];
  }, [visibleRows]);

  const analyzedCount = rows.filter((row) => row.analysis).length;
  const averageScore = analyzedCount ? rows.filter((row) => row.analysis).reduce((total, row) => total + Number(row.analysis.summary?.overallScore || 0), 0) / analyzedCount : null;
  const navigateFromSidebar = (view) => navigate({ admin: "/admin", "admin-jobs": "/admin/jobs", "admin-applications": "/admin/applications", "admin-interviews": "/admin/interviews", "admin-interview-results": "/admin/interview-results" }[view] || "/admin");

  if (user?.role !== "admin") return <Navigate to="/matching" replace />;
  return <div className="cv-app-shell admin-app-shell"><CvNavigation isOpen={navigationOpen} activeView="admin-interview-results" onNavigate={navigateFromSidebar} onClose={() => setNavigationOpen(false)} /><div className="cv-app-shell__main admin-app-shell__main"><CvTopbar activeView="admin-interview-results" onMenuToggle={() => setNavigationOpen(true)} /><main className="interview-results-page"><div className="interview-results-page__container">
    <header className="interview-results-hero"><div><span className="interview-results-eyebrow"><i /><Icon name="chart" size={13} /> Decision workspace</span><h1>Interview results</h1><p>Review saved answer analysis, grouped by the job vacancy each candidate applied for.</p></div><div className="interview-results-hero__stat"><strong>{analyzedCount}<small>/{rows.length}</small></strong><span>interviews analyzed</span></div></header>
    {error && <p className="interview-results-message interview-results-message--error" role="alert"><Icon name="alert" size={15} />{error}</p>}
    <section className="interview-results-summary"><div><span>Analyzed interviews</span><strong>{analyzedCount}</strong></div><div><span>Average answer score</span><strong>{scoreLabel(averageScore)}</strong></div><div><span>Awaiting analysis</span><strong>{rows.length - analyzedCount}</strong></div></section>
    <section className="interview-results-card" aria-labelledby="interview-results-title"><div className="interview-results-card__heading"><div><span className="interview-results-overline">Candidate review</span><h2 id="interview-results-title">Interview result list</h2><p>Each job vacancy has its own candidate result group.</p></div><button className="interview-results-refresh" type="button" onClick={() => setReloadKey((value) => value + 1)} disabled={loading}><Icon name="refresh" size={14} />{loading ? "Refreshing..." : "Refresh"}</button></div>
      <div className="interview-results-toolbar"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search candidate or job" aria-label="Search interview results" /><div className="interview-results-filters">{[["all", "All"], ["analyzed", "Analyzed"], ["pending", "Pending"]].map(([value, label]) => <button className={filter === value ? "is-active" : ""} type="button" key={value} onClick={() => setFilter(value)}>{label}</button>)}</div></div>
      {loading ? <div className="interview-results-empty"><span className="interview-results-loader" />Loading interview results...</div> : !visibleRows.length ? <div className="interview-results-empty"><Icon name="chart" size={28} /><strong>{rows.length ? "No matching results" : "No interview results yet"}</strong><span>{rows.length ? "Try another search or filter." : "Schedule an interview and run the analyzer from its interview room."}</span></div> : <InterviewResultGroups groups={groups} navigate={navigate} />}
    </section>
  </div></main></div></div>;
}

export default InterviewResultsPage;
