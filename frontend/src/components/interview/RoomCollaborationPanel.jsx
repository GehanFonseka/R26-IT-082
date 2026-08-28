import { useState } from "react";
import Icon from "../common/Icon";
import "./RoomCollaborationPanel.css";

function RoomCollaborationPanel() {
  const [tab, setTab] = useState("chat");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState([]);
  const [note, setNote] = useState("");
  const send = () => { const text = draft.trim(); if (!text) return; setMessages((current) => [...current, text]); setDraft(""); };

  return <section className="room-collaboration" aria-label="Room collaboration"><div className="room-collaboration__tabs" role="tablist"><button className={tab === "chat" ? "is-active" : ""} type="button" role="tab" aria-selected={tab === "chat"} onClick={() => setTab("chat")}><Icon name="message" size={14} />Chat</button><button className={tab === "notes" ? "is-active" : ""} type="button" role="tab" aria-selected={tab === "notes"} onClick={() => setTab("notes")}><Icon name="edit" size={14} />Notes{note && <b>1</b>}</button></div>{tab === "chat" ? <><div className="room-collaboration__messages">{messages.length ? messages.map((message, index) => <p key={`${message}-${index}`}><strong>You</strong>{message}</p>) : <div className="room-collaboration__empty"><Icon name="message" size={20} /><span>No chat messages yet</span></div>}</div><div className="room-collaboration__composer"><input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => event.key === "Enter" && send()} placeholder="Type a message..." aria-label="Chat message" /><button type="button" onClick={send} aria-label="Send message"><Icon name="arrowRight" size={15} /></button></div></> : <div className="room-collaboration__notes"><label htmlFor="interview-room-note">Private notes</label><textarea id="interview-room-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Capture a thought or follow-up..." /><small>Notes stay in this session.</small></div>}</section>;
}

export default RoomCollaborationPanel;
