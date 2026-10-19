const definitions = [
  ["frontend", 5173, "npm --prefix frontend run dev", "blue"],
  ["gateway", 8080, "npm --prefix backend/api-gateway run dev", "green"],
  ["extraction", 4001, "npm --prefix backend/services/cv-extraction-service run dev", "cyan"],
  ["matching", 4002, "npm --prefix backend/services/cv-matching-service run dev", "magenta"],
  ["attrition", 4003, "node scripts/start-local-attrition.mjs", "yellow"],
  ["attrition-model", 4008, "npm run dev:attrition-model", "yellowBright"],
  ["early-attrition-model", 4011, "npm run dev:early-attrition-model", "red"],
  ["strength", 4009, "npm run dev:resume-strength-model", "blueBright"],
  ["answer-model", 4010, "npm run dev:interview-answer-model", "magentaBright"],
  ["speech", 4005, "python -m uvicorn server:app --app-dir backend/services/speech-to-text-service/src --host 127.0.0.1 --port 4005", "gray"],
  ["auth", 3001, "npm --prefix backend/services/auth-service start", "gray"],
  ["candidate", 3002, "npm --prefix backend/services/candidate-service run dev", "white"],
  ["jobs", 4004, "npm --prefix backend/services/job-service run dev", "red"],
  ["analysis", 4006, "npm --prefix backend/services/interview-analysis-service run dev", "greenBright"],
  ["cvprofile", 4007, "npm --prefix backend/services/cv-profile-analysis-service run dev", "cyanBright"],
  ["explanation-model", 4012, "npm run dev:resume-explanation-model", "cyanBright"],
  ["certificate-model", 4013, "npm run dev:certificate-model", "cyanBright"],
];
const fullOnly = new Set(["answer-model", "speech", "auth", "candidate", "jobs", "analysis"]);

export const localDevServices = (core = false) => definitions
  .filter(([name]) => !core || !fullOnly.has(name))
  .map(([name, port, command, prefixColor]) => ({ name, port, command, prefixColor }));
