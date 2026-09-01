import { useEffect, useRef } from "react";

const getRecognitionConstructor = () => {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

export const supportsLiveSpeechRecognition = () => Boolean(getRecognitionConstructor());

const errorMessage = (code) => ({
  "not-allowed": "Microphone permission is required for live transcription.",
  "service-not-allowed": "This browser does not allow its speech service.",
  "audio-capture": "The browser could not access your microphone.",
  network: "The browser speech service is unavailable right now.",
}[code] || "Live speech recognition failed.");

function useLiveSpeechRecognition({ active, language, onFinalText, onInterimText, onError, onUnavailable }) {
  const callbacksRef = useRef({ onFinalText, onInterimText, onError, onUnavailable });
  const activeRef = useRef(false);
  const recognitionRef = useRef(null);
  const restartTimerRef = useRef(null);
  const canRestartRef = useRef(true);

  useEffect(() => {
    callbacksRef.current = { onFinalText, onInterimText, onError, onUnavailable };
  }, [onError, onFinalText, onInterimText, onUnavailable]);

  useEffect(() => {
    activeRef.current = active;
    if (!active) {
      canRestartRef.current = false;
      if (restartTimerRef.current) window.clearTimeout(restartTimerRef.current);
      return undefined;
    }

    const Recognition = getRecognitionConstructor();
    if (!Recognition) return undefined;
    canRestartRef.current = true;
    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language || "en-US";
    recognition.onresult = (event) => {
      const finalParts = [];
      const interimParts = [];
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const text = event.results[index][0]?.transcript?.trim();
        if (!text) continue;
        if (event.results[index].isFinal) finalParts.push(text);
        else interimParts.push(text);
      }
      if (finalParts.length) callbacksRef.current.onFinalText?.(finalParts.join(" "));
      callbacksRef.current.onInterimText?.(interimParts.join(" "));
    };
    recognition.onerror = (event) => {
      if (["not-allowed", "service-not-allowed", "audio-capture", "network"].includes(event.error)) {
        canRestartRef.current = false;
        callbacksRef.current.onUnavailable?.(errorMessage(event.error));
        return;
      }
      if (event.error) {
        callbacksRef.current.onError?.(errorMessage(event.error));
      }
    };
    recognition.onend = () => {
      if (!activeRef.current || !canRestartRef.current) return;
      restartTimerRef.current = window.setTimeout(() => {
        if (!activeRef.current || recognitionRef.current !== recognition) return;
        try { recognition.start(); } catch { /* Browser may still be closing the session. */ }
      }, 120);
    };
    recognitionRef.current = recognition;
    try { recognition.start(); } catch (error) { callbacksRef.current.onUnavailable?.(error.message); }

    return () => {
      recognition.onend = null;
      recognition.onerror = null;
      recognition.onresult = null;
      if (restartTimerRef.current) window.clearTimeout(restartTimerRef.current);
      if (recognitionRef.current === recognition) recognitionRef.current = null;
      try { recognition.stop(); } catch { /* Recognition may already be stopped. */ }
    };
  }, [active, language]);
}

export default useLiveSpeechRecognition;
