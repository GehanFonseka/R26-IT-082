const privateKeys = /(password|token|secret|credential|authorization)/i;

export const log = (level, event, fields = {}) => {
  const safeFields = Object.fromEntries(
    Object.entries(fields).filter(([key]) => !privateKeys.test(key)),
  );
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    service: "api-gateway",
    level,
    event,
    ...safeFields,
  }));
};
