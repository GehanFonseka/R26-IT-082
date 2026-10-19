import { env } from "../config/env.js";
const privateKey = /(password|token|secret|credential|authorization)/i;
export const log = (level, event, fields = {}) => console.log(JSON.stringify({
  timestamp: new Date().toISOString(), service: env.serviceName, level, event,
  ...Object.fromEntries(Object.entries(fields).filter(([key]) => !privateKey.test(key))),
}));
