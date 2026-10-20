import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminInterviews } from "../../services/apiClient";
import "./ApplicantInterviewStatus.css";

export default function ApplicantInterviewStatus({ application, job }) {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getAdminInterviews().then((response) => {
      if (active) setInterviews((response.data || []).filter((item) =>
        String(item.applicationId || item.application?.id) === String(application.id)
        && String(item.jobId || item.job?.id) === String(job.id)
        && item.status === "scheduled").sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt)));
    }).catch(() => { if (active) setError("Could not check interview schedules. Please try again."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [application.id, job.id, attempt]);
  const scheduleUrl = `/admin/interviews?${new URLSearchParams({ jobId: job.id, applicationId: application.id })}`;
  return <section className="applicant-interview-status" aria-labelledby="applicant-interview-title">
    <div><h2 id="applicant-interview-title">Interview schedule</h2>
      {loading ? <p role="status">Checking interview schedules...</p> : error ? <p role="alert">{error}</p> : interviews.length ? <>
        <p className="applicant-interview-status__scheduled">Interview scheduled for this candidate and job</p>
        <ul>{interviews.map((interview) => <li key={interview.id}>
          <span>{new Date(interview.scheduledAt).toLocaleString()} · {interview.durationMinutes} minutes</span>
          <Link to={`/interviews/${encodeURIComponent(interview.id)}`}>Open interview room</Link>
        </li>)}</ul>
      </> : <p>No interview scheduled for this candidate and job.</p>}
    </div>
    {!loading && (error ? <button type="button" onClick={() => setAttempt((value) => value + 1)}>Try again</button>
      : <Link className="applicant-interview-status__action" to={scheduleUrl}>{interviews.length ? "View schedules" : "Schedule interview"}</Link>)}
  </section>;
}
