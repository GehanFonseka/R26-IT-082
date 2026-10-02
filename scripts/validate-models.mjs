import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const modelRootArg = process.argv.find((arg) => arg.startsWith("--model-root="))?.split("=")[1]
  || process.env.MODEL_ROOT;

console.log("=================================================");
console.log("   Lanka Talent Insights — Model Artifact Check   ");
console.log("=================================================");
if (modelRootArg) {
  console.log(`Using MODEL_ROOT: ${path.resolve(modelRootArg)}\n`);
} else {
  console.log(`Using default repository service model paths\n`);
}

function resolvePath(serviceDir, subpath, rootSubpath) {
  if (modelRootArg) {
    return path.resolve(modelRootArg, rootSubpath);
  }
  return path.resolve(rootDir, "backend/services", serviceDir, subpath);
}

const checks = [
  {
    name: "cv-matching model (ONNX BERT)",
    files: [
      resolvePath("cv-matching-service", "model/onnx/model.onnx", "cv-matching/onnx/model.onnx"),
      resolvePath("cv-matching-service", "model/config.json", "cv-matching/config.json"),
      resolvePath("cv-matching-service", "model/tokenizer.json", "cv-matching/tokenizer.json"),
    ],
  },
  {
    name: "interview-analysis model (ONNX DeBERTa)",
    files: [
      resolvePath("interview-analysis-service", "model/onnx/model_quantized.onnx", "interview-analysis/onnx/model_quantized.onnx"),
      resolvePath("interview-analysis-service", "model/config.json", "interview-analysis/config.json"),
    ],
  },
  {
    name: "speech-to-text model (Faster-Whisper)",
    files: [
      // Check tiny or small.en
      fs.existsSync(resolvePath("speech-to-text-service", "model/tiny/model.bin", "speech-to-text/tiny/model.bin"))
        ? resolvePath("speech-to-text-service", "model/tiny/model.bin", "speech-to-text/tiny/model.bin")
        : resolvePath("speech-to-text-service", "model/small.en/model.bin", "speech-to-text/small.en/model.bin"),
    ],
  },
  {
    name: "resume-strength model (DeBERTa)",
    files: [
      resolvePath("resume-strength-model-service", "model/model.safetensors", "resume-strength/model.safetensors"),
      resolvePath("resume-strength-model-service", "model/config.json", "resume-strength/config.json"),
    ],
  },
  {
    name: "interview-answer V5 checkpoint (ASAG)",
    files: [
      resolvePath("interview-answer-model-service", "model/v5/model_state.pt", "interview-answer/v5/model_state.pt"),
      resolvePath("interview-answer-model-service", "model/v5/model_config.json", "interview-answer/v5/model_config.json"),
    ],
  },
  {
    name: "interview-answer NLI model (DeBERTa cross-encoder)",
    files: [
      resolvePath("interview-answer-model-service", "model/nli/model.safetensors", "interview-answer/nli/model.safetensors"),
      resolvePath("interview-answer-model-service", "model/nli/config.json", "interview-answer/nli/config.json"),
    ],
  },
  {
    name: "attrition model (CatBoost V7 & dataset)",
    files: [
      resolvePath("attrition-model-service", "attrition_risk_catboost_v7_optuna.joblib", "attrition/attrition_risk_catboost_v7_optuna.joblib"),
      resolvePath("attrition-model-service", "Sri_Lankan_Hiring_Attrition_Dataset.csv", "attrition/Sri_Lankan_Hiring_Attrition_Dataset.csv"),
    ],
  },
  {
    name: "early-attrition model (Logistic Regression)",
    files: [
      resolvePath("early-attrition-model-service", "model/model.pkl", "early-attrition/model.pkl"),
    ],
  },
];

let allPassed = true;

for (const check of checks) {
  let checkPassed = true;
  for (const filePath of check.files) {
    if (!fs.existsSync(filePath)) {
      console.error(`✗ Missing: ${check.name} -> ${filePath}`);
      checkPassed = false;
      allPassed = false;
    } else {
      const stats = fs.statSync(filePath);
      if (stats.size === 0) {
        console.error(`✗ Empty file (0 bytes): ${check.name} -> ${filePath}`);
        checkPassed = false;
        allPassed = false;
      }
    }
  }
  if (checkPassed) {
    console.log(`✓ ${check.name}`);
  }
}

console.log("-------------------------------------------------");
if (allPassed) {
  console.log("Status: ALL REQUIRED MODEL ARTIFACTS ARE PRESENT\n");
  process.exit(0);
} else {
  console.error("Status: ONE OR MORE MODEL ARTIFACTS ARE MISSING\n");
  process.exit(1);
}
