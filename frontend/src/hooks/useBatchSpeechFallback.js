import { useEffect, useRef } from "react";
import { Track } from "livekit-client";
import { transcribeInterviewAudio } from "../services/apiClient";

const SEGMENT_MS = 4000;
const MIME_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];

const supportedMimeType = () => MIME_TYPES.find((type) => window.MediaRecorder.isTypeSupported?.(type)) || "";

function useBatchSpeechFallback({ active, interviewId, room, onText, onError }) {
  const callbacksRef = useRef({ onText, onError });
  const activeRef = useRef(active);
  const recorderRef = useRef(null);
  const timerRef = useRef(null);
  const queueRef = useRef(Promise.resolve());

  useEffect(() => {
    callbacksRef.current = { onText, onError };
  }, [onError, onText]);

  useEffect(() => {
    activeRef.current = active;
    if (!active) {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = null;
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      recorderRef.current = null;
      return undefined;
    }

    const mediaTrack = room?.localParticipant?.getTrackPublication(Track.Source.Microphone)?.track?.mediaStreamTrack;
    if (!mediaTrack || typeof window.MediaRecorder !== "function") {
      callbacksRef.current.onError?.("Whisper fallback cannot access the interview microphone.");
      return undefined;
    }

    const submit = (blob) => {
      if (!blob?.size) return;
      queueRef.current = queueRef.current.catch(() => {}).then(async () => {
        const response = await transcribeInterviewAudio(interviewId, blob);
        const text = String(response.data?.text || "").trim();
        if (text) callbacksRef.current.onText?.(text);
      }).catch((error) => callbacksRef.current.onError?.(error.message || "Whisper fallback could not transcribe this segment."));
    };

    const record = () => {
      if (!activeRef.current) return;
      try {
        const mimeType = supportedMimeType();
        const recorder = mimeType
          ? new window.MediaRecorder(new MediaStream([mediaTrack]), { mimeType })
          : new window.MediaRecorder(new MediaStream([mediaTrack]));
        const chunks = [];
        recorder.ondataavailable = (event) => { if (event.data?.size) chunks.push(event.data); };
        recorder.onerror = () => callbacksRef.current.onError?.("Whisper fallback audio recording failed.");
        recorder.onstop = () => {
          submit(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
          if (activeRef.current) timerRef.current = window.setTimeout(record, 50);
        };
        recorderRef.current = recorder;
        recorder.start();
        timerRef.current = window.setTimeout(() => {
          if (recorder.state === "recording") recorder.stop();
        }, SEGMENT_MS);
      } catch (error) {
        callbacksRef.current.onError?.(error.message || "Whisper fallback is unavailable in this browser.");
      }
    };

    record();
    return () => {
      activeRef.current = false;
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = null;
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      recorderRef.current = null;
    };
  }, [active, interviewId, room]);
}

export default useBatchSpeechFallback;
