import { useState } from "react";
import Icon from "../common/Icon";
import "./RoomCollaborationPanel.css";

function RoomCollaborationPanel() {
  const [tab, setTab] = useState("chat");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState([]);
  const [editingId, setEditingId] = useState("");
  const [editingText, setEditingText] = useState("");
  const [note, setNote] = useState("");
  const send = () => { const text = draft.trim(); if (!text) return; setMessages((current) => [...current, { id: `${Date.now()}-${current.length}`, text }]); setDraft(""); };
  const beginEdit = (message) => { setEditingId(message.id); setEditingText(message.text); };
  const cancelEdit = () => { setEditingId(""); setEditingText(""); };
  const saveEdit = () => { const text = editingText.trim(); if (!text) return; setMessages((current) => current.map((message) => message.id === editingId ? { ...message, text } : message)); cancelEdit(); };
  const remove = (messageId) => { if (!window.confirm("Delete this message?")) return; setMessages((current) => current.filter((message) => message.id !== messageId)); if (editingId === messageId) cancelEdit(); };

  return <section className="room-collaboration" aria-label="Room collaboration"><div className="room-collaboration__tabs" role="tablist"><button className={tab === "chat" ? "is-active" : ""} type="button" role="tab" aria-selected={tab === "chat"} onClick={() => setTab("chat")}><Icon name="message" size={14} />Chat</button><button className={tab === "notes" ? "is-active" : ""} type="button" role="tab" aria-selected={tab === "notes"} onClick={() => setTab("notes")}><Icon name="edit" size={14} />Notes{note && <b>1</b>}</button></div>{tab === "chat" ? <><div className="room-collaboration__messages">{messages.length ? messages.map((message) => <div className="room-collaboration__message" key={message.id}><div className="room-collaboration__message-header"><strong>You</strong>{editingId !== message.id && <div className="room-collaboration__message-actions"><button type="button" onClick={() => beginEdit(message)}>Edit</button><button type="button" onClick={() => remove(message.id)}>Delete</button></div>}</div>{editingId === message.id ? <><textarea value={editingText} onChange={(event) => setEditingText(event.target.value)} aria-label="Edit chat message" autoFocus /><div className="room-collaboration__message-actions"><button type="button" onClick={saveEdit}>Save</button><button type="button" onClick={cancelEdit}>Cancel</button></div></> : <p>{message.text}</p>}</div>) : <div className="room-collaboration__empty"><Icon name="message" size={20} /><span>No chat messages yet</span></div>}</div><div className="room-collaboration__composer"><input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => event.key === "Enter" && send()} placeholder="Type a message..." aria-label="Chat message" /><button type="button" onClick={send} aria-label="Send message"><Icon name="arrowRight" size={15} /></button></div></> : <div className="room-collaboration__notes"><label htmlFor="interview-room-note">Private notes</label><textarea id="interview-room-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Capture a thought or follow-up..." /><small>Notes stay in this session.</small></div>}</section>;
}

export default RoomCollaborationPanel;
