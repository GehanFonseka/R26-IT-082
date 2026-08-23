import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import CvNavigation from "../../components/layout/CvNavigation";
import CvTopbar from "../../components/layout/CvTopbar";
import Icon from "../../components/common/Icon";
import InterviewAnalysisPanel from "../../components/interview/InterviewAnalysisPanel";
import { useAuth } from "../../context/AuthContext";
import {
  appendInterviewTranscript,
  getAdminInterviews,
  getInterviewRoom,
  getInterviewMediaRequest,
  getInterviewVideoFrame,
  getInterviewTranscript,
  getMyInterviews,
  saveInterviewAnswer,
  saveInterviewOffer,
  requestInterviewMedia,
  sendInterviewVideoFrame,
  transcribeInterviewAudio,
} from "../../services/apiClient";
import "./InterviewRoomPage.css";

const wait = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));
const VIDEO_FRAME_SEND_INTERVAL_MS = 500;
const VIDEO_FRAME_POLL_INTERVAL_MS = 500;
const MEDIA_HANDOFF_POLL_INTERVAL_MS = 800;

const normalizeSdp = (value) => {
  const normalized = String(value || "")
    .replace(/\\r\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .join("\r\n");
  return normalized ? `${normalized}\r\n` : "";
};

const addMediaChannels = (peerConnection, stream, allowCameraHandoff = false) => {
  const audioTrack = stream.getAudioTracks()[0];
  const videoTrack = stream.getVideoTracks()[0];
  const audioTransceiver = audioTrack
    ? peerConnection.addTransceiver(audioTrack, { direction: "sendrecv" })
    : peerConnection.addTransceiver("audio", { direction: allowCameraHandoff ? "sendrecv" : "recvonly" });
  const videoTransceiver = videoTrack
    ? peerConnection.addTransceiver(videoTrack, { direction: "sendrecv" })
    : peerConnection.addTransceiver("video", { direction: allowCameraHandoff ? "sendrecv" : "recvonly" });
  return { audioTransceiver, videoTransceiver };
};

const isBusyCameraError = (error) => ["NotReadableError", "TrackStartError", "AbortError"].includes(error?.name)
  || /device in use|could not start video source/i.test(error?.message || "");

const createDemoVideoStream = (label) => {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 360;
  const context = canvas.getContext("2d");
  if (!context || typeof canvas.captureStream !== "function") {
    throw new Error("This browser cannot create a same-device demo video. Use Chrome or Edge for the demo.");
  }

  let animationFrame = 0;
  const startedAt = performance.now();
  const render = (now) => {
    const elapsed = (now - startedAt) / 1000;
    const glow = Math.round(34 + ((Math.sin(elapsed * 2) + 1) * 10));
    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, `rgb(${glow}, ${glow + 8}, ${glow + 28})`);
    gradient.addColorStop(1, "rgb(8, 12, 26)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "rgba(141, 155, 255, 0.18)";
    context.beginPath();
    context.arc(canvas.width - 90, 82, 56 + (Math.sin(elapsed * 1.5) * 5), 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#f6f7fb";
    context.font = "700 28px Arial, sans-serif";
    context.fillText(label, 36, 170);
    context.fillStyle = "#aeb9ff";
    context.font = "16px Arial, sans-serif";
    context.fillText("Same-device interview demo", 36, 202);
    context.fillStyle = "#65e6d4";
    context.beginPath();
    context.arc(43, 245, 6, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#d8defd";
    context.font = "15px Arial, sans-serif";
    context.fillText("Local same-device demo video", 60, 250);
    animationFrame = window.requestAnimationFrame(render);
  };
  animationFrame = window.requestAnimationFrame(render);
  const stream = canvas.captureStream(15);
  const track = stream.getVideoTracks()[0];
  track?.addEventListener("ended", () => window.cancelAnimationFrame(animationFrame), { once: true });
  return stream;
};

const createSilentAudioStream = () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return { stream: new MediaStream(), cleanup: () => {} };
  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const destination = context.createMediaStreamDestination();
  gain.gain.value = 0;
  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start();
  return {
    stream: destination.stream,
    cleanup: () => {
      try { oscillator.stop(); } catch { /* already stopped */ }
      void context.close();
    },
  };
};

const createNegotiationMedia = () => {
  const videoStream = createDemoVideoStream("Waiting for live speaker");
  const audioMedia = createSilentAudioStream();
  return {
    stream: new MediaStream([...audioMedia.stream.getAudioTracks(), ...videoStream.getVideoTracks()]),
    cleanup: () => {
      videoStream.getTracks().forEach((track) => track.stop());
      audioMedia.cleanup();
    },
  };
};

const getLocalMedia = async ({ audio, video, allowDemoVideo, demoLabel }) => {
  if (!audio && !video) return new MediaStream();
  if (!video) {
    return navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  }

  try {
    return await navigator.mediaDevices.getUserMedia({ audio, video: true });
  } catch (error) {
    if (!allowDemoVideo || !isBusyCameraError(error)) throw error;
    const demoStream = createDemoVideoStream(demoLabel);
    if (audio) {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      audioStream.getAudioTracks().forEach((track) => demoStream.addTrack(track));
    }
    return demoStream;
  }
};

const waitForIceGathering = (peerConnection) => new Promise((resolve) => {
  if (peerConnection.iceGatheringState === "complete") {
    resolve();
    return;
  }
  const finish = () => {
    if (peerConnection.iceGatheringState !== "complete") return;
    peerConnection.removeEventListener("icegatheringstatechange", finish);
    resolve();
  };
  peerConnection.addEventListener("icegatheringstatechange", finish);
  window.setTimeout(() => {
    peerConnection.removeEventListener("icegatheringstatechange", finish);
    resolve();
  }, 6000);
});

const waitForRoomValue = async (interviewId, property, timeout = 180000) => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeout) {
    const response = await getInterviewRoom(interviewId);
    if (response.data?.[property]) return response.data;
    await wait(1500);
  }
  throw new Error("The other participant has not joined yet. Keep this room open and try again.");
};

const roomDescriptionKey = (description) => {
  if (!description) return "";
  return `${description.userId || ""}:${description.createdAt || ""}:${description.sdp || ""}`;
};

const mergeTranscriptEntries = (current, incoming) => {
  const entries = new Map((current || []).filter((entry) => entry?.id).map((entry) => [entry.id, entry]));
  (incoming || []).filter((entry) => entry?.id).forEach((entry) => entries.set(entry.id, entry));
  return [...entries.values()].sort((first, second) => new Date(first.createdAt || 0) - new Date(second.createdAt || 0));
};

function InterviewRoomPage() {
  const { user } = useAuth();
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [interview, setInterview] = useState(null);
  const [transcript, setTranscript] = useState([]);
  const [liveText, setLiveText] = useState("");
  const [language, setLanguage] = useState("en-US");
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [audioRequested, setAudioRequested] = useState(isAdmin);
  // The demo uses one physical webcam/microphone. The interviewer owns those
  // devices; the candidate joins receive-only so the second tab cannot lock
  // the same camera and microphone.
  const [sameDeviceDemo] = useState(true);
  const [videoRequested, setVideoRequested] = useState(isAdmin);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [remoteVideoFrame, setRemoteVideoFrame] = useState("");
  const [phase, setPhase] = useState("Ready to join");
  const [transcribing, setTranscribing] = useState(false);
  const [supportsMediaRecorder, setSupportsMediaRecorder] = useState(false);
  const [error, setError] = useState("");
  const [transcriptionError, setTranscriptionError] = useState("");
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const mediaTransceiversRef = useRef({ audioTransceiver: null, videoTransceiver: null });
  const negotiationMediaRef = useRef({ stream: null, cleanup: () => {} });
  const cameraChannelRef = useRef(null);
  const videoFrameCaptureRef = useRef({ video: null, canvas: null, timer: null, active: false, capturing: false, sequence: 0, sessionId: "" });
  const remoteFrameKeyRef = useRef("");
  const initialNegotiationReadyRef = useRef(false);
  const transcriptionActiveRef = useRef(false);
  const recorderRef = useRef(null);
  const recorderTimerRef = useRef(null);
  const transcriptionQueueRef = useRef(Promise.resolve());
  const joinAttemptRef = useRef(0);
  const pushToTalkActiveRef = useRef(false);
  const pushToTalkRequestRef = useRef(0);
  const renegotiationBusyRef = useRef(false);
  const releaseAfterRenegotiationRef = useRef(false);
  const handledRemoteOfferRef = useRef("");
  const handledMediaRequestRef = useRef("");

  const refreshRemoteStream = (peerConnection) => {
    const tracks = peerConnection.getReceivers()
      .map((receiver) => receiver.track)
      .filter((track) => track && track.readyState !== "ended");
    if (tracks.length) setRemoteStream(new MediaStream(tracks));
  };

  const clearRemoteVideoFrame = () => {
    remoteFrameKeyRef.current = "";
    setRemoteVideoFrame("");
  };

  const stopVideoFrameRelay = () => {
    const capture = videoFrameCaptureRef.current;
    if (capture.timer) window.clearInterval(capture.timer);
    if (capture.active && capture.sessionId) {
      void sendInterviewVideoFrame(interviewId, "", capture.sequence, capture.sessionId).catch(() => {});
    }
    capture.video?.pause();
    if (capture.video) capture.video.srcObject = null;
    videoFrameCaptureRef.current = { video: null, canvas: null, timer: null, active: false, capturing: false, sequence: 0, sessionId: "" };
  };

  // WebRTC continues to carry the interview audio. For the one-laptop demo,
  // the active tab also mirrors small live video frames through the local API
  // room relay so normal and incognito windows can both receive the same video.
  const startVideoFrameRelay = (stream) => {
    if (!stream?.getVideoTracks?.().length) return;
    stopVideoFrameRelay();
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.srcObject = stream;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return;
    const sessionId = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const capture = { video, canvas, timer: null, active: true, capturing: false, sequence: 0, sessionId };
    videoFrameCaptureRef.current = capture;
    const sendFrame = () => {
      if (!capture.active || capture.capturing || video.readyState < 2 || !video.videoWidth || !video.videoHeight) return;
      capture.capturing = true;
      canvas.width = Math.min(video.videoWidth, 640);
      canvas.height = Math.round(canvas.width * (video.videoHeight / video.videoWidth));
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob || !capture.active || videoFrameCaptureRef.current !== capture) {
          capture.capturing = false;
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          if (!capture.active || videoFrameCaptureRef.current !== capture) {
            capture.capturing = false;
            return;
          }
          capture.sequence += 1;
          void sendInterviewVideoFrame(interviewId, String(reader.result || ""), capture.sequence, capture.sessionId)
            .catch(() => {})
            .finally(() => { capture.capturing = false; });
        };
        reader.onerror = () => { capture.capturing = false; };
        reader.readAsDataURL(blob);
      }, "image/jpeg", 0.72);
    };
    video.addEventListener("loadedmetadata", () => { void video.play().catch(() => {}); }, { once: true });
    void video.play().catch(() => {});
    capture.timer = window.setInterval(sendFrame, VIDEO_FRAME_SEND_INTERVAL_MS);
    sendFrame();
  };

  useEffect(() => {
    setSupportsMediaRecorder(Boolean(window.MediaRecorder));
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadRoom = async () => {
      setLoading(true);
      try {
        const [interviewsResponse, transcriptResponse] = await Promise.all([
          isAdmin ? getAdminInterviews() : getMyInterviews(),
          getInterviewTranscript(interviewId),
        ]);
        const selected = (interviewsResponse.data || []).find((item) => item.id === interviewId);
        if (!selected) throw new Error("This interview is not available for your account.");
        if (!mounted) return;
        setInterview(selected);
        setTranscript(mergeTranscriptEntries([], Array.isArray(transcriptResponse.data) ? transcriptResponse.data : []));
      } catch (requestError) {
        if (mounted) setError(requestError.message || "Could not load this interview room.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadRoom();
    return () => { mounted = false; };
  }, [interviewId, isAdmin]);

  useEffect(() => {
    if (!localStream || !localVideoRef.current) return;
    const video = localVideoRef.current;
    video.srcObject = localStream;
    const play = () => { void video.play().catch(() => {}); };
    video.addEventListener("loadedmetadata", play);
    video.addEventListener("canplay", play);
    play();
    return () => {
      video.removeEventListener("loadedmetadata", play);
      video.removeEventListener("canplay", play);
    };
  }, [localStream]);

  useEffect(() => {
    if (!remoteStream || !remoteAudioRef.current) return;
    remoteAudioRef.current.srcObject = remoteStream;
    remoteAudioRef.current.play().catch(() => {});
  }, [remoteStream]);

  useEffect(() => {
    if (!remoteStream || !remoteVideoRef.current) return;
    const video = remoteVideoRef.current;
    video.srcObject = remoteStream;
    video.muted = true;
    const play = () => { void video.play().catch(() => {}); };
    video.addEventListener("loadedmetadata", play);
    video.addEventListener("canplay", play);
    play();
    return () => {
      video.removeEventListener("loadedmetadata", play);
      video.removeEventListener("canplay", play);
    };
  }, [remoteStream]);

  useEffect(() => {
    if (!joined) return undefined;
    let mounted = true;
    const refreshTranscript = async () => {
      try {
        const response = await getInterviewTranscript(interviewId);
        if (mounted && Array.isArray(response.data)) setTranscript((current) => mergeTranscriptEntries(current, response.data));
      } catch {
        // The existing transcript remains visible if a polling request fails.
      }
    };
    const interval = window.setInterval(refreshTranscript, 2000);
    return () => { mounted = false; window.clearInterval(interval); };
  }, [interviewId, joined]);

  const leaveRoom = () => {
    joinAttemptRef.current += 1;
    pushToTalkRequestRef.current += 1;
    pushToTalkActiveRef.current = false;
    transcriptionActiveRef.current = false;
    if (recorderTimerRef.current) window.clearTimeout(recorderTimerRef.current);
    recorderTimerRef.current = null;
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    recorderRef.current = null;
    setTranscribing(false);
    stopVideoFrameRelay();
    clearRemoteVideoFrame();
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    peerRef.current?.close();
    peerRef.current = null;
    initialNegotiationReadyRef.current = false;
    renegotiationBusyRef.current = false;
    releaseAfterRenegotiationRef.current = false;
    handledRemoteOfferRef.current = "";
    handledMediaRequestRef.current = "";
    mediaTransceiversRef.current = { audioTransceiver: null, videoTransceiver: null };
    negotiationMediaRef.current.cleanup();
    negotiationMediaRef.current = { stream: null, cleanup: () => {} };
    setRemoteStream(null);
    setLocalStream(null);
    setAudioEnabled(false);
    setVideoEnabled(false);
    setBroadcasting(false);
    setJoined(false);
    setPhase("Ready to join");
  };

  useEffect(() => () => leaveRoom(), []);

  const joinRoom = async ({ forceVideo = false } = {}) => {
    if (!interview) return;
    const requestedAudio = sameDeviceDemo ? false : audioRequested;
    const requestedVideo = sameDeviceDemo ? false : (forceVideo || videoRequested);
    const joinAttempt = joinAttemptRef.current + 1;
    joinAttemptRef.current = joinAttempt;
    initialNegotiationReadyRef.current = false;
    releaseAfterRenegotiationRef.current = false;
    handledRemoteOfferRef.current = "";
    handledMediaRequestRef.current = "";
    setError("");
    setPhase(requestedAudio || requestedVideo ? "Requesting device permission..." : "Opening room without local devices...");
    try {
      if (!window.RTCPeerConnection || !window.MediaStream) throw new Error("This browser does not support the interview room connection.");
      if ((requestedAudio || requestedVideo) && !navigator.mediaDevices?.getUserMedia) throw new Error("Camera and microphone access is not available in this browser.");
      const stream = await getLocalMedia({
        audio: requestedAudio,
        video: requestedVideo,
        allowDemoVideo: true,
        demoLabel: isAdmin ? "Interviewer preview" : "Candidate preview",
      });
      negotiationMediaRef.current = sameDeviceDemo
        ? createNegotiationMedia()
        : { stream, cleanup: () => {} };
      localStreamRef.current = stream;
      setLocalStream(stream);
      setAudioEnabled(stream.getAudioTracks().length > 0);
      setVideoEnabled(stream.getVideoTracks().length > 0);
      setBroadcasting(false);
      const peerConnection = new RTCPeerConnection({ iceServers: [] });
      peerRef.current = peerConnection;
      peerConnection.ontrack = (event) => {
        if (peerRef.current !== peerConnection || joinAttemptRef.current !== joinAttempt) return;
        const incomingTracks = event.streams[0]?.getTracks?.() || [event.track];
        setRemoteStream((current) => {
          const tracks = new Map((current?.getTracks?.() || []).map((track) => [track.id, track]));
          incomingTracks.forEach((track) => tracks.set(track.id, track));
          return new MediaStream([...tracks.values()]);
        });
      };
      peerConnection.onconnectionstatechange = () => {
        if (peerRef.current !== peerConnection || joinAttemptRef.current !== joinAttempt) return;
        if (["connected", "completed"].includes(peerConnection.connectionState)) setPhase("Connected to interview room");
        if (peerConnection.connectionState === "disconnected") setPhase("Connection interrupted. Reconnecting...");
        if (peerConnection.connectionState === "failed") setPhase("Connection failed. Leave and join again.");
      };
      peerConnection.oniceconnectionstatechange = () => {
        if (peerRef.current !== peerConnection || joinAttemptRef.current !== joinAttempt) return;
        if (["connected", "completed"].includes(peerConnection.iceConnectionState)) setPhase("Connected to interview room");
        if (peerConnection.iceConnectionState === "checking") setPhase("Connecting participants...");
        if (peerConnection.iceConnectionState === "disconnected") setPhase("Connection interrupted. Reconnecting...");
        if (peerConnection.iceConnectionState === "failed") setPhase("Connection failed. Leave and join again.");
      };
      mediaTransceiversRef.current = addMediaChannels(peerConnection, negotiationMediaRef.current.stream, sameDeviceDemo);
      setJoined(true);

      const assertActiveConnection = () => {
        if (joinAttemptRef.current !== joinAttempt || peerRef.current !== peerConnection || peerConnection.signalingState === "closed") {
          throw new Error("The interview connection was closed. Join the room again.");
        }
      };

      if (isAdmin) {
        setPhase("Opening room for the candidate...");
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        await waitForIceGathering(peerConnection);
        await saveInterviewOffer(interview.id, normalizeSdp(peerConnection.localDescription.sdp));
        setPhase("Room open. Waiting for the candidate...");
        const room = await waitForRoomValue(interview.id, "answer");
        assertActiveConnection();
        await peerConnection.setRemoteDescription({ type: "answer", sdp: normalizeSdp(room.answer.sdp) });
        refreshRemoteStream(peerConnection);
        initialNegotiationReadyRef.current = true;
        setPhase("Connected. Hold the walkie-talkie button to speak.");
      } else {
        setPhase("Waiting for the admin to open the room...");
        const room = await waitForRoomValue(interview.id, "offer");
        assertActiveConnection();
        await peerConnection.setRemoteDescription({ type: "offer", sdp: normalizeSdp(room.offer.sdp) });
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        await waitForIceGathering(peerConnection);
        assertActiveConnection();
        await saveInterviewAnswer(interview.id, normalizeSdp(peerConnection.localDescription.sdp));
        refreshRemoteStream(peerConnection);
        initialNegotiationReadyRef.current = true;
        setPhase("Answer sent. Connecting to the admin...");
      }
    } catch (requestError) {
      leaveRoom();
      setError(requestError.message || "Could not join the interview room. Check your browser permissions.");
    }
  };

  const renegotiateAsCandidate = async () => {
    if (isAdmin || !interview || !initialNegotiationReadyRef.current) return;
    const peerConnection = peerRef.current;
    if (!peerConnection || peerConnection.signalingState === "closed") throw new Error("The interview connection was closed. Join the room again.");
    if (renegotiationBusyRef.current) return;

  renegotiationBusyRef.current = true;
  try {
      if (peerConnection.signalingState !== "stable") throw new Error("The interview connection is still negotiating. Release the button and try again.");
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      await waitForIceGathering(peerConnection);
      if (peerConnection.signalingState === "closed") throw new Error("The interview connection was closed. Join the room again.");
      await saveInterviewOffer(interview.id, normalizeSdp(peerConnection.localDescription.sdp));
      const room = await waitForRoomValue(interview.id, "answer", 30000);
      if (peerRef.current !== peerConnection || peerConnection.signalingState === "closed") throw new Error("The interview connection was closed. Join the room again.");
      await peerConnection.setRemoteDescription({ type: "answer", sdp: normalizeSdp(room.answer.sdp) });
      refreshRemoteStream(peerConnection);
    } catch (requestError) {
      if (peerConnection.signalingState === "have-local-offer") {
        try { await peerConnection.setLocalDescription({ type: "rollback" }); } catch { /* the room will be reset on the next attempt */ }
      }
      throw requestError;
    } finally {
      renegotiationBusyRef.current = false;
    }
  };

  const toggleMicrophone = () => {
    const nextEnabled = !audioEnabled;
    localStreamRef.current?.getAudioTracks().forEach((track) => { track.enabled = nextEnabled; });
    setAudioEnabled(nextEnabled);
  };

  const releaseLocalCamera = async () => {
    await mediaTransceiversRef.current.videoTransceiver?.sender.replaceTrack(negotiationMediaRef.current.stream?.getVideoTracks?.()[0] || null).catch(() => {});
    const currentStream = localStreamRef.current;
    currentStream?.getVideoTracks().forEach((track) => track.stop());
    if (currentStream) {
      const nextStream = new MediaStream(currentStream.getAudioTracks());
      localStreamRef.current = nextStream;
      setLocalStream(nextStream);
    }
    setVideoEnabled(false);
    setBroadcasting(false);
  };

  const releaseLocalMedia = async () => {
    stopVideoFrameRelay();
    await Promise.all([
      mediaTransceiversRef.current.audioTransceiver?.sender.replaceTrack(negotiationMediaRef.current.stream?.getAudioTracks?.()[0] || null).catch(() => {}),
      mediaTransceiversRef.current.videoTransceiver?.sender.replaceTrack(negotiationMediaRef.current.stream?.getVideoTracks?.()[0] || null).catch(() => {}),
    ]);
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = new MediaStream();
    setLocalStream(localStreamRef.current);
    setAudioEnabled(false);
    setVideoEnabled(false);
    setBroadcasting(false);
    stopTranscription();
  };

  useEffect(() => {
    if (!sameDeviceDemo || !interviewId || !joined) return undefined;
    let cancelled = false;
    const refreshVideoFrame = async () => {
      try {
        const response = await getInterviewVideoFrame(interviewId);
        const data = response.data || {};
        if (cancelled) return;
        if (!data.frame || data.userId === user?.id) {
          if (remoteFrameKeyRef.current) clearRemoteVideoFrame();
          return;
        }
        const key = `${data.sessionId || ""}:${data.sequence || 0}:${data.updatedAt || ""}`;
        if (key === remoteFrameKeyRef.current) return;
        remoteFrameKeyRef.current = key;
        setRemoteVideoFrame(data.frame);
      } catch {
        // The WebRTC video element remains available if a frame poll is unavailable.
      }
    };
    const interval = window.setInterval(() => { void refreshVideoFrame(); }, VIDEO_FRAME_POLL_INTERVAL_MS);
    void refreshVideoFrame();
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      stopVideoFrameRelay();
      clearRemoteVideoFrame();
    };
  }, [interviewId, isAdmin, joined, sameDeviceDemo, user?.id]);

  useEffect(() => {
    if (!sameDeviceDemo || !interviewId || typeof window.BroadcastChannel !== "function") return undefined;
    const channel = new BroadcastChannel(`interview-camera-${interviewId}`);
    cameraChannelRef.current = channel;
    channel.onmessage = (event) => {
      const message = event.data || {};
      if (!["camera.request", "media.request"].includes(message.type) || message.interviewId !== interviewId) return;
      if (message.fromRole === (isAdmin ? "admin" : "candidate")) return;
      void (message.type === "media.request" ? releaseLocalMedia() : releaseLocalCamera());
    };
    return () => {
      channel.close();
      if (cameraChannelRef.current === channel) cameraChannelRef.current = null;
    };
  }, [interviewId, isAdmin, sameDeviceDemo]);

  useEffect(() => {
    if (!sameDeviceDemo || !interviewId || !joined) return undefined;
    let cancelled = false;
    const consumeMediaRequest = async () => {
      try {
        const response = await getInterviewMediaRequest(interviewId);
        const request = response.data;
        if (cancelled || !request || request.userId === user?.id || request.id === handledMediaRequestRef.current) return;
        handledMediaRequestRef.current = request.id;
        await releaseLocalMedia();
      } catch {
        // BroadcastChannel remains as a fast path; the next poll retries the API handoff.
      }
    };
    const interval = window.setInterval(() => { void consumeMediaRequest(); }, MEDIA_HANDOFF_POLL_INTERVAL_MS);
    void consumeMediaRequest();
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [interviewId, isAdmin, joined, sameDeviceDemo, user?.id]);

  useEffect(() => {
    if (!sameDeviceDemo || !isAdmin || !joined || !interview?.id) return undefined;
    let cancelled = false;

    const answerCandidateOffer = async () => {
      if (cancelled || !initialNegotiationReadyRef.current || renegotiationBusyRef.current) return;
      const peerConnection = peerRef.current;
      if (!peerConnection || peerConnection.signalingState === "closed" || peerConnection.signalingState !== "stable") return;

      try {
        const response = await getInterviewRoom(interview.id);
        const offer = response.data?.offer;
        if (!offer || offer.userId === user?.id) return;
        const key = roomDescriptionKey(offer);
        if (!key || key === handledRemoteOfferRef.current) return;

        renegotiationBusyRef.current = true;
        await peerConnection.setRemoteDescription({ type: "offer", sdp: normalizeSdp(offer.sdp) });
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        await waitForIceGathering(peerConnection);
        await saveInterviewAnswer(interview.id, normalizeSdp(peerConnection.localDescription.sdp));
        handledRemoteOfferRef.current = key;
        refreshRemoteStream(peerConnection);
        setPhase("Candidate media connected");
      } catch (requestError) {
        if (peerConnection.signalingState === "have-remote-offer") {
          try { await peerConnection.setLocalDescription({ type: "rollback" }); } catch { /* retry on the next poll */ }
        }
        if (!cancelled && requestError?.status !== 404) setPhase("Connecting candidate media...");
      } finally {
        renegotiationBusyRef.current = false;
      }
    };

    const interval = window.setInterval(() => { void answerCandidateOffer(); }, 800);
    void answerCandidateOffer();
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [interview?.id, isAdmin, joined, sameDeviceDemo, user?.id]);

  const requestCameraHandoff = () => {
    cameraChannelRef.current?.postMessage({
      type: "camera.request",
      interviewId,
      fromRole: isAdmin ? "admin" : "candidate",
    });
  };

  const requestMediaHandoff = () => {
    cameraChannelRef.current?.postMessage({
      type: "media.request",
      interviewId,
      fromRole: isAdmin ? "admin" : "candidate",
    });
    void requestInterviewMedia(interviewId).catch(() => {});
  };

  const startPushToTalk = async () => {
    if (!sameDeviceDemo || !joined || pushToTalkActiveRef.current || renegotiationBusyRef.current) return;
    if (!initialNegotiationReadyRef.current) {
      setError("Wait until both participants are connected before speaking.");
      return;
    }
    const requestId = pushToTalkRequestRef.current + 1;
    pushToTalkRequestRef.current = requestId;
    requestMediaHandoff();
    await wait(180);
    try {
      if (requestId !== pushToTalkRequestRef.current) return;
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera and microphone access is not available in this browser.");
      let stream;
      let lastError;
      for (let attempt = 0; attempt < 8; attempt += 1) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
          break;
        } catch (requestError) {
          lastError = requestError;
          if (!isBusyCameraError(requestError)) throw requestError;
          if (attempt === 7) break;
          await wait(250);
        }
      }
      if (!stream) {
        if (!isBusyCameraError(lastError)) throw lastError || new Error("Could not access the laptop camera and microphone.");
        const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        const demoVideoStream = createDemoVideoStream(isAdmin ? "Interviewer live video" : "Candidate live video");
        audioOnlyStream.getAudioTracks().forEach((track) => demoVideoStream.addTrack(track));
        stream = demoVideoStream;
      }
      if (requestId !== pushToTalkRequestRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      const audioTrack = stream.getAudioTracks()[0];
      const videoTrack = stream.getVideoTracks()[0];
      if (audioTrack) audioTrack.enabled = true;
      if (videoTrack) videoTrack.enabled = true;
      const { audioTransceiver, videoTransceiver } = mediaTransceiversRef.current;
      if (audioTransceiver) audioTransceiver.direction = "sendrecv";
      if (videoTransceiver) videoTransceiver.direction = "sendrecv";
      await audioTransceiver?.sender.replaceTrack(audioTrack || null);
      await videoTransceiver?.sender.replaceTrack(videoTrack || null);
      audioTransceiver?.sender.setStreams?.(stream);
      videoTransceiver?.sender.setStreams?.(stream);
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = stream;
      setLocalStream(stream);
      setAudioEnabled(Boolean(audioTrack));
      setVideoEnabled(Boolean(videoTrack));
      setPhase(isAdmin ? "Sending interviewer media..." : "Sending candidate media...");
      if (!isAdmin) await renegotiateAsCandidate();
      if (requestId !== pushToTalkRequestRef.current || releaseAfterRenegotiationRef.current) {
        releaseAfterRenegotiationRef.current = false;
        await releaseLocalMedia();
        if (joined) setPhase("Hold the walkie-talkie button to speak");
        return;
      }
      startVideoFrameRelay(stream);
      pushToTalkActiveRef.current = true;
      setBroadcasting(true);
      setPhase(isAdmin ? "Interviewer is live" : "Candidate is live");
      startTranscription();
    } catch (requestError) {
      if (!pushToTalkActiveRef.current) await releaseLocalMedia();
      setError(requestError.message || "Could not access the laptop camera and microphone.");
    }
  };

  const stopPushToTalk = async () => {
    pushToTalkRequestRef.current += 1;
    pushToTalkActiveRef.current = false;
    if (renegotiationBusyRef.current) {
      releaseAfterRenegotiationRef.current = true;
      if (joined) setPhase("Finishing the live message...");
      return;
    }
    await releaseLocalMedia();
    if (joined) setPhase("Hold the walkie-talkie button to speak");
  };

  const setBroadcastActive = (active) => {
    if (active) void startPushToTalk();
    else void stopPushToTalk();
  };

  const acquireLocalCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera access is not available in this browser.");
    requestCameraHandoff();
    let lastError;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
        const videoTrack = stream.getVideoTracks()[0];
        await mediaTransceiversRef.current.videoTransceiver?.sender.replaceTrack(videoTrack);
        const currentStream = localStreamRef.current;
        currentStream?.getVideoTracks().forEach((track) => track.stop());
        const nextStream = new MediaStream([...(currentStream?.getAudioTracks() || []), videoTrack]);
        localStreamRef.current = nextStream;
        setLocalStream(nextStream);
        setVideoRequested(true);
        setVideoEnabled(true);
        setPhase(isAdmin ? "Interviewer camera live" : "Candidate camera live");
        return;
      } catch (requestError) {
        lastError = requestError;
        if (!isBusyCameraError(requestError) || attempt === 5) throw requestError;
        await wait(250);
      }
    }
    throw lastError || new Error("Could not access the laptop camera.");
  };

  const toggleCamera = () => {
    if (sameDeviceDemo) {
      if (broadcasting) void stopPushToTalk();
      else void startPushToTalk();
      return;
    }
    if (!localStreamRef.current?.getVideoTracks().length) {
      setVideoRequested(true);
      leaveRoom();
      window.setTimeout(() => { void joinRoom({ forceVideo: true }); }, 0);
      return;
    }
    const nextEnabled = !videoEnabled;
    localStreamRef.current?.getVideoTracks().forEach((track) => { track.enabled = nextEnabled; });
    setVideoEnabled(nextEnabled);
  };

  const retryRoom = () => {
    if (!interview) return;
    setVideoRequested(true);
    leaveRoom();
    window.setTimeout(() => { void joinRoom({ forceVideo: true }); }, 0);
  };

  const submitTranscriptionSegment = async (blob) => {
    if (!blob?.size || !interview) return;
    transcriptionQueueRef.current = transcriptionQueueRef.current
      .catch(() => {})
      .then(async () => {
        const response = await transcribeInterviewAudio(interview.id, blob, language);
        const text = response.data?.text?.trim();
        if (!text) return;
        const saved = await appendInterviewTranscript(interview.id, text, language);
        if (saved.data) setTranscript((current) => mergeTranscriptEntries(current, [saved.data]));
      })
      .catch((requestError) => {
        if ([502, 503, 504].includes(requestError.status)) {
          transcriptionActiveRef.current = false;
          if (recorderTimerRef.current) window.clearTimeout(recorderTimerRef.current);
          recorderTimerRef.current = null;
          if (recorderRef.current?.state === "recording") recorderRef.current.stop();
          recorderRef.current = null;
          setTranscribing(false);
        }
        setTranscriptionError(requestError.message || "Could not transcribe this interview segment.");
      });
    return transcriptionQueueRef.current;
  };

  const startTranscriptionSegment = () => {
    if (!transcriptionActiveRef.current) return;
    const audioTrack = localStreamRef.current?.getAudioTracks?.()[0];
    if (!audioTrack) {
      transcriptionActiveRef.current = false;
      setTranscribing(false);
      setTranscriptionError("Join with the participant microphone enabled to start local transcription.");
      return;
    }
    try {
      const canCheckMimeType = typeof MediaRecorder.isTypeSupported === "function";
      const mimeType = canCheckMimeType
        ? ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((type) => MediaRecorder.isTypeSupported(type))
        : "";
      const recorder = mimeType
        ? new MediaRecorder(new MediaStream([audioTrack]), { mimeType })
        : new MediaRecorder(new MediaStream([audioTrack]));
      const chunks = [];
      recorder.ondataavailable = (event) => {
        if (event.data?.size) chunks.push(event.data);
      };
      recorder.onerror = () => setTranscriptionError("Local audio recording failed. The interview connection is still active.");
      recorder.onstop = () => {
        void submitTranscriptionSegment(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
        if (transcriptionActiveRef.current) window.setTimeout(startTranscriptionSegment, 50);
      };
      recorderRef.current = recorder;
      recorder.start();
      recorderTimerRef.current = window.setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, 3500);
    } catch (requestError) {
      transcriptionActiveRef.current = false;
      setTranscribing(false);
      setTranscriptionError(requestError.message || "Local audio recording is not available in this browser.");
    }
  };

  const stopTranscription = () => {
    transcriptionActiveRef.current = false;
    if (recorderTimerRef.current) window.clearTimeout(recorderTimerRef.current);
    recorderTimerRef.current = null;
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    recorderRef.current = null;
    setTranscribing(false);
    setLiveText("");
  };

  const startTranscription = () => {
    // A participant starts local speech-to-text while holding the walkie-talkie
    // button. The transcript is saved to the shared interview room.
    if (!peerRef.current) return;
    if (transcriptionActiveRef.current) return;
    if (!supportsMediaRecorder) {
      setTranscriptionError("Local speech-to-text requires a browser with MediaRecorder support.");
      return;
    }
    if (!localStreamRef.current?.getAudioTracks?.().length) {
      setTranscriptionError("Join with the participant microphone enabled to start local transcription.");
      return;
    }
    setTranscriptionError("");
    setLiveText(`Listening to the ${isAdmin ? "interviewer" : "candidate"} microphone locally...`);
    transcriptionActiveRef.current = true;
    setTranscribing(true);
    startTranscriptionSegment();
  };

  const navigateFromSidebar = (view) => {
    if (isAdmin) {
      if (view === "admin") return navigate("/admin");
      if (view === "admin-jobs") return navigate("/admin/jobs");
      if (view === "admin-applications") return navigate("/admin/applications");
      if (view === "admin-interview-results") return navigate("/admin/interview-results");
      return navigate("/admin/interviews");
    }
    navigate(view === "jobs" ? "/jobs" : view === "interviews" ? "/interviews" : view === "skill-analysis" ? "/skill-analysis" : "/matching");
  };

  if (!user) return <Navigate to="/auth" replace />;

  return <div className={`cv-app-shell interview-room-shell ${isAdmin ? "interview-room-shell--admin" : ""}`}>
    <CvNavigation isOpen={navigationOpen} activeView={isAdmin ? "admin-interviews" : "interviews"} onNavigate={navigateFromSidebar} onClose={() => setNavigationOpen(false)} />
    <div className="cv-app-shell__main interview-room-shell__main">
      <CvTopbar activeView={isAdmin ? "admin-interviews" : "interviews"} onMenuToggle={() => setNavigationOpen(true)} />
      <main className="interview-room-page">
        <div className="interview-room-page__container">
          <button className="interview-room-back" type="button" onClick={() => navigate(isAdmin ? "/admin/interviews" : "/interviews")}><Icon name="arrowLeft" size={15} /> Back to interview schedule</button>
          {loading && <div className="interview-room-state"><span className="interview-room-loader" />Loading interview room...</div>}
          {!loading && error && <div className="interview-room-state interview-room-state--error"><Icon name="alert" size={24} /><strong>Could not open this room</strong><span>{error}</span>{interview && <button className="interview-room-button interview-room-button--primary" type="button" onClick={retryRoom}><Icon name="camera" size={16} />Retry with camera</button>}</div>}
          {!loading && !error && interview && <>
            <header className="interview-room-header"><div><span className="interview-room-eyebrow"><i /><Icon name="calendar" size={13} /> Private interview room</span><h1>{interview.job?.title || "Interview"}</h1><p>{interview.job?.company || "Hiring team"} · {new Date(interview.scheduledAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</p></div><span className="interview-room-role">{isAdmin ? "Interviewer" : "Candidate"}</span></header>
            <div className="interview-room-grid">
              {sameDeviceDemo && !isAdmin && joined && <button className={`interview-room-push-to-talk ${broadcasting ? "interview-room-push-to-talk--live" : ""}`} type="button" onPointerDown={(event) => { event.currentTarget.setPointerCapture?.(event.pointerId); void startPushToTalk(); }} onPointerUp={() => { void stopPushToTalk(); }} onPointerCancel={() => { void stopPushToTalk(); }} onPointerLeave={() => { void stopPushToTalk(); }} onKeyDown={(event) => { if ((event.key === "Enter" || event.key === " ") && !event.repeat) { event.preventDefault(); void startPushToTalk(); } }} onKeyUp={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); void stopPushToTalk(); } }}><Icon name={broadcasting ? "mic" : "camera"} size={18} /><span>{broadcasting ? "LIVE — release to stop" : "Hold to talk & share video"}</span><small>{broadcasting ? "Your camera and microphone are being sent to the interviewer." : "Press and hold this button to send your live answer."}</small></button>}
              {sameDeviceDemo && isAdmin && joined && <button className={`interview-room-push-to-talk ${broadcasting ? "interview-room-push-to-talk--live" : ""}`} type="button" onPointerDown={(event) => { event.currentTarget.setPointerCapture?.(event.pointerId); setBroadcastActive(true); }} onPointerUp={() => setBroadcastActive(false)} onPointerCancel={() => setBroadcastActive(false)} onPointerLeave={() => setBroadcastActive(false)} onKeyDown={(event) => { if ((event.key === "Enter" || event.key === " ") && !event.repeat) { event.preventDefault(); setBroadcastActive(true); } }} onKeyUp={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setBroadcastActive(false); } }}><Icon name={broadcasting ? "mic" : "camera"} size={18} /><span>{broadcasting ? "LIVE — release to stop" : "Hold to talk & share video"}</span><small>{broadcasting ? "Your camera and interviewer microphone are being sent to the candidate." : "Press and hold this button to send your live question."}</small></button>}
              <section className="interview-room-call" aria-labelledby="interview-call-title"><div className="interview-room-call__heading"><div><span className="interview-room-overline">Live connection</span><h2 id="interview-call-title">Interview room</h2></div><span className={`interview-room-connection ${joined ? "interview-room-connection--live" : ""}`}><i />{phase}</span></div><div className="interview-room-stage"><audio ref={remoteAudioRef} autoPlay playsInline /><div className="interview-room-video-grid"><div className="interview-room-video-tile"><div className="interview-room-video-tile__media">{localStream?.getVideoTracks?.().length ? <video ref={localVideoRef} className="interview-room-stage__video" muted autoPlay playsInline /> : <div className="interview-room-stage__placeholder"><Icon name="person" size={28} /><span>{joined ? "Camera off" : "Your camera preview"}</span></div>}</div><span className="interview-room-video-tile__label">You</span></div><div className="interview-room-video-tile"><div className="interview-room-video-tile__media">{remoteVideoFrame ? <img className="interview-room-stage__video" src={remoteVideoFrame} alt="Live participant video" /> : remoteStream?.getVideoTracks?.().length ? <video ref={remoteVideoRef} className="interview-room-stage__video" autoPlay playsInline /> : <div className="interview-room-stage__placeholder"><Icon name="people" size={28} /><span>{remoteStream ? "Camera off" : "Waiting for participant"}</span></div>}</div><span className="interview-room-video-tile__label">{isAdmin ? "Candidate" : "Interviewer"}</span></div></div><div className="interview-room-stage__status"><strong>{remoteStream || remoteVideoFrame ? "Participant connected" : "Waiting for participant"}</strong><span>{joined ? "Your video and the other participant's video appear here." : "Join the room to start the camera and audio connection."}</span></div></div><div className="interview-room-controls">{!joined ? <><label className="interview-room-toggle"><input type="checkbox" checked={audioRequested} onChange={(event) => setAudioRequested(event.target.checked)} /><Icon name="mic" size={14} /><span>Join with microphone</span></label><label className="interview-room-toggle"><input type="checkbox" checked={videoRequested} onChange={(event) => setVideoRequested(event.target.checked)} /><Icon name="camera" size={14} /><span>Join with camera</span></label><button className="interview-room-button interview-room-button--primary" type="button" onClick={joinRoom}><Icon name="people" size={16} />Join interview room</button></> : <><button className="interview-room-button interview-room-button--quiet" type="button" onClick={toggleMicrophone} disabled={!audioEnabled && !localStreamRef.current?.getAudioTracks().length}><Icon name={audioEnabled ? "mic" : "micOff"} size={16} />{audioEnabled ? "Mute microphone" : "Microphone muted"}</button><button className="interview-room-button interview-room-button--quiet" type="button" onClick={toggleCamera}><Icon name="camera" size={16} />{videoEnabled ? "Turn camera off" : "Turn camera on"}</button><button className="interview-room-button interview-room-button--danger" type="button" onClick={leaveRoom}><Icon name="close" size={16} />Leave room</button></>}</div><p className="interview-room-device-note"><Icon name="info" size={14} />Same-device demo: only the participant holding the walkie-talkie uses the laptop camera and microphone. Hold the button to send your live video, voice, and question or answer.</p></section>
              <aside className="interview-transcript-card" aria-labelledby="interview-transcript-title"><div className="interview-transcript-card__heading"><div><span className="interview-room-overline">Local speech-to-text</span><h2 id="interview-transcript-title">Interview transcript</h2></div><span className={transcribing ? "interview-transcript-status interview-transcript-status--live" : "interview-transcript-status"}><i />{transcribing ? "Listening locally" : isAdmin ? "Ready" : "Waiting for interviewer"}</span></div><p className="interview-transcript-intro">The interviewer microphone is transcribed locally with Whisper and shared with both people in this room.</p><div className="interview-transcript-actions"><select value={language} onChange={(event) => setLanguage(event.target.value)} disabled={transcribing}><option value="en-US">English</option><option value="si-LK">Sinhala</option><option value="ta-LK">Tamil</option></select>{isAdmin ? (transcribing ? <button type="button" onClick={stopTranscription}>Stop local transcription</button> : <button type="button" onClick={startTranscription} disabled={!joined || !supportsMediaRecorder}>{supportsMediaRecorder ? "Start local transcription" : "MediaRecorder unavailable"}</button>) : <button type="button" disabled>Waiting for interviewer</button>}</div>{transcriptionError && <p className="interview-transcript-error" role="alert">{transcriptionError}</p>}<div className="interview-transcript-list">{transcript.length === 0 && !liveText && <div className="interview-transcript-empty"><Icon name="message" size={24} /><strong>No transcript yet</strong><span>{joined ? "The interviewer transcript will appear here." : "Join the room first."}</span></div>}{transcript.map((entry) => <article className="interview-transcript-line" key={entry.id}><span>{entry.speakerName || "Participant"}</span><p>{entry.text}</p></article>)}{liveText && <article className="interview-transcript-line interview-transcript-line--live"><span>Listening now</span><p>{liveText}</p></article>}</div></aside>
            </div>
            <InterviewAnalysisPanel interviewId={interviewId} isAdmin={isAdmin} />
          </>}
        </div>
      </main>
    </div>
  </div>;
}

export default InterviewRoomPage;
