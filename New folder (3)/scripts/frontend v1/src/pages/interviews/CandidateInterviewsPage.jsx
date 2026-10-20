import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CvNavigation from "../../components/layout/CvNavigation";
import CvTopbar from "../../components/layout/CvTopbar";
import Icon from "../../components/common/Icon";
import InterviewLinkButton from "../../components/interview/InterviewLinkButton";
import { getMyInterviews, getMyProfile } from "../../services/apiClient";
import { useAuth } from "../../context/AuthContext";
import "./CandidateInterviewsPage.css";

const filters = [
  { id: "upcoming", label: "Upcoming" },
  { id: "all", label: "All interviews" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

const dateTimeLabel = (value) => value
  ? new Date(value).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
  : "Time unavailable";

const dateParts = (value) => {
  const date = new Date(value);
  return {
    day: Number.isNaN(date.getTime()) ? "--" : date.toLocaleDateString(undefined, { day: "2-digit" }),
    month: Number.isNaN(date.getTime()) ? "---" : date.toLocaleDateString(undefined, { month: "short" }).toUpperCase(),
  };
};

const isUpcoming = (interview) => interview.status === "scheduled" && new Date(interview.scheduledAt).getTime() >= Date.now();

const statusLabel = (interview) => {
  if (interview.status === "cancelled") return "Cancelled";
  if (interview.status === "completed") return "Completed";
  return isUpcoming(interview) ? "Scheduled" : "Past scheduled time";
};

const statusClass = (interview) => {
  if (interview.status === "cancelled") return "candidate-interview-status--cancelled";
  if (interview.status === "completed") return "candidate-interview-status--completed";
  return isUpcoming(interview) ? "candidate-interview-status--scheduled" : "candidate-interview-status--past";
};

const escapeIcs = (value) => String(value || "").replace(/[\\;,\n]/g, (character) => ({ "\\": "\\\\", ";": "\\;", ",": "\\,", "\n": "\\n" }[character]));

const icsDate = (value) => new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

const downloadCalendarEvent = (interview) => {
  const start = new Date(interview.scheduledAt);
  const end = new Date(start.getTime() + Number(interview.durationMinutes || 45) * 60 * 1000);
  const title = `${interview.job?.title || "Interview"} · ${interview.job?.company || "Hiring team"}`;
  const description = [
    "Private MatchOS interview room.",
    interview.notes ? `Notes: ${interview.notes}` : "",
    "Open the MatchOS candidate workspace to join.",
  ].filter(Boolean).join("\\n");
  const calendar = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MatchOS//Interview//EN",
    "BEGIN:VEVENT",
    `UID:${escapeIcs(interview.id)}@matchos.local`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${escapeIcs(title)}`,
    `DESCRIPTION:${escapeIcs(description)}`,
    `LOCATION:${escapeIcs("MatchOS private interview room")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([calendar], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `matchos-interview-${interview.id}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

function CandidateInterviewsPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [interviews, setInterviews] = useState([]);
  const [filter, setFilter] = useState("upcoming");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || "");

  useEffect(() => {
    let mounted = true;
    getMyProfile().then((response) => {
      if (!mounted) return;
      const savedPhoto = response.data?.profilePhoto || "";
      setProfilePhoto(savedPhoto);
      updateUser({ profilePhoto: savedPhoto });
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const loadInterviews = useCallback(async (isRefresh = false) => {
    setError("");
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const response = await getMyInterviews();
      setInterviews(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      setError(requestError.message || "Could not load your interview schedule.");
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInterviews();
  }, [loadInterviews]);

  const sortedInterviews = useMemo(() => [...interviews].sort((first, second) => new Date(first.scheduledAt) - new Date(second.scheduledAt)), [interviews]);
  const upcoming = useMemo(() => sortedInterviews.filter(isUpcoming), [sortedInterviews]);
  const visibleInterviews = useMemo(() => {
    if (filter === "upcoming") return upcoming;
    if (filter === "all") return sortedInterviews;
    return sortedInterviews.filter((interview) => interview.status === filter);
  }, [filter, sortedInterviews, upcoming]);

  const navigateFromSidebar = (view) => navigate(view === "jobs" ? "/jobs" : view === "interviews" ? "/interviews" : view === "skill-analysis" ? "/skill-analysis" : "/matching");

  return (
    <div className="cv-app-shell candidate-interviews-shell">
      <CvNavigation isOpen={navigationOpen} activeView="interviews" onNavigate={navigateFromSidebar} onClose={() => setNavigationOpen(false)} />
      <div className="cv-app-shell__main candidate-interviews-shell__main">
        <CvTopbar activeView="interviews" profilePhoto={profilePhoto} monochrome onMenuToggle={() => setNavigationOpen(true)} />
        <main className="candidate-interviews-page">
          <div className="candidate-interviews-page__container">
            <header className="candidate-interviews-hero">
              <div>
                <span className="candidate-interviews-eyebrow"><i /><Icon name="calendar" size={13} /> Candidate workspace</span>
                <h1>Your interview schedule.</h1>
                <p>Everything the hiring team schedules for you lives here. Open the private room when it is time to meet, with your camera, microphone, and shared transcript in one place.</p>
              </div>
              <div className="candidate-interviews-hero__summary">
                <strong>{upcoming.length}</strong>
                <span>upcoming interview{upcoming.length === 1 ? "" : "s"}</span>
              </div>
            </header>

            <section className="candidate-interviews-toolbar" aria-label="Interview schedule controls">
              <div className="candidate-interviews-tabs" role="tablist" aria-label="Interview filters">
                {filters.map((item) => <button key={item.id} className={filter === item.id ? "candidate-interviews-tab candidate-interviews-tab--active" : "candidate-interviews-tab"} type="button" role="tab" aria-selected={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}<span>{item.id === "upcoming" ? upcoming.length : item.id === "all" ? sortedInterviews.length : sortedInterviews.filter((interview) => interview.status === item.id).length}</span></button>)}
              </div>
              <button className="candidate-interviews-refresh" type="button" onClick={() => loadInterviews(true)} disabled={refreshing}><Icon name="refresh" size={15} />{refreshing ? "Refreshing..." : "Refresh schedule"}</button>
            </section>

            {error && <p className="candidate-interviews-message candidate-interviews-message--error" role="alert"><Icon name="alert" size={15} />{error}</p>}
            {loading ? <div className="candidate-interviews-empty"><span className="candidate-interviews-loader" /><strong>Loading your interview plan...</strong><span>Checking the latest schedule from the hiring workspace.</span></div> : visibleInterviews.length === 0 ? <div className="candidate-interviews-empty"><Icon name="calendar" size={29} /><strong>{filter === "upcoming" ? "No interview scheduled yet" : `No ${filter === "all" ? "interviews" : `${filter} interviews`} to show`}</strong><span>{filter === "upcoming" ? "The hiring team will publish a room here after scheduling your interview." : "Try another filter or browse open opportunities."}</span><button type="button" onClick={() => navigate("/jobs")}>Browse open jobs<Icon name="arrowRight" size={14} /></button></div> : <section className="candidate-interviews-list" aria-label="Your interviews">{visibleInterviews.map((interview) => { const parts = dateParts(interview.scheduledAt); const active = isUpcoming(interview); return <article className={`candidate-interview-card ${active ? "candidate-interview-card--upcoming" : ""}`} key={interview.id}>
              <div className="candidate-interview-card__date"><strong>{parts.day}</strong><span>{parts.month}</span></div>
              <div className="candidate-interview-card__body"><div className="candidate-interview-card__heading"><div><span className={`candidate-interview-status ${statusClass(interview)}`}><i />{statusLabel(interview)}</span><h2>{interview.job?.title || "Interview"}</h2><p>{interview.job?.company || "Hiring team"}{interview.job?.location ? ` · ${interview.job.location}` : ""}</p></div><span className="candidate-interview-card__duration"><Icon name="clock" size={13} />{interview.durationMinutes || 45} min</span></div>
                <div className="candidate-interview-card__details"><div><small>Date and time</small><strong>{dateTimeLabel(interview.scheduledAt)}</strong></div><div><small>Application</small><strong>{interview.application?.jobTitle || interview.job?.title || "Your application"}</strong></div><div><small>Room</small><strong>Private MatchOS room</strong></div></div>
                {interview.notes && <div className="candidate-interview-card__notes"><Icon name="info" size={14} /><span>{interview.notes}</span></div>}
                <div className="candidate-interview-card__footer">{active ? <span><Icon name="shield" size={14} />Join from a quiet place. Camera and microphone permissions are requested only when you enter.</span> : <span>This interview is no longer open for joining.</span>}<div className="candidate-interview-card__actions">{active && <button className="candidate-interview-card__calendar" type="button" onClick={() => downloadCalendarEvent(interview)}><Icon name="calendar" size={14} />Add to calendar</button>}{active && <InterviewLinkButton interviewId={interview.id} compact />}{active && <button className="candidate-interview-card__join" type="button" onClick={() => navigate(`/interviews/${interview.id}`)}><Icon name="arrowRight" size={15} />Open interview room</button>}</div></div>
              </div>
            </article>; })}</section>}
            <p className="candidate-interviews-footnote"><Icon name="info" size={14} />The hiring team controls the schedule. If you need a different time, contact the company through the details in your application.</p>
          </div>
        </main>
      </div>
    </div>
  );
}

export default CandidateInterviewsPage;
