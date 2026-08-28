import { useEffect, useRef, useState } from "react";
import { Room, RoomEvent, Track } from "livekit-client";
import Icon from "../common/Icon";
import { getInterviewLiveKitToken } from "../../services/apiClient";
import "./LiveKitCall.css";

const firstRemote = (room) => [...room.remoteParticipants.values()][0] || null;

function LiveKitCall({ interviewId, jobTitle, company, audioRequested, videoRequested, onAudioRequestedChange, onVideoRequestedChange, onRoom }) {
  const [room, setRoom] = useState(null); const [joined, setJoined] = useState(false); const [phase, setPhase] = useState("Ready to join"); const [error, setError] = useState("");
  const [micOn, setMicOn] = useState(false); const [cameraOn, setCameraOn] = useState(false); const [localVideo, setLocalVideo] = useState(null); const [remoteVideo, setRemoteVideo] = useState(null); const [remoteAudio, setRemoteAudio] = useState(null); const [remoteName, setRemoteName] = useState("Waiting for participant");
  const localVideoRef = useRef(null); const remoteVideoRef = useRef(null); const remoteAudioRef = useRef(null); const roomRef = useRef(null);

  const syncTracks = (liveRoom) => { setLocalVideo(liveRoom.localParticipant.getTrackPublication(Track.Source.Camera)?.videoTrack || null); const participant = firstRemote(liveRoom); setRemoteName(participant?.name || participant?.identity || "Waiting for participant"); setRemoteVideo(participant?.getTrackPublication(Track.Source.Camera)?.videoTrack || null); setRemoteAudio(participant?.getTrackPublication(Track.Source.Microphone)?.audioTrack || null); };
  useEffect(() => { if (!localVideo || !localVideoRef.current) return undefined; localVideo.attach(localVideoRef.current); return () => localVideo.detach(localVideoRef.current); }, [localVideo]);
  useEffect(() => { if (!remoteVideo || !remoteVideoRef.current) return undefined; remoteVideo.attach(remoteVideoRef.current); return () => remoteVideo.detach(remoteVideoRef.current); }, [remoteVideo]);
  useEffect(() => { if (!remoteAudio || !remoteAudioRef.current) return undefined; remoteAudio.attach(remoteAudioRef.current); void remoteAudioRef.current.play().catch(() => {}); return () => remoteAudio.detach(remoteAudioRef.current); }, [remoteAudio]);
  useEffect(() => () => { roomRef.current?.disconnect(); onRoom?.(null); }, [onRoom]);

  const join = async () => {
    const hasMediaApi = typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia;
    if ((audioRequested || videoRequested) && !hasMediaApi) { setPhase("Camera and microphone unavailable"); setError(window.isSecureContext ? "Use Chrome or Safari directly and allow camera and microphone permissions." : "Open this room with an HTTPS link. Camera and microphone do not work on an HTTP device/IP link."); return; }
    setError(""); setPhase("Getting secure room access..."); let liveRoom;
    try {
      const response = await getInterviewLiveKitToken(interviewId); liveRoom = new Room({ adaptiveStream: true, dynacast: true });
      liveRoom.on(RoomEvent.TrackSubscribed, (track, _publication, participant) => { setRemoteName(participant.name || participant.identity || "Participant"); if (track.kind === Track.Kind.Video) setRemoteVideo(track); if (track.kind === Track.Kind.Audio) setRemoteAudio(track); });
      liveRoom.on(RoomEvent.TrackUnsubscribed, () => syncTracks(liveRoom)); liveRoom.on(RoomEvent.ParticipantDisconnected, () => syncTracks(liveRoom)); liveRoom.on(RoomEvent.LocalTrackPublished, () => syncTracks(liveRoom)); liveRoom.on(RoomEvent.LocalTrackUnpublished, () => syncTracks(liveRoom));
      liveRoom.on(RoomEvent.Disconnected, () => { setJoined(false); setPhase("Disconnected"); onRoom?.(null); }); await liveRoom.connect(response.data.serverUrl, response.data.token);
      if (audioRequested) await liveRoom.localParticipant.setMicrophoneEnabled(true); if (videoRequested) await liveRoom.localParticipant.setCameraEnabled(true);
      roomRef.current = liveRoom; setRoom(liveRoom); onRoom?.(liveRoom); setJoined(true); setMicOn(audioRequested); setCameraOn(videoRequested); syncTracks(liveRoom); setPhase("Connected to interview room");
    } catch (requestError) { liveRoom?.disconnect(); roomRef.current = null; onRoom?.(null); setPhase("Unable to connect"); setError(requestError.message || "Could not join the LiveKit room."); }
  };
  const leave = () => { roomRef.current?.disconnect(); roomRef.current = null; setRoom(null); setJoined(false); setPhase("Ready to join"); onRoom?.(null); };
  const toggleMic = async () => { const next = !micOn; await room.localParticipant.setMicrophoneEnabled(next); setMicOn(next); };
  const toggleCamera = async () => { const next = !cameraOn; await room.localParticipant.setCameraEnabled(next); setCameraOn(next); };
  const mainVideo = remoteVideo; const mainName = remoteVideo ? remoteName : "Waiting for participant";

  return <section className="livekit-call" aria-labelledby="livekit-call-title"><div className="livekit-call__heading"><div><span className="livekit-overline">Live interview</span><h2 id="livekit-call-title">{jobTitle || "Interview room"}</h2><small>{company || "Secure video session"}</small></div><span className={`livekit-status ${joined ? "livekit-status--live" : ""}`}><i />{joined ? "Live" : phase}</span></div>{error && <p className="livekit-error" role="alert"><Icon name="alert" size={14} />{error}</p>}
    <div className="livekit-stage"><div className="livekit-stage__topline"><span><Icon name="briefcase" size={13} /> {jobTitle || "Interview session"}</span><b><i />{joined ? "Live" : "Ready"}</b></div><div className="livekit-primary-video">{mainVideo ? <video ref={remoteVideoRef} autoPlay playsInline /> : <span><Icon name={joined ? "people" : "camera"} size={32} />Waiting for participant</span>}<div className="livekit-primary-video__label"><strong>{mainName}</strong><small>{remoteVideo ? "Candidate" : "Awaiting participant"}</small></div></div><div className="livekit-stage__filmstrip"><div className="livekit-filmstrip-tile livekit-filmstrip-tile--active">{localVideo ? <video ref={localVideoRef} muted autoPlay playsInline /> : <span><Icon name="person" size={18} />You</span>}<b>You</b></div></div><audio ref={remoteAudioRef} autoPlay playsInline /><p className="livekit-stage__hint">{joined ? "Your secure interview connection is active." : "Join the room to start the secure audio and video connection."}</p></div>
    <div className="livekit-controls">{!joined ? <><label><input type="checkbox" checked={audioRequested} onChange={(event) => onAudioRequestedChange?.(event.target.checked)} /><Icon name="mic" size={15} /> Microphone</label><label><input type="checkbox" checked={videoRequested} onChange={(event) => onVideoRequestedChange?.(event.target.checked)} /><Icon name="camera" size={15} /> Camera</label><button className="livekit-controls__primary" type="button" onClick={join}><Icon name="people" size={16} />Join interview</button></> : <><button type="button" onClick={toggleCamera}><Icon name="camera" size={16} /><span>Camera</span></button><button type="button" onClick={toggleMic}><Icon name={micOn ? "mic" : "micOff"} size={16} /><span>Mic</span></button><button className="livekit-controls__danger" type="button" onClick={leave}><Icon name="close" size={16} /><span>End interview</span></button></>}</div>
  </section>;
}

export default LiveKitCall;
