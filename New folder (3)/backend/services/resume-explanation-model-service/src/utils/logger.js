export const log = (level, event, fields = {}) => console.log(JSON.stringify({
  timestamp: new Date().toISOString(), service: "resume-explanation-model-service", level, event, ...fields,
}));
