import { useEffect, useState } from "react";
import { RoomEvent, Track } from "livekit-client";
import Icon from "../common/Icon";
import "./LiveKitParticipants.css";

const initials = (value) => String(value || "Participant").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
const micEnabled = (participant) => {
  const publication = participant.getTrackPublication?.(Track.Source.Microphone);
  return Boolean(publication && !publication.isMuted);
};

function LiveKitParticipants({ room, user, isAdmin }) {
  const localName = user?.displayName || "You";
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    const sync = () => {
      if (!room) return setParticipants([{ id: "local", name: localName, role: isAdmin ? "Interviewer" : "Candidate", local: true, micOn: false }]);
      const remote = [...room.remoteParticipants.values()].map((participant) => ({ id: participant.identity, name: participant.name || participant.identity, role: isAdmin ? "Candidate" : "Interviewer", local: false, micOn: micEnabled(participant) }));
      setParticipants([{ id: room.localParticipant.identity, name: `${localName} (You)`, role: isAdmin ? "Interviewer" : "Candidate", local: true, micOn: micEnabled(room.localParticipant) }, ...remote]);
    };
    sync();
    if (!room) return undefined;
    const events = [RoomEvent.ParticipantConnected, RoomEvent.ParticipantDisconnected, RoomEvent.LocalTrackPublished, RoomEvent.LocalTrackUnpublished, RoomEvent.TrackMuted, RoomEvent.TrackUnmuted];
    events.forEach((event) => room.on(event, sync));
    return () => events.forEach((event) => room.off(event, sync));
  }, [isAdmin, localName, room]);

  return <section className="room-participants" aria-labelledby="room-participants-title"><header className="room-participants__heading"><div><span className="room-panel-overline"><Icon name="people" size={13} /> Room roster</span><h2 id="room-participants-title">Participants <small>({participants.length})</small></h2></div><button type="button" aria-label="Participant options" title="Participant options"><Icon name="more" size={17} /></button></header><ul>{participants.map((participant) => <li key={participant.id}><span className={`room-participant-avatar${participant.local ? " room-participant-avatar--local" : ""}`}>{initials(participant.name)}</span><span className="room-participant-copy"><strong>{participant.name}</strong><small>{participant.role}</small></span><Icon className={participant.micOn ? "room-participant-mic--on" : ""} name={participant.micOn ? "mic" : "micOff"} size={15} /></li>)}{!room && <li className="room-participants__waiting"><span className="room-participant-avatar room-participant-avatar--waiting"><Icon name="person" size={14} /></span><span className="room-participant-copy"><strong>Waiting for participant</strong><small>Join the room to connect</small></span></li>}</ul><button className="room-participants__view" type="button" onClick={() => document.getElementById("room-participants-title")?.focus()}><Icon name="people" size={14} />View all participants</button></section>;
}

export default LiveKitParticipants;
