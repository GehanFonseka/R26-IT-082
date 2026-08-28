import { useEffect, useRef, useState } from "react";
import { Track } from "livekit-client";
import Icon from "../common/Icon";
import { appendInterviewTranscript, deleteInterviewTranscript, transcribeInterviewAudio, updateInterviewTranscript } from "../../services/apiClient";
import "./LiveKitTranscriptPanel.css";

const TRANSCRIPTION_SEGMENT_MS = 7000;

function LiveKitTranscriptPanel({ interviewId, room, isAdmin, transcript, setTranscript, onRecordingChange }) {
  const [active, setActive] = useState(false);
  const [liveText, setLiveText] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState("");
  const [draftText, setDraftText] = useState("");
  const [savingId, setSavingId] = useState("");
  const recorderRef = useRef(null);
  const timerRef = useRef(null);
  const activeRef = useRef(false);
  const queueRef = useRef(Promise.resolve());

  const submit = (blob) => {
    queueRef.current = queueRef.current.catch(() => {}).then(async () => {
      const response = await transcribeInterviewAudio(interviewId, blob);
      const text = String(response.data?.text || "").trim();
      if (!text) return;
      const saved = await appendInterviewTranscript(interviewId, text);
      setTranscript((current) => [...current, saved.data]);
    }).catch((requestError) => setError(requestError.message || "Could not transcribe this segment."));
    return queueRef.current;
  };

  const recordSegment = () => {
    if (!activeRef.current || !room) return;
    const publication = room.localParticipant.getTrackPublication(Track.Source.Microphone);
    const mediaTrack = publication?.track?.mediaStreamTrack;
    if (!mediaTrack) { setError("Enable your microphone before starting transcription."); setActive(false); activeRef.current = false; return; }
    try {
      const stream = new MediaStream([mediaTrack]);
      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((type) => MediaRecorder.isTypeSupported?.(type)) || "";
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = (event) => { if (event.data?.size) chunks.push(event.data); };
      recorder.onerror = () => setError("Local audio recording failed while the room was connected.");
      recorder.onstop = () => { void submit(new Blob(chunks, { type: recorder.mimeType || "audio/webm" })); if (activeRef.current) window.setTimeout(recordSegment, 50); };
      recorderRef.current = recorder; recorder.start(); timerRef.current = window.setTimeout(() => recorder.state === "recording" && recorder.stop(), TRANSCRIPTION_SEGMENT_MS);
    } catch (requestError) { setError(requestError.message || "This browser cannot record microphone audio."); activeRef.current = false; setActive(false); }
  };

  const start = async () => {
    if (!room || activeRef.current) return;
    setError(""); await room.localParticipant.setMicrophoneEnabled(true); activeRef.current = true; setActive(true); onRecordingChange?.(true); setLiveText("Listening to your microphone locally..."); recordSegment();
  };

  const stop = () => {
    activeRef.current = false; setActive(false); onRecordingChange?.(false); setLiveText(""); if (timerRef.current) window.clearTimeout(timerRef.current); timerRef.current = null; if (recorderRef.current?.state === "recording") recorderRef.current.stop(); recorderRef.current = null;
  };

  const beginEdit = (entry) => {
    setError("");
    setEditingId(entry.id);
    setDraftText(entry.text || "");
  };

  const cancelEdit = () => {
    setEditingId("");
    setDraftText("");
  };

  const saveEdit = async (entryId) => {
    const text = draftText.trim();
    if (!text) return setError("Question text is required.");
    setSavingId(entryId);
    setError("");
    try {
      const response = await updateInterviewTranscript(interviewId, entryId, text);
      setTranscript((current) => current.map((entry) => entry.id === entryId ? response.data : entry));
      cancelEdit();
    } catch (requestError) {
      setError(requestError.message || "Could not update this question.");
    } finally {
      setSavingId("");
    }
  };

  const removeEntry = async (entryId) => {
    if (!window.confirm("Delete this interviewer question from the transcript?")) return;
    setSavingId(entryId);
    setError("");
    try {
      await deleteInterviewTranscript(interviewId, entryId);
      setTranscript((current) => current.filter((entry) => entry.id !== entryId));
      if (editingId === entryId) cancelEdit();
    } catch (requestError) {
      setError(requestError.message || "Could not delete this question.");
    } finally {
      setSavingId("");
    }
  };

  useEffect(() => () => stop(), []);

  return <aside className="livekit-transcript" aria-labelledby="livekit-transcript-title">
    <div className="livekit-transcript__heading"><div><span className="livekit-overline">Local English speech-to-text</span><h2 id="livekit-transcript-title">Interview transcript</h2></div><span className={`livekit-transcript__status ${active ? "livekit-transcript__status--live" : ""}`}><i />{active ? "Listening locally" : "Ready"}</span></div>
    <p className="livekit-transcript__intro">Each participant can transcribe their own English microphone audio locally with Whisper. The saved speaker role is used by the interview analyzer.</p>
    <div className="livekit-transcript__actions">{active ? <button type="button" onClick={stop}>Stop transcription</button> : <button type="button" onClick={start} disabled={!room}>{isAdmin ? "Start interviewer transcription" : "Start candidate transcription"}</button>}</div>
    {error && <p className="livekit-transcript__error" role="alert"><Icon name="alert" size={14} />{error}</p>}
    <div className="livekit-transcript__list">
      {!transcript.length && !liveText && <div className="livekit-transcript__empty"><Icon name="message" size={24} /><strong>No transcript yet</strong><span>Join the room and start local transcription.</span></div>}
      {transcript.map((entry) => {
        const canManage = entry.role === "admin";
        const isEditing = editingId === entry.id;
        const isSaving = savingId === entry.id;
        return <article key={entry.id} className="livekit-transcript__line">
          <div className="livekit-transcript__line-header"><span>{entry.speakerName || "Participant"}</span>{canManage && !isEditing && <div className="livekit-transcript__controls"><button type="button" title="Edit question" onClick={() => beginEdit(entry)} disabled={Boolean(savingId)}>Edit</button><button type="button" title="Delete question" onClick={() => removeEntry(entry.id)} disabled={isSaving}>Delete</button></div>}</div>
          {isEditing ? <div className="livekit-transcript__edit"><textarea value={draftText} maxLength={4000} onChange={(event) => setDraftText(event.target.value)} aria-label="Edit interviewer question" autoFocus /><div className="livekit-transcript__edit-actions"><button type="button" onClick={() => saveEdit(entry.id)} disabled={isSaving}>{isSaving ? "Saving..." : "Save"}</button><button type="button" onClick={cancelEdit} disabled={isSaving}>Cancel</button></div></div> : <p>{entry.text}</p>}
        </article>;
      })}
      {liveText && <article className="livekit-transcript__line livekit-transcript__line--live"><span>Listening now</span><p>{liveText}</p></article>}
    </div>
  </aside>;
}

export default LiveKitTranscriptPanel;
