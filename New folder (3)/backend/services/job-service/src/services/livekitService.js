import { AccessToken } from "livekit-server-sdk";
import { env } from "../config/env.js";

const roomName = (interviewId) => `interview-${interviewId}`;

const requireConfig = () => {
  if (env.livekit.url && env.livekit.apiKey && env.livekit.apiSecret) return;
  throw Object.assign(new Error("LiveKit is not configured on the server"), { statusCode: 503 });
};

export const createInterviewLiveKitToken = async ({ interviewId, userId, role, name }) => {
  requireConfig();
  const token = new AccessToken(env.livekit.apiKey, env.livekit.apiSecret, {
    identity: `${role}-${userId}`,
    name,
    ttl: "2h",
    metadata: JSON.stringify({ interviewId, role }),
  });
  token.addGrant({
    room: roomName(interviewId),
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });
  return { serverUrl: env.livekit.url, roomName: roomName(interviewId), token: await token.toJwt() };
};
