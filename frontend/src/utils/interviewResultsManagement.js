export function resultScore(row) {
  const value = row.analysis?.summary?.overallScore;
  return value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value)) ? Number(value) : null;
}

export function exportInterviewResults(rows) {
  const cell = (value) => {
    const text = String(value ?? "");
    const safe = /^[\s]*[=+@-]/.test(text) ? `'${text}` : text;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  const records = rows.map((row) => [row.application?.applicant?.displayName,
    row.application?.applicant?.email, row.job?.title, row.job?.company,
    row.scheduledAt, row.analysis ? "Analyzed" : "Pending", resultScore(row),
    row.analysis?.summary?.needsReview ?? ""]);
  const csv = [["Candidate", "Email", "Job", "Company", "Interview date", "Status", "Score (%)", "Answers needing review"], ...records]
    .map((record) => record.map(cell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "interview-results.csv";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
