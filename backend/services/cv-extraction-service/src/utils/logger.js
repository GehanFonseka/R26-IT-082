export const log = (level, event, fields = {}) => console.log(JSON.stringify({
  timestamp: new Date().toISOString(), service: "cv-extraction-service", level, event, ...fields,
}));
