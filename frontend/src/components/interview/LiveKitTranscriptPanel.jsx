import { useEffect, useRef, useState } from "react";
import { Track } from "livekit-client";
import Icon from "../common/Icon";
import useBatchSpeechFallback from "../../hooks/useBatchSpeechFallback";
import useLiveSpeechRecognition, { supportsLiveSpeechRecognition } from "../../hooks/useLiveSpeechRecognition";
import useLiveTranscriptSync from "../../hooks/useLiveTranscriptSync";
import useTranscriptEntryActions from "../../hooks/useTranscriptEntryActions";
import { appendInterviewTranscript } from "../../services/apiClient";
import "./LiveKitTranscriptPanel.css";

function LiveKitTranscriptPanel({ interviewId, room, isAdmin, currentUserId, currentUserName, transcript, setTranscript, onRecordingChange }) {
  const [active, setActive] = useState(false);
  const [mode, setMode] = useState("");
  const [liveText, setLiveText] = useState("");
  const [error, setError] = useState("");
  const activeRef = useRef(false);
  const queueRef = useRef(Promise.resolve());
  const speechSupported = supportsLiveSpeechRecognition();
  const addRemoteEntry = (entry) => setTranscript((current) => current.some((item) => item.id === entry.id) ? current : [...current, entry]);
  const { remoteLiveEntries, remoteSpeakingRef, publishInterim, publishFinal } = useLiveTranscriptSync({ room, currentUserId, currentUserName, onRemoteEntry: addRemoteEntry });
  const { editingId, draftText, savingId, beginEdit, cancelEdit, saveEdit, removeEntry, setDraftText } = useTranscriptEntryActions({ interviewId, setTranscript, setError });

  const saveFinalText = (value) => {
    if (remoteSpeakingRef.current) {
      setLiveText("");
      publishInterim("");
      return;
    }
    const text = String(value || "").trim();
    if (!text) return;
    queueRef.current = queueRef.current.catch(() => {}).then(async () => {
      const saved = await appendInterviewTranscript(interviewId, text);
      if (saved.data) {
        setTranscript((current) => [...current, saved.data]);
        publishFinal(saved.data);
      }
    }).catch((requestError) => setError(requestError.message || "Could not transcribe this segment."));
  };

  const handleInterimText = (value) => {
    if (remoteSpeakingRef.current) {
      setLiveText("");
      publishInterim("");
      return;
    }
    setLiveText(value);
    publishInterim(value);
  };

  useLiveSpeechRecognition({
    active: active && mode === "live",
    language: "en-US",
    onFinalText: saveFinalText,
    onInterimText: handleInterimText,
    onError: setError,
    onUnavailable: () => {
      setError("");
      setMode("fallback");
      setLiveText("Browser live service unavailable. Whisper fallback is listening...");
    },
  });

  useBatchSpeechFallback({
    active: active && mode === "fallback",
    interviewId,
    room,
    onText: saveFinalText,
    onError: setError,
  });

  const start = async () => {
    if (!room || activeRef.current) return;
    try {
      setError("");
      await room.localParticipant.setMicrophoneEnabled(true);
      const publication = room.localParticipant.getTrackPublication(Track.Source.Microphone);
      if (!publication?.track?.mediaStreamTrack) return setError("Enable your microphone before starting transcription.");
      const nextMode = speechSupported ? "live" : "fallback";
      activeRef.current = true;
      setMode(nextMode);
      setActive(true);
      setLiveText(nextMode === "fallback" ? "Browser live recognition unavailable. Whisper fallback is listening..." : "");
      onRecordingChange?.(true);
    } catch (requestError) {
      setError(requestError.message || "Could not access the interview microphone.");
    }
  };

  const stop = () => {
    activeRef.current = false;
    setActive(false);
    setMode("");
    onRecordingChange?.(false);
    setLiveText("");
  };

  useEffect(() => () => stop(), []);
  const remoteLiveList = Object.values(remoteLiveEntries);

  return <aside className="livekit-transcript" aria-labelledby="livekit-transcript-title">
    <div className="livekit-transcript__heading"><div><span className="livekit-overline">Live English speech-to-text</span><h2 id="livekit-transcript-title">Interview transcript</h2></div><span className={`livekit-transcript__status ${active ? "livekit-transcript__status--live" : ""}`}><i />{active ? (mode === "fallback" ? "Whisper fallback" : "Listening live") : "Ready"}</span></div>
    <p className="livekit-transcript__intro">Words appear live from your English microphone. Final phrases are saved through the interview gateway for analysis.</p>
    <div className="livekit-transcript__actions">{active ? <button type="button" onClick={stop}>Stop transcription</button> : <button type="button" onClick={start} disabled={!room}>{isAdmin ? "Start interviewer transcription" : "Start candidate transcription"}</button>}</div>
    {error && <p className="livekit-transcript__error" role="alert"><Icon name="alert" size={14} />{error}</p>}
    <div className="livekit-transcript__list">
      {!transcript.length && !liveText && !remoteLiveList.length && <div className="livekit-transcript__empty"><Icon name="message" size={24} /><strong>No transcript yet</strong><span>Join the room and start transcription.</span></div>}
      {transcript.map((entry) => {
        const canManage = entry.role === "admin"
          ? isAdmin
          : String(entry.userId) === String(currentUserId);
        const isEditing = editingId === entry.id;
        const isSaving = savingId === entry.id;
        return <article key={entry.id} className="livekit-transcript__line">
          <div className="livekit-transcript__line-header"><span>{entry.speakerName || "Participant"}</span>{canManage && !isEditing && <div className="livekit-transcript__controls"><button type="button" title="Edit message" onClick={() => beginEdit(entry)} disabled={Boolean(savingId)}>Edit</button><button type="button" title="Delete message" onClick={() => removeEntry(entry.id)} disabled={isSaving}>Delete</button></div>}</div>
          {isEditing ? <div className="livekit-transcript__edit"><textarea value={draftText} maxLength={4000} onChange={(event) => setDraftText(event.target.value)} aria-label="Edit transcript message" autoFocus /><div className="livekit-transcript__edit-actions"><button type="button" onClick={() => saveEdit(entry.id)} disabled={isSaving}>{isSaving ? "Saving..." : "Save"}</button><button type="button" onClick={cancelEdit} disabled={isSaving}>Cancel</button></div></div> : <p>{entry.text}</p>}
        </article>;
      })}
      {remoteLiveList.map((entry) => <article key={`remote-${entry.id}`} className="livekit-transcript__line livekit-transcript__line--live"><span>{entry.speakerName} is speaking</span><p>{entry.text}</p></article>)}
      {liveText && <article className="livekit-transcript__line livekit-transcript__line--live"><span>Listening now</span><p>{liveText}</p></article>}
    </div>
  </aside>;
}

export default LiveKitTranscriptPanel;
