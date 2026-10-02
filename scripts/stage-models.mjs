import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const outDir = path.resolve(rootDir, "models-s3");

console.log("=================================================");
console.log("   Lanka Talent Insights — Stage Models for S3   ");
console.log("=================================================");
console.log(`Target directory: ${outDir}\n`);

// Clean staging dir if exists
if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true, force: true });
}
fs.mkdirSync(outDir, { recursive: true });

function linkOrCopy(src, dst) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  if (fs.existsSync(dst)) return;
  try {
    fs.linkSync(src, dst);
  } catch {
    fs.copyFileSync(src, dst);
  }
}

function copyDirRecursive(srcDir, dstDir, filterFn) {
  if (!fs.existsSync(srcDir)) return;
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const dstPath = path.join(dstDir, entry.name);
    if (filterFn && !filterFn(srcPath, entry)) continue;
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, dstPath, filterFn);
    } else {
      linkOrCopy(srcPath, dstPath);
    }
  }
}

// 1. cv-matching
console.log("Staging cv-matching...");
copyDirRecursive(
  path.join(rootDir, "backend/services/cv-matching-service/model"),
  path.join(outDir, "cv-matching"),
  (_, e) => e.name !== ".cache"
);

// 2. interview-analysis
console.log("Staging interview-analysis...");
copyDirRecursive(
  path.join(rootDir, "backend/services/interview-analysis-service/model"),
  path.join(outDir, "interview-analysis"),
  (_, e) => e.name !== ".cache"
);

// 3. speech-to-text (tiny and small.en, exclude .git and .cache)
console.log("Staging speech-to-text...");
copyDirRecursive(
  path.join(rootDir, "backend/services/speech-to-text-service/model"),
  path.join(outDir, "speech-to-text"),
  (fullPath, e) => {
    if (e.name === ".git" || e.name === ".cache") return false;
    if (fullPath.includes(".git")) return false;
    return true;
  }
);

// 4. resume-strength (exclude training plots and heavy training csv)
console.log("Staging resume-strength...");
copyDirRecursive(
  path.join(rootDir, "backend/services/resume-strength-model-service/model"),
  path.join(outDir, "resume-strength"),
  (_, e) => {
    if (e.name === ".cache") return false;
    if (e.name.endsWith(".png")) return false;
    if (e.name === "training_data_all.csv") return false;
    if (e.name === "test_predictions.csv") return false;
    if (e.name === "hyperparameter_comparison.csv") return false;
    if (e.name === "per_skill_summary.csv") return false;
    return true;
  }
);

// 5. interview-answer (v5 and nli only, exclude cache & training plots)
console.log("Staging interview-answer...");
copyDirRecursive(
  path.join(rootDir, "backend/services/interview-answer-model-service/model/v5"),
  path.join(outDir, "interview-answer/v5"),
  (fullPath, e) => {
    if (e.name.endsWith(".png")) return false;
    if (e.name.endsWith(".csv") && e.name !== "model_config.json") return false;
    return true;
  }
);
copyDirRecursive(
  path.join(rootDir, "backend/services/interview-answer-model-service/model/nli"),
  path.join(outDir, "interview-answer/nli"),
  (fullPath, e) => {
    if (e.name === ".cache" || fullPath.includes(".cache")) return false;
    return true;
  }
);

// 6. attrition (only CatBoost model and dataset)
console.log("Staging attrition...");
linkOrCopy(
  path.join(rootDir, "backend/services/attrition-model-service/attrition_risk_catboost_v7_optuna.joblib"),
  path.join(outDir, "attrition/attrition_risk_catboost_v7_optuna.joblib")
);
linkOrCopy(
  path.join(rootDir, "backend/services/attrition-model-service/Sri_Lankan_Hiring_Attrition_Dataset.csv"),
  path.join(outDir, "attrition/Sri_Lankan_Hiring_Attrition_Dataset.csv")
);

// 7. early-attrition (model.pkl)
console.log("Staging early-attrition...");
linkOrCopy(
  path.join(rootDir, "backend/services/early-attrition-model-service/model/model.pkl"),
  path.join(outDir, "early-attrition/model.pkl")
);

console.log("\nStaging completed successfully!");
console.log(`Models staged at: ${outDir}\n`);
