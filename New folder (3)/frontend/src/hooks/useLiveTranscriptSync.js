import { useEffect, useRef, useState } from "react";
import { RoomEvent } from "livekit-client";

const TRANSCRIPT_TOPIC = "interview-transcript";
const REMOTE_SPEAKER_GRACE_MS = 1800;
const decode = (payload) => {
  try { return JSON.parse(new TextDecoder().decode(payload)); } catch { return null; }
};

function useLiveTranscriptSync({ room, currentUserId, currentUserName, onRemoteEntry }) {
  const [remoteLiveEntries, setRemoteLiveEntries] = useState({});
  const [remoteSpeaking, setRemoteSpeaking] = useState(false);
  const contextRef = useRef({ room, currentUserId, currentUserName, onRemoteEntry });
  const remoteSpeakingRef = useRef(false);
  const pendingInterimRef = useRef("");
  const interimTimerRef = useRef(null);
  const remoteSpeakingTimerRef = useRef(null);

  useEffect(() => {
    contextRef.current = { room, currentUserId, currentUserName, onRemoteEntry };
  }, [currentUserId, currentUserName, onRemoteEntry, room]);

  useEffect(() => {
    if (!room) {
      remoteSpeakingRef.current = false;
      setRemoteSpeaking(false);
      return undefined;
    }
    const handleActiveSpeakersChanged = (speakers) => {
      const localIdentity = room.localParticipant?.identity;
      const anotherParticipantSpeaking = speakers.some((participant) => participant.identity !== localIdentity);
      if (anotherParticipantSpeaking) {
        if (remoteSpeakingTimerRef.current) window.clearTimeout(remoteSpeakingTimerRef.current);
        remoteSpeakingRef.current = true;
        setRemoteSpeaking(true);
        return;
      }
      if (remoteSpeakingTimerRef.current) window.clearTimeout(remoteSpeakingTimerRef.current);
      remoteSpeakingTimerRef.current = window.setTimeout(() => {
        remoteSpeakingRef.current = false;
        setRemoteSpeaking(false);
      }, REMOTE_SPEAKER_GRACE_MS);
    };
    const handleData = (payload, participant, _kind, topic) => {
      if (topic !== TRANSCRIPT_TOPIC || !participant) return;
      const message = decode(payload);
      if (!message || message.userId === contextRef.current.currentUserId) return;
      const participantId = participant.identity || participant.sid || "remote";
      if (message.type === "interim") {
        setRemoteLiveEntries((current) => {
          const next = { ...current };
          if (String(message.text || "").trim()) next[participantId] = { id: participantId, text: message.text, speakerName: participant.name || message.speakerName || "Participant" };
          else delete next[participantId];
          return next;
        });
      }
      if (message.type === "final") {
        setRemoteLiveEntries((current) => { const next = { ...current }; delete next[participantId]; return next; });
        if (message.entry?.id) contextRef.current.onRemoteEntry?.(message.entry);
      }
    };
    const handleParticipantDisconnected = (participant) => {
      const participantId = participant?.identity || participant?.sid;
      if (!participantId) return;
      setRemoteLiveEntries((current) => {
        if (!current[participantId]) return current;
        const next = { ...current };
        delete next[participantId];
        return next;
      });
    };
    room.on(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakersChanged);
    room.on(RoomEvent.DataReceived, handleData);
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
    return () => {
      if (remoteSpeakingTimerRef.current) window.clearTimeout(remoteSpeakingTimerRef.current);
      remoteSpeakingRef.current = false;
      room.off(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakersChanged);
      room.off(RoomEvent.DataReceived, handleData);
      room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
    };
  }, [room]);

  const publish = (message) => {
    const { room: liveRoom, currentUserId: userId, currentUserName: speakerName } = contextRef.current;
    if (!liveRoom?.localParticipant?.publishData) return;
    const payload = new TextEncoder().encode(JSON.stringify({ ...message, userId, speakerName }));
    void liveRoom.localParticipant.publishData(payload, { reliable: true, topic: TRANSCRIPT_TOPIC }).catch(() => {});
  };

  const publishInterim = (text) => {
    pendingInterimRef.current = String(text || "");
    if (interimTimerRef.current) return;
    interimTimerRef.current = window.setTimeout(() => {
      interimTimerRef.current = null;
      publish({ type: "interim", text: pendingInterimRef.current });
    }, 120);
  };

  useEffect(() => () => {
    if (interimTimerRef.current) window.clearTimeout(interimTimerRef.current);
  }, []);

  return { remoteLiveEntries, remoteSpeaking, remoteSpeakingRef, publishInterim, publishFinal: (entry) => publish({ type: "final", entry }) };
}

export default useLiveTranscriptSync;
