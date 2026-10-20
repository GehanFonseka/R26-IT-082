import "./InterviewResultsManagement.css";

export default function InterviewResultsManagement({ rows, visibleCount, jobFilter, setJobFilter, sort, setSort, disabled, onExport }) {
  const jobs = new Map(rows.map((row) => [String(row.job?.id || row.jobId || row.job?.title || "unknown-job"), row.job?.title || "Unassigned job vacancy"]));
  return <div className="results-management">
    <label>Job vacancy<select value={jobFilter} onChange={(event) => setJobFilter(event.target.value)}>
      <option value="all">All job vacancies</option>
      {[...jobs].map(([id, title]) => <option key={id} value={id}>{title}</option>)}
    </select></label>
    <label>Sort results<select value={sort} onChange={(event) => setSort(event.target.value)}>
      <option value="score">Highest score first</option><option value="lowest">Lowest score first</option>
      <option value="newest">Latest interview first</option><option value="name">Candidate name</option>
    </select></label>
    <span aria-live="polite">{disabled ? "Loading results…" : `${visibleCount} of ${rows.length} interviews`}</span>
    <button type="button" disabled={disabled || !visibleCount} onClick={onExport}>Export CSV</button>
  </div>;
}
