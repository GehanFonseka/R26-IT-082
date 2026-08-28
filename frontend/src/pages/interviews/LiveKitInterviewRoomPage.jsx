import { useCallback, useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import CvNavigation from "../../components/layout/CvNavigation";
import CvTopbar from "../../components/layout/CvTopbar";
import Icon from "../../components/common/Icon";
import InterviewAnalysisPanel from "../../components/interview/InterviewAnalysisPanel";
import InterviewLinkButton from "../../components/interview/InterviewLinkButton";
import LiveKitCall from "../../components/interview/LiveKitCall";
import LiveKitParticipants from "../../components/interview/LiveKitParticipants";
import LiveKitTranscriptPanel from "../../components/interview/LiveKitTranscriptPanel";
import RoomCollaborationPanel from "../../components/interview/RoomCollaborationPanel";
import { useAuth } from "../../context/AuthContext";
import { getAdminInterviews, getInterviewTranscript, getMyInterviews } from "../../services/apiClient";
import "./LiveKitInterviewRoomPage.css";

const dateLabel = (value) => value ? new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "Date unavailable";

function MetaCard({ icon, label, value, tone = "" }) {
  return <div className={`livekit-room-meta-card ${tone ? `livekit-room-meta-card--${tone}` : ""}`}><span className="livekit-room-meta-card__icon"><Icon name={icon} size={15} /></span><span><small>{label}</small><strong>{value}</strong></span></div>;
}

function LiveKitInterviewRoomPage() {
  const { user } = useAuth(); const { interviewId } = useParams(); const navigate = useNavigate(); const isAdmin = user?.role === "admin";
  const [navigationOpen, setNavigationOpen] = useState(false); const [interview, setInterview] = useState(null); const [transcript, setTranscript] = useState([]); const [room, setRoom] = useState(null); const [recording, setRecording] = useState(false); const [audioRequested, setAudioRequested] = useState(isAdmin); const [videoRequested, setVideoRequested] = useState(isAdmin); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const handleRoom = useCallback((value) => setRoom(value), []);

  useEffect(() => {
    let mounted = true;
    const load = async () => { setLoading(true); setError(""); try { const [interviewsResponse, transcriptResponse] = await Promise.all([isAdmin ? getAdminInterviews() : getMyInterviews(), getInterviewTranscript(interviewId)]); const selected = (interviewsResponse.data || []).find((item) => item.id === interviewId); if (!selected) throw new Error("This interview is not available for your account."); if (!mounted) return; setInterview(selected); setTranscript(Array.isArray(transcriptResponse.data) ? transcriptResponse.data : []); } catch (requestError) { if (mounted) setError(requestError.message || "Could not load this interview room."); } finally { if (mounted) setLoading(false); } };
    load(); return () => { mounted = false; };
  }, [interviewId, isAdmin]);

  const navigateFromSidebar = (view) => { if (isAdmin) return navigate(view === "admin" ? "/admin" : view === "admin-jobs" ? "/admin/jobs" : view === "admin-applications" ? "/admin/applications" : view === "admin-interview-results" ? "/admin/interview-results" : "/admin/interviews"); return navigate(view === "jobs" ? "/jobs" : view === "skill-analysis" ? "/skill-analysis" : view === "matching" ? "/matching" : "/interviews"); };
  if (!user) return <Navigate to="/auth" replace />;
  const jobTitle = interview?.job?.title || "Interview room"; const company = interview?.job?.company || "Hiring team"; const participantCount = room ? room.remoteParticipants.size + 1 : 0;
  return <div className={`cv-app-shell livekit-room-shell ${isAdmin ? "livekit-room-shell--admin" : ""}`}><CvNavigation isOpen={navigationOpen} activeView={isAdmin ? "admin-interviews" : "interviews"} onNavigate={navigateFromSidebar} onClose={() => setNavigationOpen(false)} /><div className="cv-app-shell__main livekit-room-shell__main"><CvTopbar activeView={isAdmin ? "admin-interviews" : "interviews"} onMenuToggle={() => setNavigationOpen(true)} /><main className="livekit-room-page"><div className="livekit-room-page__container"><button className="livekit-room-page__back" type="button" onClick={() => navigate(isAdmin ? "/admin/interviews" : "/interviews")}><Icon name="arrowLeft" size={15} /> Back to interview schedule</button>
    {loading && <div className="livekit-room-state"><span className="livekit-room-loader" />Loading interview room...</div>}{!loading && error && <div className="livekit-room-state livekit-room-state--error"><Icon name="alert" size={24} /><strong>Could not open this room</strong><span>{error}</span><button type="button" onClick={() => window.location.reload()}>Try again</button></div>}{!loading && !error && interview && <>
      <header className="livekit-room-titlebar"><div><span><i /> <Icon name="shield" size={13} /> Private interview room</span><h1>{jobTitle}</h1><p>{company} · {dateLabel(interview.scheduledAt)}</p></div><div className="livekit-room-titlebar__actions"><InterviewLinkButton interviewId={interview.id} compact /><b>{isAdmin ? "Interviewer" : "Candidate"}</b></div></header>
      <div className="livekit-room-meta"><MetaCard icon="shield" label="Private interview room" value="Secure & encrypted" /><MetaCard icon="people" label="Participants" value={participantCount || "Waiting"} /><MetaCard icon="clock" label="Duration" value={interview.durationMinutes ? `${interview.durationMinutes} min` : "Scheduled"} /><MetaCard icon="activity" label="Room status" value={room ? "Live" : "Ready"} tone={room ? "live" : ""} /><MetaCard icon="message" label="Transcript" value={recording ? "Recording" : transcript.length ? "Available" : "Ready"} tone={recording ? "live" : ""} /><div className="livekit-room-meta-card livekit-room-meta-card--link"><span className="livekit-room-meta-card__icon"><Icon name="link" size={15} /></span><span><small>Room link</small><strong>Share with candidate</strong></span><InterviewLinkButton interviewId={interview.id} compact /></div></div>
      <div className="livekit-room-grid"><LiveKitCall interviewId={interviewId} jobTitle={jobTitle} company={company} audioRequested={audioRequested} videoRequested={videoRequested} onAudioRequestedChange={setAudioRequested} onVideoRequestedChange={setVideoRequested} onRoom={handleRoom} /><aside className="livekit-room-sidebar"><LiveKitParticipants room={room} user={user} isAdmin={isAdmin} /><LiveKitTranscriptPanel interviewId={interviewId} room={room} isAdmin={isAdmin} transcript={transcript} setTranscript={setTranscript} onRecordingChange={setRecording} /><RoomCollaborationPanel /></aside></div><InterviewAnalysisPanel interviewId={interviewId} isAdmin={isAdmin} />
    </>}</div></main></div></div>;
}

export default LiveKitInterviewRoomPage;
