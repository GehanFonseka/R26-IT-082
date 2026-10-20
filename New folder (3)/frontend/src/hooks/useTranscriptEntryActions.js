import { useState } from "react";
import { deleteInterviewTranscript, updateInterviewTranscript } from "../services/apiClient";

function useTranscriptEntryActions({ interviewId, setTranscript, setError }) {
  const [editingId, setEditingId] = useState("");
  const [draftText, setDraftText] = useState("");
  const [savingId, setSavingId] = useState("");
  const beginEdit = (entry) => { setError(""); setEditingId(entry.id); setDraftText(entry.text || ""); };
  const cancelEdit = () => { setEditingId(""); setDraftText(""); };
  const saveEdit = async (entryId) => {
    const text = draftText.trim();
    if (!text) return setError("Message text is required.");
    setSavingId(entryId);
    setError("");
    try {
      const response = await updateInterviewTranscript(interviewId, entryId, text);
      setTranscript((current) => current.map((entry) => entry.id === entryId ? response.data : entry));
      cancelEdit();
    } catch (error) { setError(error.message || "Could not update this message."); }
    finally { setSavingId(""); }
  };
  const removeEntry = async (entryId) => {
    if (!window.confirm("Delete this message from the transcript?")) return;
    setSavingId(entryId);
    setError("");
    try {
      await deleteInterviewTranscript(interviewId, entryId);
      setTranscript((current) => current.filter((entry) => entry.id !== entryId));
      if (editingId === entryId) cancelEdit();
    } catch (error) { setError(error.message || "Could not delete this message."); }
    finally { setSavingId(""); }
  };
  return { editingId, draftText, savingId, beginEdit, cancelEdit, saveEdit, removeEntry, setDraftText };
}

export default useTranscriptEntryActions;
